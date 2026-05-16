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

async function getUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Brak aktywnej sesji użytkownika.");
  }
  return { user, supabase };
}

export async function activateFreeTestYearAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    throw new Error("Nieprawidłowy wybór kierunku lub roku.");
  }
  if (!isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    throw new Error("Darmowy dostęp jest dostępny tylko dla Stomatologia rok 2.");
  }

  const { user, supabase } = await getUserOrThrow();
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
    throw new Error(`Nie udało się zapisać wyboru roku: ${profileError.message}`);
  }

  redirect("/pulpit");
}

export async function createCheckoutSessionAction(formData: FormData) {
  const parsed = selectionSchema.safeParse({
    track: formData.get("track"),
    year: formData.get("year"),
  });
  if (!parsed.success) {
    throw new Error("Nieprawidłowy wybór kierunku lub roku.");
  }

  if (isFreeTestSelection(parsed.data.track, parsed.data.year)) {
    redirect("/wybor-roku");
  }

  const { user, supabase } = await getUserOrThrow();
  const origin = await getOriginFromHeaders();
  const priceId = getStripePriceId(parsed.data.track, parsed.data.year);
  const stripe = getStripeServerClient();

  const profileResult = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(`Nie udało się odczytać profilu: ${profileResult.error.message}`);
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

  if (!session.url) {
    throw new Error("Stripe nie zwrócił adresu Checkout.");
  }

  redirect(session.url);
}

export async function createBillingPortalSessionAction() {
  const { user, supabase } = await getUserOrThrow();
  const origin = await getOriginFromHeaders();
  const stripe = getStripeServerClient();

  const profileResult = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(`Nie udało się odczytać profilu: ${profileResult.error.message}`);
  }

  const customerId = profileResult.data?.stripe_customer_id;
  if (!customerId) {
    redirect("/cennik");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/ustawienia`,
  });

  redirect(session.url);
}

export async function completeCheckoutActivationAction() {
  const { user } = await getUserOrThrow();
  const hasAccess = await hasAnyActiveEntitlement(user.id);

  if (hasAccess) {
    redirect("/pulpit");
  }

  redirect("/wybor-roku?status=pending");
}
