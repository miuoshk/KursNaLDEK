import { Banknote, Percent } from "lucide-react";
import { loadAdminFinance } from "@/features/admin/server/loadAdminFinance";
import { AdminFinanceKpiRow } from "@/features/admin/components/AdminFinanceKpiRow";
import { AdminMrrTrendChart } from "@/features/admin/components/AdminMrrTrendChart";
import { AdminPaidPctTable } from "@/features/admin/components/AdminPaidPctTable";
import { ChartCard, SectionHeader } from "@/features/admin/components/sections/AdminSectionsCommon";

export async function FinanceSection() {
  const finance = await loadAdminFinance();

  return (
    <section>
      <SectionHeader
        title="Finanse"
        subtitle="Dane na żywo ze Stripe — przychody, ARPU i konwersja na płatne"
      />
      <div className="space-y-4">
        <AdminFinanceKpiRow data={finance} />
        {finance.available && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartCard
              title="Przychód miesięczny (12 mies.)"
              subtitle="Brutto z udanych płatności"
              icon={Banknote}
            >
              <AdminMrrTrendChart
                data={finance.monthlyRevenue}
                currency={finance.currency}
              />
            </ChartCard>
            <ChartCard
              title="% płacących w kohortach"
              subtitle="Aktywne entitlement / wszyscy w danym roku i kierunku"
              icon={Percent}
            >
              <AdminPaidPctTable rows={finance.cohorts} />
            </ChartCard>
          </div>
        )}
      </div>
    </section>
  );
}
