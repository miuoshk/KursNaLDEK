import {
  Banknote,
  CreditCard,
  Percent,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import type { AdminFinanceData } from "@/features/admin/server/loadAdminFinance";

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString("pl-PL")} ${currency.toUpperCase()}`;
  }
}

export function AdminFinanceKpiRow({ data }: { data: AdminFinanceData }) {
  if (!data.available) {
    return (
      <div className="rounded-card border border-warning/40 bg-warning/5 px-4 py-3 font-body text-body-sm text-warning">
        {data.reason ?? "Nie udało się pobrać danych finansowych ze Stripe."}
      </div>
    );
  }

  const trend7vs30 =
    data.revenueLast30d > 0
      ? Math.round((data.revenueLast7d / data.revenueLast30d) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AdminKpiCard
        label="Przychód (7 dni)"
        value={formatCurrency(data.revenueLast7d, data.currency)}
        icon={Banknote}
        tone="success"
        hint={`${formatCurrency(data.revenueLast30d, data.currency)} w 30 dniach`}
      />
      <AdminKpiCard
        label="Przychód (30 dni)"
        value={formatCurrency(data.revenueLast30d, data.currency)}
        icon={trend7vs30 != null && trend7vs30 >= 25 ? TrendingUp : TrendingDown}
        tone="gold"
        hint={
          trend7vs30 != null
            ? `Ostatni tydzień to ${trend7vs30}% miesięcznego przychodu`
            : undefined
        }
      />
      <AdminKpiCard
        label="Przychód (365 dni)"
        value={formatCurrency(data.revenueLast365d, data.currency)}
        icon={Banknote}
        hint={`${data.paymentsLast365d} udanych płatności`}
      />
      <AdminKpiCard
        label="Średnia wartość zamówienia"
        value={formatCurrency(data.averageOrderValue, data.currency)}
        icon={Receipt}
        tone="sage"
        hint={`${data.paymentsLast30d} płatności w 30 dniach`}
      />
      <AdminKpiCard
        label="ARPU (30 dni)"
        value={formatCurrency(data.arpu30d, data.currency)}
        icon={Users}
        tone="gold"
        hint={`${data.paidActiveTotal} aktywnych płacących`}
      />
      <AdminKpiCard
        label="Konwersja na płatne"
        value={`${data.paidConversionPct}%`}
        icon={Percent}
        tone={data.paidConversionPct >= 20 ? "success" : "neutral"}
        hint={`${data.paidActiveTotal} z aktywnym entitlement`}
      />
      <AdminKpiCard
        label="Zwroty (30 dni)"
        value={formatCurrency(data.refundsLast30d, data.currency)}
        icon={RefreshCcw}
        tone={data.refundsLast30d > 0 ? "warning" : "neutral"}
        hint="Suma kwot zwróconych w okresie"
      />
      <AdminKpiCard
        label="Aktywne subskrypcje"
        value={data.paidActiveTotal}
        icon={CreditCard}
        tone="sage"
        hint="Sumarycznie z user_year_entitlements"
      />
    </div>
  );
}
