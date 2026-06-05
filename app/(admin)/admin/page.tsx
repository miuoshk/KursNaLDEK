import { Suspense } from "react";
import { AdminCohortSubjectChart } from "@/features/admin/components/AdminCohortSubjectChart";
import { AdminTrendChart } from "@/features/admin/components/AdminTrendChart";
import { DashboardSections } from "@/features/admin/components/sections/DashboardSections";
import { FinanceSection } from "@/features/admin/components/sections/FinanceSection";
import { InvestorSections } from "@/features/admin/components/sections/InvestorSections";
import {
  KpiRowSkeleton,
  SectionHeader,
  SectionSkeleton,
} from "@/features/admin/components/sections/AdminSectionsCommon";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Przegląd produktu
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Kto i kiedy się uczy, jak wypadają poszczególne kierunki, oraz benchmarki
          jakości i zaangażowania.
        </p>
      </header>

      <Suspense fallback={<DashboardSectionsFallback />}>
        <DashboardSections />
      </Suspense>

      <section>
        <SectionHeader
          title="Trendy — filtruj kierunkiem, rokiem i zakresem"
          subtitle="Każdy wykres ma własne kontrolki; dane na żywo z bazy"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AdminTrendChart metric="sessions" />
          <AdminTrendChart metric="time" />
          <AdminTrendChart metric="answers" />
          <AdminTrendChart metric="users" />
          <AdminCohortSubjectChart />
          <AdminTrendChart metric="accuracy" />
        </div>
      </section>

      <Suspense fallback={<FinanceFallback />}>
        <FinanceSection />
      </Suspense>

      <Suspense fallback={<InvestorFallback />}>
        <InvestorSections />
      </Suspense>
    </div>
  );
}

function DashboardSectionsFallback() {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader title="Najważniejsze liczby" subtitle="Stan na dziś" />
        <KpiRowSkeleton cols={8} />
      </section>
      <section>
        <SectionHeader
          title="Użytkownicy — segmenty"
          subtitle="Kto siedzi w platformie: kierunek + rok studiów"
        />
        <SectionSkeleton height="h-72" />
      </section>
      <section>
        <SectionHeader
          title="Kiedy się uczą"
          subtitle="Pora dnia i dzień tygodnia (ostatnie 30 dni)"
        />
        <SectionSkeleton height="h-64" />
      </section>
    </div>
  );
}

function FinanceFallback() {
  return (
    <section>
      <SectionHeader
        title="Finanse"
        subtitle="Dane na żywo ze Stripe — przychody, ARPU i konwersja na płatne"
      />
      <KpiRowSkeleton cols={8} />
    </section>
  );
}

function InvestorFallback() {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <SectionHeader title="Wzrost" subtitle="DAU / WAU / MAU oraz sticky factor" />
        <KpiRowSkeleton cols={4} />
        <div className="mt-3">
          <SectionSkeleton height="h-72" />
        </div>
      </section>
      <section>
        <SectionHeader
          title="Zaangażowanie — głębokie metryki"
          subtitle="Sesje, czas, mediana streaka — średnie 30 dni"
        />
        <KpiRowSkeleton cols={4} />
      </section>
    </div>
  );
}
