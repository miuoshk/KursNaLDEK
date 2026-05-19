import "server-only";

import type Stripe from "stripe";
import { getStripeServerClient } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

const MONTHLY_BUCKETS = 12;

export type AdminFinanceMonthlyPoint = {
  monthIso: string; // YYYY-MM
  label: string; // np. "maj 2026"
  grossRevenue: number; // PLN
  successfulPayments: number;
  refunds: number;
};

export type AdminFinanceCohortRow = {
  trackKey: "lekarski" | "stomatologia";
  trackLabel: string;
  year: number;
  totalUsers: number;
  paidActiveUsers: number;
  paidPct: number;
};

export type AdminFinanceData = {
  available: boolean;
  reason?: string;
  currency: string;
  revenueLast7d: number;
  revenueLast30d: number;
  revenueLast365d: number;
  paymentsLast30d: number;
  paymentsLast365d: number;
  refundsLast30d: number;
  averageOrderValue: number;
  arpu30d: number;
  paidActiveTotal: number;
  monthlyRevenue: AdminFinanceMonthlyPoint[];
  cohorts: AdminFinanceCohortRow[];
  paidConversionPct: number;
  fetchedAtIso: string;
};

const MONTH_NAMES = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

function monthLabel(year: number, monthIdx: number): string {
  return `${MONTH_NAMES[monthIdx] ?? ""} ${year}`;
}

function emptyResult(reason: string): AdminFinanceData {
  return {
    available: false,
    reason,
    currency: "pln",
    revenueLast7d: 0,
    revenueLast30d: 0,
    revenueLast365d: 0,
    paymentsLast30d: 0,
    paymentsLast365d: 0,
    refundsLast30d: 0,
    averageOrderValue: 0,
    arpu30d: 0,
    paidActiveTotal: 0,
    monthlyRevenue: [],
    cohorts: [],
    paidConversionPct: 0,
    fetchedAtIso: new Date().toISOString(),
  };
}

type StripeAggregates = {
  revenueLast7d: number;
  revenueLast30d: number;
  revenueLast365d: number;
  paymentsLast30d: number;
  paymentsLast365d: number;
  refundsLast30d: number;
  averageOrderValue: number;
  monthlyRevenue: AdminFinanceMonthlyPoint[];
  currency: string;
};

const STRIPE_CACHE_TTL_MS = 60_000;
let stripeCache: { value: StripeAggregates | null; expiresAt: number } | null = null;
let stripeInflight: Promise<StripeAggregates | null> | null = null;

async function getStripeAggregatesCached(): Promise<StripeAggregates | null> {
  const now = Date.now();
  if (stripeCache && stripeCache.expiresAt > now) {
    return stripeCache.value;
  }
  if (stripeInflight) return stripeInflight;
  stripeInflight = (async () => {
    try {
      const value = await collectStripeAggregates();
      stripeCache = { value, expiresAt: Date.now() + STRIPE_CACHE_TTL_MS };
      return value;
    } finally {
      stripeInflight = null;
    }
  })();
  return stripeInflight;
}

async function collectStripeAggregates(): Promise<{
  revenueLast7d: number;
  revenueLast30d: number;
  revenueLast365d: number;
  paymentsLast30d: number;
  paymentsLast365d: number;
  refundsLast30d: number;
  averageOrderValue: number;
  monthlyRevenue: AdminFinanceMonthlyPoint[];
  currency: string;
} | null> {
  let stripe: Stripe;
  try {
    stripe = getStripeServerClient();
  } catch (e) {
    console.error("[loadAdminFinance] Stripe client error", e);
    return null;
  }

  const now = Date.now();
  const since365 = Math.floor((now - 365 * 86400000) / 1000);
  const since30 = Math.floor((now - 30 * 86400000) / 1000);
  const since7 = Math.floor((now - 7 * 86400000) / 1000);

  let revenueLast7d = 0;
  let revenueLast30d = 0;
  let revenueLast365d = 0;
  let paymentsLast30d = 0;
  let paymentsLast365d = 0;
  let refundsLast30d = 0;
  let currency = "pln";
  const monthlyMap = new Map<string, AdminFinanceMonthlyPoint>();

  try {
    for await (const charge of stripe.charges.list({
      created: { gte: since365 },
      limit: 100,
    })) {
      const createdSec = charge.created;
      if (charge.refunded || charge.status !== "succeeded") {
        if (charge.amount_refunded > 0 && createdSec >= since30) {
          refundsLast30d += charge.amount_refunded;
        }
        continue;
      }
      const amount = charge.amount;
      if (charge.currency) currency = charge.currency;
      const date = new Date(createdSec * 1000);
      const monthIso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = monthLabel(date.getUTCFullYear(), date.getUTCMonth());
      const bucket = monthlyMap.get(monthIso) ?? {
        monthIso,
        label,
        grossRevenue: 0,
        successfulPayments: 0,
        refunds: 0,
      };
      bucket.grossRevenue += amount;
      bucket.successfulPayments += 1;
      if (charge.amount_refunded > 0) {
        bucket.refunds += charge.amount_refunded;
      }
      monthlyMap.set(monthIso, bucket);

      revenueLast365d += amount;
      paymentsLast365d += 1;
      if (createdSec >= since30) {
        revenueLast30d += amount;
        paymentsLast30d += 1;
        if (charge.amount_refunded > 0) {
          refundsLast30d += charge.amount_refunded;
        }
      }
      if (createdSec >= since7) {
        revenueLast7d += amount;
      }
    }
  } catch (e) {
    console.error("[loadAdminFinance] Stripe charges.list error", e);
    return null;
  }

  const averageOrderValue =
    paymentsLast30d > 0 ? Math.round(revenueLast30d / paymentsLast30d) : 0;

  const months: AdminFinanceMonthlyPoint[] = [];
  for (let i = MONTHLY_BUCKETS - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    const monthIso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(monthIso);
    months.push(
      bucket ?? {
        monthIso,
        label: monthLabel(d.getUTCFullYear(), d.getUTCMonth()),
        grossRevenue: 0,
        successfulPayments: 0,
        refunds: 0,
      },
    );
  }

  const toCurrencyUnits = (amount: number) => Math.round(amount) / 100;

  return {
    revenueLast7d: toCurrencyUnits(revenueLast7d),
    revenueLast30d: toCurrencyUnits(revenueLast30d),
    revenueLast365d: toCurrencyUnits(revenueLast365d),
    paymentsLast30d,
    paymentsLast365d,
    refundsLast30d: toCurrencyUnits(refundsLast30d),
    averageOrderValue: toCurrencyUnits(averageOrderValue),
    monthlyRevenue: months.map((m) => ({
      ...m,
      grossRevenue: toCurrencyUnits(m.grossRevenue),
      refunds: toCurrencyUnits(m.refunds),
    })),
    currency,
  };
}

async function collectEntitlementCohorts(): Promise<{
  cohorts: AdminFinanceCohortRow[];
  paidActiveTotal: number;
  totalUsers: number;
}> {
  const supabase = await createClient();

  const [{ data: entitlements }, { data: profiles }] = await Promise.all([
    supabase
      .from("user_year_entitlements")
      .select("user_id, track, year, access_type, active"),
    supabase.from("profiles").select("id, current_track, current_year"),
  ]);

  const cohortMap = new Map<
    string,
    {
      trackKey: "lekarski" | "stomatologia";
      year: number;
      totalUsers: number;
      paidUserIds: Set<string>;
    }
  >();

  for (const profile of profiles ?? []) {
    const track = profile.current_track === "lekarski" ? "lekarski" : "stomatologia";
    const year = (profile.current_year as number | null) ?? null;
    if (!year) continue;
    const key = `${track}|${year}`;
    const bucket = cohortMap.get(key) ?? {
      trackKey: track,
      year,
      totalUsers: 0,
      paidUserIds: new Set<string>(),
    };
    bucket.totalUsers += 1;
    cohortMap.set(key, bucket);
  }

  const allPaidUsers = new Set<string>();
  for (const row of entitlements ?? []) {
    if (row.access_type !== "paid" || row.active !== true) continue;
    const track = row.track === "lekarski" ? "lekarski" : "stomatologia";
    const year = Number(row.year);
    if (!year) continue;
    const key = `${track}|${year}`;
    const bucket = cohortMap.get(key) ?? {
      trackKey: track,
      year,
      totalUsers: 0,
      paidUserIds: new Set<string>(),
    };
    bucket.paidUserIds.add(row.user_id as string);
    allPaidUsers.add(row.user_id as string);
    cohortMap.set(key, bucket);
  }

  const cohorts: AdminFinanceCohortRow[] = Array.from(cohortMap.values())
    .map((b) => ({
      trackKey: b.trackKey,
      trackLabel: b.trackKey === "lekarski" ? "Lekarski" : "Stomatologia",
      year: b.year,
      totalUsers: b.totalUsers,
      paidActiveUsers: b.paidUserIds.size,
      paidPct:
        b.totalUsers > 0
          ? Number(((b.paidUserIds.size / b.totalUsers) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => {
      if (a.trackKey !== b.trackKey) return a.trackKey.localeCompare(b.trackKey);
      return a.year - b.year;
    });

  return {
    cohorts,
    paidActiveTotal: allPaidUsers.size,
    totalUsers: (profiles ?? []).length,
  };
}

export async function loadAdminFinance(): Promise<AdminFinanceData> {
  const [stripeAgg, cohortAgg] = await Promise.all([
    getStripeAggregatesCached(),
    collectEntitlementCohorts(),
  ]);

  if (!stripeAgg) {
    return {
      ...emptyResult("Stripe niedostępne — brakuje klucza STRIPE_SECRET_KEY lub błąd API."),
      cohorts: cohortAgg.cohorts,
      paidActiveTotal: cohortAgg.paidActiveTotal,
      paidConversionPct:
        cohortAgg.totalUsers > 0
          ? Number(((cohortAgg.paidActiveTotal / cohortAgg.totalUsers) * 100).toFixed(1))
          : 0,
    };
  }

  const arpu30d =
    cohortAgg.paidActiveTotal > 0
      ? Number((stripeAgg.revenueLast30d / cohortAgg.paidActiveTotal).toFixed(2))
      : 0;

  return {
    available: true,
    currency: stripeAgg.currency,
    revenueLast7d: stripeAgg.revenueLast7d,
    revenueLast30d: stripeAgg.revenueLast30d,
    revenueLast365d: stripeAgg.revenueLast365d,
    paymentsLast30d: stripeAgg.paymentsLast30d,
    paymentsLast365d: stripeAgg.paymentsLast365d,
    refundsLast30d: stripeAgg.refundsLast30d,
    averageOrderValue: stripeAgg.averageOrderValue,
    arpu30d,
    paidActiveTotal: cohortAgg.paidActiveTotal,
    monthlyRevenue: stripeAgg.monthlyRevenue,
    cohorts: cohortAgg.cohorts,
    paidConversionPct:
      cohortAgg.totalUsers > 0
        ? Number(((cohortAgg.paidActiveTotal / cohortAgg.totalUsers) * 100).toFixed(1))
        : 0,
    fetchedAtIso: new Date().toISOString(),
  };
}
