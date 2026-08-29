"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";
import { getStripePriceIdForOffer } from "@/features/access/lib/stripePrices";
import { resolveGateOfferById, KNNP_YEAR_OFFERS, type GateOffer } from "@/features/access/lib/gateCatalog";
import {
  isFreeTestSelection,
  isRegistrationClosedForSelection,
  selectionSchema,
} from "@/features/access/lib/studyAccess";
import { isUserAccessRevoked } from "@/lib/auth/accessRevocation";
import { ACCESS_REVOKED_QUERY } from "@/lib/auth/accountBan";
import { buildStripeTermsAcceptanceMessage } from "@/features/checkout/constants/consentText";

type CheckoutErrorReason =
  | "invalid-selection"
  | "registration-closed"
  | "no-session"
  | "stripe-missing-secret"
  | "stripe-missing-price"
  | "stripe-call-failed"
  | "stripe-no-url"
  | "supabase-profile-read"
  | "unknown";

function checkoutErrorUrl(reason: CheckoutErrorReason): string {
  return `/wybor-roku?status=error&reason=${reason}`;
}

async function getOriginFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function offerFromForm(formData: FormData): GateOffer | null {
  const offerId = z.string().min(1).safeParse(formData.get("offerId"));
  if (offerId.success) {
    return resolveGateOfferById(offerId.data);
  }
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) return null;
  return (
    KNNP_YEAR_OFFERS.find(
      (offer) => offer.track === parsed.data.track && offer.year === parsed.data.year,
    ) ?? null
  );
}

export async function createCheckoutSessionAction(formData: FormData) {
  const offer = offerFromForm(formData);
  if (!offer) {
    redirect(checkoutErrorUrl("invalid-selection"));
  }
  if (offer.kind === "year" && offer.isFreeTest) {
    redirect("/wybor-roku");
  }
  if (offer.kind === "year" && isRegistrationClosedForSelection(offer.track, offer.year)) {
    redirect(checkoutErrorUrl("registration-closed"));
  }
  if (offer.kind === "year" && isFreeTestSelection(offer.track, offer.year)) {
    redirect("/wybor-roku");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (await isUserAccessRevoked(user.id)) {
    redirect(`/wybor-roku?${ACCESS_REVOKED_QUERY}=1`);
  }

  let checkoutUrl: string | null = null;
  let failureReason: CheckoutErrorReason | null = null;
  const offerKey = offer.kind === "duration" ? offer.offerKey : "";

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      failureReason = "stripe-missing-secret";
      throw new Error("STRIPE_SECRET_KEY env not configured");
    }

    let priceId: string;
    try {
      priceId = getStripePriceIdForOffer(offer);
    } catch (priceError) {
      console.error("[createCheckoutSessionAction] price lookup failed", priceError);
      failureReason = "stripe-missing-price";
      throw priceError;
    }

    const origin = await getOriginFromHeaders();
    const stripe = getStripeServerClient();
    const tCheckout = await getTranslations("checkout");

    const profileResult = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[createCheckoutSessionAction] profile read failed", profileResult.error.message);
      failureReason = "supabase-profile-read";
      throw profileResult.error;
    }

    const metadata = {
      user_id: user.id,
      product: offer.product,
      offer_key: offerKey,
      track: offer.track,
      year: String(offer.year),
      access_days: String(offer.accessDays),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/wybor-roku?status=success`,
      cancel_url: `${origin}/wybor-roku?status=cancel`,
      customer: profileResult.data?.stripe_customer_id ?? undefined,
      customer_email: profileResult.data?.stripe_customer_id ? undefined : user.email ?? undefined,
      allow_promotion_codes: true,
      consent_collection: {
        terms_of_service: "required",
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: buildStripeTermsAcceptanceMessage(origin, tCheckout),
        },
      },
      metadata,
      payment_intent_data: {
        metadata,
      },
    });

    checkoutUrl = session.url ?? null;
    if (!checkoutUrl) {
      console.error("[createCheckoutSessionAction] missing checkout url");
      failureReason = "stripe-no-url";
    }
  } catch (error) {
    console.error("[createCheckoutSessionAction] stripe call failed", error);
    if (!failureReason) {
      failureReason = "stripe-call-failed";
    }
  }

  if (!checkoutUrl) {
    redirect(checkoutErrorUrl(failureReason ?? "unknown"));
  }

  redirect(checkoutUrl);
}
