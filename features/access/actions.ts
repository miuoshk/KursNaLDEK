"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";
import { grantFreeTestEntitlement } from "@/features/access/server/grantFreeTestEntitlement";
import { getStripePriceId } from "@/features/access/lib/stripePrices";
import { isFreeTestSelection, selectionSchema } from "@/features/access/lib/studyAccess";
import { hasAnyActiveEntitlement } from "@/features/access/server/entitlements";

type ErrorReason =
  | "invalid-selection"
  | "free-only-stoma2"
  | "no-session"
  | "stripe-missing-secret"
  | "stripe-missing-price"
  | "stripe-call-failed"
  | "stripe-no-url"
  | "supabase-profile-read"
  | "supabase-profile-update"
  | "entitlement-grant-failed"
  | "unknown";

function errorRedirectUrl(reason: ErrorReason): string {
  return `/wybor-roku?status=error&reason=${reason}`;
}

async function getOriginFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase };
  }
  return { user, supabase };
}

export async function activateFreeTestYearAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    redirect(errorRedirectUrl("invalid-selection"));
  }
  if (!isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect(errorRedirectUrl("free-only-stoma2"));
  }

  const { user, supabase } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  let failureReason: ErrorReason | null = null;
  try {
    await grantFreeTestEntitlement({
      userId: user.id,
      track: parsed.data.track,
      year: parsed.data.year,
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        current_track: parsed.data.track,
        current_year: parsed.data.year,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[activateFreeTestYearAction] profile update failed", profileError.message);
      failureReason = "supabase-profile-update";
    }
  } catch (error) {
    console.error("[activateFreeTestYearAction] failed", error);
    failureReason = "entitlement-grant-failed";
  }

  if (failureReason) {
    redirect(errorRedirectUrl(failureReason));
  }

  redirect("/pulpit");
}

export async function createCheckoutSessionAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    redirect(errorRedirectUrl("invalid-selection"));
  }

  if (isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect("/wybor-roku");
  }

  const { user, supabase } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  let checkoutUrl: string | null = null;
  let failureReason: ErrorReason | null = null;

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
    redirect(errorRedirectUrl(failureReason ?? "unknown"));
  }

  redirect(checkoutUrl);
}

export async function createBillingPortalSessionAction() {
  const { user, supabase } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  let portalUrl: string | null = null;
  let needsCheckout = false;

  try {
    const origin = await getOriginFromHeaders();
    const stripe = getStripeServerClient();

    const profileResult = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[createBillingPortalSessionAction] profile read failed", profileResult.error.message);
    }

    const customerId = profileResult.data?.stripe_customer_id ?? null;
    if (!customerId) {
      needsCheckout = true;
    } else {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/ustawienia`,
      });
      portalUrl = session.url ?? null;
    }
  } catch (error) {
    console.error("[createBillingPortalSessionAction] stripe call failed", error);
  }

  if (needsCheckout) {
    redirect("/cennik");
  }
  if (!portalUrl) {
    redirect("/ustawienia?billing=error");
  }
  redirect(portalUrl);
}

export async function completeCheckoutActivationAction() {
  const { user } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }
  const hasAccess = await hasAnyActiveEntitlement(user.id);

  if (hasAccess) {
    redirect("/pulpit");
  }

  redirect("/wybor-roku?status=pending");
}
