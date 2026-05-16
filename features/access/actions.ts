"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";
import { grantFreeTestEntitlement } from "@/features/access/server/grantFreeTestEntitlement";
import { getStripePriceId } from "@/features/access/lib/stripePrices";
import { isFreeTestSelection, selectionSchema } from "@/features/access/lib/studyAccess";
import { hasAnyActiveEntitlement } from "@/features/access/server/entitlements";

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
    redirect("/wybor-roku?status=error");
  }
  if (!isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect("/wybor-roku?status=error");
  }

  const { user, supabase } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  let activationFailed = false;
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
      activationFailed = true;
    }
  } catch (error) {
    console.error("[activateFreeTestYearAction] failed", error);
    activationFailed = true;
  }

  if (activationFailed) {
    redirect("/wybor-roku?status=error");
  }

  redirect("/pulpit");
}

export async function createCheckoutSessionAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    redirect("/wybor-roku?status=error");
  }

  if (isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect("/wybor-roku");
  }

  const { user, supabase } = await getUserOrNull();
  if (!user) {
    redirect("/login");
  }

  let checkoutUrl: string | null = null;
  try {
    const origin = await getOriginFromHeaders();
    const priceId = getStripePriceId(parsed.data.track, parsed.data.year);
    const stripe = getStripeServerClient();

    const profileResult = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      console.error("[createCheckoutSessionAction] profile read failed", profileResult.error.message);
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
    }
  } catch (error) {
    console.error("[createCheckoutSessionAction] stripe call failed", error);
  }

  if (!checkoutUrl) {
    redirect("/wybor-roku?status=error");
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
