import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Gauge,
  LineChart,
  Percent,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import { AdminGrowthChart } from "@/features/admin/components/AdminGrowthChart";
import { AdminFinanceKpiRow } from "@/features/admin/components/AdminFinanceKpiRow";
import { AdminPaidPctTable } from "@/features/admin/components/AdminPaidPctTable";
import { loadAdminInvestor } from "@/features/admin/server/loadAdminInvestor";
import { loadAdminFinance } from "@/features/admin/server/loadAdminFinance";
import { cn } from "@/lib/utils";

function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  const r = Math.round(h % 24);
  return r > 0 ? `${d}d ${r}h` : `${d}d`;
}

export default async function AdminInvestorPage() {
  const [investor, finance] = await Promise.all([
    loadAdminInvestor(),
    loadAdminFinance(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Metryki dla inwestora
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          Pełny obraz produktu: wzrost, zaangażowanie, monetyzacja, jakość i operacje.
          Dane na żywo z bazy i Stripe (cache 60 s).
        </p>
      </header>

      <Section
        title="Wzrost"
        subtitle="Aktywność użytkowników w czasie"
        icon={TrendingUp}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard
            label="DAU"
            value={investor.growth.dau}
            icon={Activity}
            tone="gold"
            hint="Dziś"
          />
          <AdminKpiCard
            label="WAU"
            value={investor.growth.wau}
            icon={Users}
            tone="sage"
            hint="Ostatnie 7 dni"
          />
          <AdminKpiCard
            label="MAU"
            value={investor.growth.mau}
            icon={Users}
            hint="Ostatnie 30 dni"
          />
          <AdminKpiCard
            label="DAU / WAU"
            value={`${investor.growth.dauWauRatio}%`}
            icon={Gauge}
            tone={investor.growth.dauWauRatio >= 30 ? "success" : "neutral"}
            hint="Sticky factor (cel: ≥30%)"
          />
        </div>
        <ChartCard title="DAU / WAU / MAU (30 dni)">
          <AdminGrowthChart data={investor.growth.timeSeries} />
        </ChartCard>
      </Section>

      <Section
        title="Zaangażowanie"
        subtitle="Jak intensywnie użytkownicy korzystają z platformy"
        icon={Zap}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminKpiCard
            label="Sesje na aktywnego (30d)"
            value={investor.engagement.avgSessionsPerActiveUser30d}
            icon={Activity}
            hint="Średnia liczba sesji"
          />
          <AdminKpiCard
            label="Pytań na sesję"
            value={investor.engagement.avgQuestionsPerSession}
            icon={BookOpen}
            hint="Średnia 30 dni"
          />
          <AdminKpiCard
            label="Średni czas testu"
            value={`${investor.engagement.avgTestDurationMinutes} min`}
            icon={Timer}
            tone="sage"
            hint="Sesje testowe (30d)"
          />
          <AdminKpiCard
            label="Aktywni w tygodniu"
            value={`${investor.engagement.weeklyActiveRatePct}%`}
            icon={Users}
            tone={investor.engagement.weeklyActiveRatePct >= 30 ? "success" : "neutral"}
            hint={`${investor.totalUsers} wszystkich`}
          />
          <AdminKpiCard
            label="Mediana streaka"
            value={`${investor.engagement.medianStreakDays} dni`}
            icon={TrendingUp}
            tone="gold"
            hint="Aktualny streak"
          />
        </div>
      </Section>

      <Section
        title="Monetyzacja"
        subtitle="Konwersja na płatne i przychody"
        icon={CreditCard}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard
            label="Konwersja na płatne"
            value={`${investor.monetization.paidConversionPct}%`}
            icon={Percent}
            tone={investor.monetization.paidConversionPct >= 20 ? "success" : "neutral"}
            hint={`${investor.monetization.paidActiveTotal} płatnych użytkowników`}
          />
          <AdminKpiCard
            label="Mediana dni do płatności"
            value={
              investor.monetization.medianDaysToFirstPaidPayment != null
                ? `${investor.monetization.medianDaysToFirstPaidPayment} dni`
                : "—"
            }
            icon={Clock}
            tone="sage"
            hint="Od rejestracji do pierwszej płatnej subskrypcji"
          />
          <AdminKpiCard
            label="Aktywne subskrypcje"
            value={investor.monetization.paidActiveTotal}
            icon={CreditCard}
            tone="gold"
            hint="Z entitlements"
          />
        </div>

        <AdminFinanceKpiRow data={finance} />

        <ChartCard title="% płacących w kohortach (kierunek × rok)">
          <AdminPaidPctTable
            rows={investor.monetization.paidActiveByTrackYear.map((row) => ({
              trackKey: row.trackKey,
              trackLabel: row.trackKey === "lekarski" ? "Lekarski" : "Stomatologia",
              year: row.year,
              totalUsers: row.totalUsers,
              paidActiveUsers: row.paidActive,
              paidPct: row.paidPct,
            }))}
          />
        </ChartCard>
      </Section>

      <Section
        title="Jakość"
        subtitle="Poziom przygotowania użytkowników"
        icon={CheckCircle2}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard
            label="Średnia poprawność (30d)"
            value={`${investor.quality.avgAccuracy30d}%`}
            icon={CheckCircle2}
            tone={
              investor.quality.avgAccuracy30d >= 70
                ? "success"
                : investor.quality.avgAccuracy30d < 50
                  ? "error"
                  : "neutral"
            }
            hint="Sesje 30 dni"
          />
          <AdminKpiCard
            label="Średnia gotowość"
            value={`${investor.quality.avgReadiness}%`}
            icon={Gauge}
            tone="gold"
            hint="Średnia poprawność per użytkownik"
          />
          <AdminKpiCard
            label="Gotowych (≥70%)"
            value={`${investor.quality.pctUsersReady70}%`}
            icon={TrendingUp}
            tone={investor.quality.pctUsersReady70 >= 30 ? "success" : "neutral"}
            hint="Użytkownicy z gotowością ≥70%"
          />
        </div>
      </Section>

      <Section
        title="Operacje"
        subtitle="Czas reakcji i jakość obsługi"
        icon={LineChart}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminKpiCard
            label="Zgłoszenia oczekujące"
            value={investor.operations.pendingReports}
            icon={AlertTriangle}
            tone={investor.operations.pendingReports > 0 ? "warning" : "success"}
          />
          <AdminKpiCard
            label="Średni czas reakcji"
            value={formatHours(investor.operations.avgHoursToResolveReport)}
            icon={Clock}
            hint="Od zgłoszenia do rozwiązania"
          />
          <AdminKpiCard
            label="Top przedmiot (30d)"
            value={
              investor.operations.topSubjects[0]
                ? `${investor.operations.topSubjects[0].sessions} sesji`
                : "—"
            }
            icon={BookOpen}
            hint={investor.operations.topSubjects[0]?.subjectName ?? "Brak danych"}
          />
        </div>

        {investor.operations.topSubjects.length > 0 && (
          <div className="rounded-card border border-border bg-card p-5">
            <h3 className="font-heading text-lg font-bold text-primary">
              Top 5 przedmiotów (30 dni)
            </h3>
            <ul className="mt-3 space-y-2">
              {investor.operations.topSubjects.map((s, idx) => (
                <li
                  key={s.subjectName}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-btn border border-border bg-background px-3 py-2",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-body text-body-xs text-muted tabular-nums">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-body text-body-sm text-primary">{s.subjectName}</p>
                      <p className="font-body text-body-xs text-muted">
                        {s.year ? `Rok ${s.year}` : "—"} ·{" "}
                        {s.track === "lekarski"
                          ? "Lekarski"
                          : s.track === "stomatologia"
                            ? "Stomatologia"
                            : "—"}
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-body-sm tabular-nums text-secondary">
                    {s.sessions} sesji
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof LineChart;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-primary">{title}</h2>
          {subtitle && (
            <p className="mt-1 font-body text-body-xs text-muted">{subtitle}</p>
          )}
        </div>
        {Icon && <Icon className="size-4 shrink-0 text-muted" aria-hidden />}
      </div>
      {children}
    </section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <h3 className="font-heading text-lg font-bold text-primary">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
