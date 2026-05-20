import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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
