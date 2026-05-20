import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
import { normalizeTrack, normalizeYear, trackSchema, yearSchema } from "@/features/access/lib/studyAccess";
import { upsertChargeFromWebhook } from "@/features/admin/server/stripePaymentsRepo";
import { ADMIN_FINANCE_CACHE_TAG } from "@/features/admin/server/loadAdminFinance";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Brak stripe-signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook nie jest skonfigurowany." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripeServerClient();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] invalid signature", error);
    return NextResponse.json({ error: "Nieprawidłowa sygnatura." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (
      event.type === "charge.succeeded" ||
      event.type === "charge.updated" ||
      event.type === "charge.refunded" ||
      event.type === "charge.failed"
    ) {
      await upsertChargeFromWebhook(event.data.object as Stripe.Charge);
      revalidateTag(ADMIN_FINANCE_CACHE_TAG, "max");
    }
  } catch (error) {
    console.error(`[stripe-webhook] ${event.type} failed`, error);
    return NextResponse.json({ error: "Błąd przetwarzania webhooka." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const rawTrack = session.metadata?.track;
  const rawYear = Number(session.metadata?.year);

  if (!userId || !rawTrack || !rawYear) {
    throw new Error("Brak wymaganych metadanych user_id/track/year.");
  }

  const parsedTrack = trackSchema.safeParse(rawTrack);
  const parsedYear = yearSchema.safeParse(rawYear);
  if (!parsedTrack.success || !parsedYear.success) {
    throw new Error("Nieprawidłowe metadata track/year.");
  }

  const track = normalizeTrack(parsedTrack.data);
  const year = normalizeYear(parsedYear.data);
  const admin = createAdminClient();

  const { error: entitlementError } = await admin.from("user_year_entitlements").upsert(
    {
      user_id: userId,
      track,
      year,
      access_type: "paid",
      active: true,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    },
    { onConflict: "user_id,track,year" },
  );

  if (entitlementError) {
    throw new Error(`Entitlement upsert failed: ${entitlementError.message}`);
  }

  const customerId = typeof session.customer === "string" ? session.customer : null;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      current_track: track,
      current_year: year,
      stripe_customer_id: customerId,
      subscription_status: "active",
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Profile update failed: ${profileError.message}`);
  }
}
