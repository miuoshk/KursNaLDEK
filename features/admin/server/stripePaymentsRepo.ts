import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeProduct, normalizeTrack, normalizeYear, type StudyProduct, type StudyTrack, type StudyYear } from "@/features/access/lib/studyAccess";

/**
 * Lokalna replika danych płatności Stripe.
 *
 * Tabela `stripe_payments` jest źródłem prawdy dla statystyk finansowych
 * w panelu /admin. Webhook + endpoint backfillu zapisują dane przez
 * service-role klienta (RLS w tabeli pozwala tylko na SELECT dla admina).
 */

export type StripePaymentRow = {
  id: string;
  customer_id: string | null;
  payment_intent_id: string | null;
  checkout_session_id: string | null;
  amount: number;
  amount_refunded: number;
  currency: string;
  status: string;
  refunded: boolean;
  paid: boolean;
  user_id: string | null;
  track: string | null;
  year: number | null;
  metadata: Record<string, unknown> | null;
  stripe_created_at: string;
};

export type ResolvedChargeEntitlement = {
  userId: string;
  track: StudyTrack;
  year: StudyYear;
  product: StudyProduct;
};

function chargeToRow(charge: Stripe.Charge): StripePaymentRow {
  const metadata = (charge.metadata ?? {}) as Record<string, string | undefined>;
  const userId = metadata.user_id ?? metadata.userId ?? null;
  const track =
    metadata.track === "lekarski" || metadata.track === "stomatologia"
      ? metadata.track
      : null;
  const yearRaw = metadata.year ? Number(metadata.year) : null;
  const year = yearRaw && Number.isFinite(yearRaw) ? yearRaw : null;

  return {
    id: charge.id,
    customer_id: typeof charge.customer === "string" ? charge.customer : null,
    payment_intent_id:
      typeof charge.payment_intent === "string" ? charge.payment_intent : null,
    checkout_session_id: null,
    amount: charge.amount ?? 0,
    amount_refunded: charge.amount_refunded ?? 0,
    currency: charge.currency ?? "pln",
    status: charge.status ?? "pending",
    refunded: charge.refunded ?? false,
    paid: charge.paid ?? false,
    user_id: userId,
    track,
    year,
    metadata: Object.keys(metadata).length > 0 ? (charge.metadata as Record<string, unknown>) : null,
    stripe_created_at: new Date((charge.created ?? 0) * 1000).toISOString(),
  };
}

export async function resolveChargeEntitlement(
  charge: Stripe.Charge,
): Promise<ResolvedChargeEntitlement | null> {
  const row = chargeToRow(charge);
  if (row.user_id && row.track && row.year) {
    const metadata = (charge.metadata ?? {}) as Record<string, string | undefined>;
    return {
      userId: row.user_id,
      track: normalizeTrack(row.track),
      year: normalizeYear(row.year),
      product: normalizeProduct(metadata.product),
    };
  }

  const paymentIntentId = row.payment_intent_id;
  if (!paymentIntentId) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_year_entitlements")
    .select("user_id, track, year, product")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    console.error("[stripePaymentsRepo] resolveChargeEntitlement", error.message);
    return null;
  }

  if (!data?.user_id) {
    return null;
  }

  return {
    userId: data.user_id as string,
    track: normalizeTrack(data.track as string),
    year: normalizeYear(data.year as number),
    product: normalizeProduct(data.product as string | null | undefined),
  };
}

export function isChargeFullyRefunded(charge: Stripe.Charge): boolean {
  if (charge.refunded) {
    return true;
  }
  const amount = charge.amount ?? 0;
  const refunded = charge.amount_refunded ?? 0;
  return amount > 0 && refunded >= amount;
}

export async function upsertCharges(charges: Stripe.Charge[]): Promise<number> {
  if (charges.length === 0) return 0;
  const admin = createAdminClient();
  const rows = charges.map(chargeToRow);

  // Supabase upsert ma limit ok. kilku tysięcy wierszy na jedno zapytanie —
  // batchujemy po 500 dla bezpieczeństwa.
  const BATCH = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await admin
      .from("stripe_payments")
      .upsert(slice, { onConflict: "id" });
    if (error) {
      console.error("[stripePaymentsRepo] upsert error", error.message);
      throw new Error(`Stripe payments upsert failed: ${error.message}`);
    }
    written += slice.length;
  }
  return written;
}

/** Wygodny wrapper dla pojedynczego zdarzenia z webhooka. */
export async function upsertChargeFromWebhook(charge: Stripe.Charge): Promise<void> {
  await upsertCharges([charge]);
}

/** Zwraca liczbę wierszy z ostatnich N dni — używane do detekcji „pusta tabela”. */
export async function countRecentPayments(sinceDays: number): Promise<number> {
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { count, error } = await admin
    .from("stripe_payments")
    .select("id", { count: "exact", head: true })
    .gte("stripe_created_at", sinceIso);
  if (error) {
    console.error("[stripePaymentsRepo] count error", error.message);
    return 0;
  }
  return count ?? 0;
}
