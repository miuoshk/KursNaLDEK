"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";
import { getStripePriceId } from "@/features/access/lib/stripePrices";
import {
  isFreeTestSelection,
  isRegistrationClosedForSelection,
  selectionSchema,
} from "@/features/access/lib/studyAccess";
import { isUserAccessRevoked } from "@/lib/auth/accessRevocation";
import { ACCESS_REVOKED_QUERY } from "@/lib/auth/accountBan";
import {
  CONSUMER_CONSENT_FIELD,
  isConsumerConsentAccepted,
} from "@/features/checkout/constants/consentText";
import { logConsumerConsent } from "@/features/checkout/server/logConsumerConsent";

type CheckoutErrorReason =
  | "invalid-selection"
  | "registration-closed"
  | "consent-required"
  | "consent-log-failed"
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

export async function createCheckoutSessionAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    redirect(checkoutErrorUrl("invalid-selection"));
  }

  if (isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect("/wybor-roku");
  }

  if (isRegistrationClosedForSelection(parsed.data.track, parsed.data.year)) {
    redirect(checkoutErrorUrl("registration-closed"));
  }

  if (!isConsumerConsentAccepted(formData.get(CONSUMER_CONSENT_FIELD))) {
    redirect(checkoutErrorUrl("consent-required"));
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

  const consentResult = await logConsumerConsent(supabase, user.id);
  if (!consentResult.ok) {
    redirect(checkoutErrorUrl("consent-log-failed"));
  }

  let checkoutUrl: string | null = null;
  let failureReason: CheckoutErrorReason | null = null;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      failureReason = "stripe-missing-secret";
      throw new Error("STRIPE_SECRET_KEY env not configured");
    }

    let priceId: string;
    try {
      priceId = getStripePriceId(parsed.data.track, parsed.data.year);
    } catch (priceError) {
      console.error("[createCheckoutSessionAction] price lookup failed", priceError);
      failureReason = "stripe-missing-price";
      throw priceError;
    }

    const origin = await getOriginFromHeaders();
    const stripe = getStripeServerClient();

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/wybor-roku?status=success`,
      cancel_url: `${origin}/wybor-roku?status=cancel`,
      customer: profileResult.data?.stripe_customer_id ?? undefined,
      customer_email: profileResult.data?.stripe_customer_id ? undefined : user.email ?? undefined,
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        track: parsed.data.track,
        year: String(parsed.data.year),
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
