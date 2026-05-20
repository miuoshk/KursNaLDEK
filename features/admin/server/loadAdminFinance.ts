import "server-only";

import { cache } from "react";
import { after } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllEntitlements,
  getAllProfiles,
} from "@/features/admin/server/loadAdminShared";
import { backfillStripePayments } from "@/features/admin/server/stripeBackfill";
import { countRecentPayments } from "@/features/admin/server/stripePaymentsRepo";

const MONTHLY_BUCKETS = 12;
const CACHE_REVALIDATE_SECONDS = 300;
export const ADMIN_FINANCE_CACHE_TAG = "admin-finance";

export type AdminFinanceMonthlyPoint = {
  monthIso: string;
  label: string;
  grossRevenue: number;
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
  totalRows: number;
};

type PaymentRow = {
  amount: number;
  amount_refunded: number;
  currency: string;
  status: string;
  refunded: boolean;
  stripe_created_at: string;
};

function emptyAggregates(): StripeAggregates {
  return {
    revenueLast7d: 0,
    revenueLast30d: 0,
    revenueLast365d: 0,
    paymentsLast30d: 0,
    paymentsLast365d: 0,
    refundsLast30d: 0,
    averageOrderValue: 0,
    monthlyRevenue: [],
    currency: "pln",
    totalRows: 0,
  };
}

/**
 * Czyta z lokalnej tabeli `stripe_payments` i agreguje wartości KPI.
 * Tabela jest karmiona webhookiem + endpointem /api/admin/stripe-backfill.
 *
 * Owinięte w `unstable_cache` z tagiem `admin-finance` — webhook i backfill
 * wywołują `revalidateTag(ADMIN_FINANCE_CACHE_TAG)`, więc agregaty są
 * natychmiast świeże po zmianie, a w międzyczasie strony serwujemy z cache.
 */
async function readStripeAggregatesFromTable(): Promise<StripeAggregates> {
  const admin = createAdminClient();
  const now = Date.now();
  const since365Iso = new Date(now - 365 * 86400000).toISOString();
  const since30Ms = now - 30 * 86400000;
  const since7Ms = now - 7 * 86400000;

  // Stronicowanie po 1000, dopóki PostgREST zwraca pełną stronę.
  const PAGE = 1000;
  const rows: PaymentRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin
      .from("stripe_payments")
      .select("amount, amount_refunded, currency, status, refunded, stripe_created_at")
      .gte("stripe_created_at", since365Iso)
      .order("stripe_created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error("[loadAdminFinance] read error", error.message);
      break;
    }
    const batch = (data ?? []) as PaymentRow[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }

  if (rows.length === 0) {
    return emptyAggregates();
  }

  let revenueLast7d = 0;
  let revenueLast30d = 0;
  let revenueLast365d = 0;
  let paymentsLast30d = 0;
  let paymentsLast365d = 0;
  let refundsLast30d = 0;
  let currency = "pln";
  const monthlyMap = new Map<string, AdminFinanceMonthlyPoint>();

  for (const row of rows) {
    const createdMs = new Date(row.stripe_created_at).getTime();
    const isSucceeded = row.status === "succeeded" && !row.refunded;
    const amount = row.amount ?? 0;
    if (row.currency) currency = row.currency;

    if (!isSucceeded) {
      if ((row.amount_refunded ?? 0) > 0 && createdMs >= since30Ms) {
        refundsLast30d += row.amount_refunded;
      }
      continue;
    }

    const date = new Date(createdMs);
    const monthIso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = monthlyMap.get(monthIso) ?? {
      monthIso,
      label: monthLabel(date.getUTCFullYear(), date.getUTCMonth()),
      grossRevenue: 0,
      successfulPayments: 0,
      refunds: 0,
    };
    bucket.grossRevenue += amount;
    bucket.successfulPayments += 1;
    if ((row.amount_refunded ?? 0) > 0) {
      bucket.refunds += row.amount_refunded;
    }
    monthlyMap.set(monthIso, bucket);

    revenueLast365d += amount;
    paymentsLast365d += 1;
    if (createdMs >= since30Ms) {
      revenueLast30d += amount;
      paymentsLast30d += 1;
      if ((row.amount_refunded ?? 0) > 0) {
        refundsLast30d += row.amount_refunded;
      }
    }
    if (createdMs >= since7Ms) {
      revenueLast7d += amount;
    }
  }

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

  const toCurrencyUnits = (a: number) => Math.round(a) / 100;
  const averageOrderValue =
    paymentsLast30d > 0 ? Math.round(revenueLast30d / paymentsLast30d) : 0;

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
    totalRows: rows.length,
  };
}

const getCachedStripeAggregates = unstable_cache(
  readStripeAggregatesFromTable,
  ["admin-finance-aggregates-v1"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [ADMIN_FINANCE_CACHE_TAG] },
);

/**
 * Liczy kohorty „% płacących” na podstawie profili i `user_year_entitlements`.
 * Korzysta z dwóch współdzielonych loaderów (`react.cache`), więc nie wykonuje
 * dodatkowych zapytań jeśli `loadAdminDashboard` / `loadAdminInvestor` już je
 * wywołały w tym żądaniu.
 */
const collectEntitlementCohorts = cache(async (): Promise<{
  cohorts: AdminFinanceCohortRow[];
  paidActiveTotal: number;
  totalUsers: number;
}> => {
  const [entitlements, profiles] = await Promise.all([
    getAllEntitlements(),
    getAllProfiles(),
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

  for (const profile of profiles) {
    const track = profile.current_track === "lekarski" ? "lekarski" : "stomatologia";
    const year = profile.current_year ?? null;
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
  for (const row of entitlements) {
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
    bucket.paidUserIds.add(row.user_id);
    allPaidUsers.add(row.user_id);
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
    totalUsers: profiles.length,
  };
});

let backfillScheduled = false;
function maybeScheduleBackfill(stripeAvailable: boolean) {
  if (backfillScheduled) return;
  if (!stripeAvailable) return;
  if (!process.env.STRIPE_SECRET_KEY) return;
  backfillScheduled = true;
  after(async () => {
    try {
      const fresh = await countRecentPayments(365);
      if (fresh > 0) return; // ktoś zdążył wpaść z webhookiem — nic nie rób
      console.info("[loadAdminFinance] running lazy backfill (last 365d)");
      const res = await backfillStripePayments(365);
      if (res.ok && res.written > 0) {
        revalidateTag(ADMIN_FINANCE_CACHE_TAG, "max");
        console.info(`[loadAdminFinance] backfill wrote ${res.written} rows`);
      } else if (!res.ok) {
        console.error("[loadAdminFinance] backfill failed", res.reason);
      }
    } catch (e) {
      console.error("[loadAdminFinance] backfill threw", e);
    } finally {
      backfillScheduled = false;
    }
  });
}

export async function loadAdminFinance(): Promise<AdminFinanceData> {
  const [aggregates, cohortAgg] = await Promise.all([
    getCachedStripeAggregates(),
    collectEntitlementCohorts(),
  ]);

  const stripeAvailable = aggregates.totalRows > 0;
  const baseAvailable = stripeAvailable;

  const arpu30d =
    cohortAgg.paidActiveTotal > 0
      ? Number((aggregates.revenueLast30d / cohortAgg.paidActiveTotal).toFixed(2))
      : 0;

  if (!baseAvailable) {
    // Tabela pusta — zaplanuj backfill w tle (jeśli możliwy) i pokaż info.
    maybeScheduleBackfill(true);
    return {
      available: false,
      reason:
        process.env.STRIPE_SECRET_KEY
          ? "Trwa synchronizacja danych Stripe — odśwież panel za chwilę."
          : "Stripe niedostępne — brakuje klucza STRIPE_SECRET_KEY.",
      currency: aggregates.currency,
      revenueLast7d: 0,
      revenueLast30d: 0,
      revenueLast365d: 0,
      paymentsLast30d: 0,
      paymentsLast365d: 0,
      refundsLast30d: 0,
      averageOrderValue: 0,
      arpu30d: 0,
      paidActiveTotal: cohortAgg.paidActiveTotal,
      monthlyRevenue: [],
      cohorts: cohortAgg.cohorts,
      paidConversionPct:
        cohortAgg.totalUsers > 0
          ? Number(((cohortAgg.paidActiveTotal / cohortAgg.totalUsers) * 100).toFixed(1))
          : 0,
      fetchedAtIso: new Date().toISOString(),
    };
  }

  return {
    available: true,
    currency: aggregates.currency,
    revenueLast7d: aggregates.revenueLast7d,
    revenueLast30d: aggregates.revenueLast30d,
    revenueLast365d: aggregates.revenueLast365d,
    paymentsLast30d: aggregates.paymentsLast30d,
    paymentsLast365d: aggregates.paymentsLast365d,
    refundsLast30d: aggregates.refundsLast30d,
    averageOrderValue: aggregates.averageOrderValue,
    arpu30d,
    paidActiveTotal: cohortAgg.paidActiveTotal,
    monthlyRevenue: aggregates.monthlyRevenue,
    cohorts: cohortAgg.cohorts,
    paidConversionPct:
      cohortAgg.totalUsers > 0
        ? Number(((cohortAgg.paidActiveTotal / cohortAgg.totalUsers) * 100).toFixed(1))
        : 0,
    fetchedAtIso: new Date().toISOString(),
  };
}
