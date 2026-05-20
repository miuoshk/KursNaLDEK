import "server-only";

import type Stripe from "stripe";
import { getStripeServerClient } from "@/lib/stripe/server";
import { upsertCharges } from "@/features/admin/server/stripePaymentsRepo";

export type BackfillResult = {
  ok: boolean;
  written: number;
  reason?: string;
};

const DEFAULT_DAYS = 365;
const MAX_DAYS = 365 * 5;

/**
 * Pobiera charge'y ze Stripe za zadany okres i wpisuje je do `stripe_payments`.
 * Używamy stronicowanego iteratora SDK — w praktyce odpowiada za 1 round-trip
 * na 100 wierszy. Pisze do bazy w batchach po 500.
 */
export async function backfillStripePayments(days = DEFAULT_DAYS): Promise<BackfillResult> {
  const safeDays = Math.max(1, Math.min(MAX_DAYS, Math.floor(days)));

  let stripe: Stripe;
  try {
    stripe = getStripeServerClient();
  } catch (e) {
    return { ok: false, written: 0, reason: e instanceof Error ? e.message : String(e) };
  }

  const sinceSec = Math.floor((Date.now() - safeDays * 86400000) / 1000);
  const buffer: Stripe.Charge[] = [];
  const BATCH_FLUSH = 500;
  let total = 0;

  try {
    for await (const charge of stripe.charges.list({
      created: { gte: sinceSec },
      limit: 100,
    })) {
      buffer.push(charge);
      if (buffer.length >= BATCH_FLUSH) {
        total += await upsertCharges(buffer.splice(0, buffer.length));
      }
    }
    if (buffer.length > 0) {
      total += await upsertCharges(buffer);
    }
    return { ok: true, written: total };
  } catch (e) {
    console.error("[stripeBackfill] failed", e);
    return {
      ok: false,
      written: total,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
}
