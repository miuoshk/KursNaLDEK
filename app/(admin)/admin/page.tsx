import {
  Activity,
  AlertTriangle,
  Banknote,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Gauge,
  GraduationCap,
  Percent,
  Timer,
  TrendingUp,
  Users,
  UserPlus,
  Zap,
} from "lucide-react";
import { loadAdminDashboard } from "@/features/admin/server/loadAdminDashboard";
import { loadAdminFinance } from "@/features/admin/server/loadAdminFinance";
import { loadAdminInvestor } from "@/features/admin/server/loadAdminInvestor";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import { AdminFinanceKpiRow } from "@/features/admin/components/AdminFinanceKpiRow";
import { AdminMrrTrendChart } from "@/features/admin/components/AdminMrrTrendChart";
import { AdminPaidPctTable } from "@/features/admin/components/AdminPaidPctTable";
import { AdminGrowthChart } from "@/features/admin/components/AdminGrowthChart";
import { AdminDailyTrendChart } from "@/features/admin/components/AdminDailyTrendChart";
import { AdminModeBenchmarkTable } from "@/features/admin/components/AdminModeBenchmarkTable";
import { AdminUserBenchmarkTable } from "@/features/admin/components/AdminUserBenchmarkTable";
import { AdminCohortBenchmarkTable } from "@/features/admin/components/AdminCohortBenchmarkTable";
import { AdminUserSegmentChart } from "@/features/admin/components/AdminUserSegmentChart";
import { AdminHourDayHeatmap } from "@/features/admin/components/AdminHourDayHeatmap";
import { AdminHourOfDayChart } from "@/features/admin/components/AdminHourOfDayChart";
import { AdminDayOfWeekChart } from "@/features/admin/components/AdminDayOfWeekChart";
import { AdminSubjectsBarChart } from "@/features/admin/components/AdminSubjectsBarChart";
import { AdminTrackPerformanceChart } from "@/features/admin/components/AdminTrackPerformanceChart";
import { AdminEngagementCard } from "@/features/admin/components/AdminEngagementCard";
import { AdminSubscriptionDonut } from "@/features/admin/components/AdminSubscriptionDonut";
import { AdminRegistrationsTrendChart } from "@/features/admin/components/AdminRegistrationsTrendChart";
import { AdminTrendChart } from "@/features/admin/components/AdminTrendChart";

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  const r = Math.round(h % 24);
  return r > 0 ? `${d}d ${r}h` : `${d}d`;
}

export default async function AdminDashboardPage() {
  const [data, finance, investor] = await Promise.all([
    loadAdminDashboard(),
    loadAdminFinance(),
    loadAdminInvestor(),
  ]);

  const peakHourLabel = data.peakHour
    ? `${formatHour(data.peakHour.hour)} (${data.peakHour.sessions} sesji)`
    : "Brak danych";
  const peakDowLabel = data.peakDayOfWeek
    ? `${data.peakDayOfWeek.label} (${data.peakDayOfWeek.sessions} sesji)`
    : "Brak danych";

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

      <section>
        <SectionHeader title="Najważniejsze liczby" subtitle="Stan na dziś" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminKpiCard
            label="Użytkownicy"
            value={data.totalUsers}
            icon={Users}
            hint={`${data.paidUsers} z aktywną subskrypcją`}
            delta={
              data.newRegistrationsLast7d > 0
                ? { value: data.newRegistrationsLast7d, label: "/ 7d" }
                : null
            }
          />
          <AdminKpiCard
            label="Aktywni (7 dni)"
            value={data.uniqueActiveUsersLast7d}
            icon={Activity}
            tone="sage"
            hint={`${data.uniqueActiveUsersLast30d} aktywnych w 30 dniach`}
          />
          <AdminKpiCard
            label="Sesje (7 dni)"
            value={data.sessionsLast7d}
            icon={Zap}
            tone="gold"
            hint={`${data.sessionsToday} dzisiaj`}
          />
          <AdminKpiCard
            label="Pytania rozwiązane (7d)"
            value={data.answeredQuestionsLast7d}
            icon={BookOpen}
            hint={`${data.answeredQuestionsLast30d} w 30 dniach`}
          />
          <AdminKpiCard
            label="Śr. poprawność (7d)"
            value={`${data.averageAccuracyLast7d}%`}
            icon={TrendingUp}
            tone={
              data.averageAccuracyLast7d >= 70
                ? "success"
                : data.averageAccuracyLast7d < 50
                  ? "error"
                  : "neutral"
            }
            hint={`${data.averageAccuracyLast30d}% w 30 dniach`}
          />
          <AdminKpiCard
            label="Czas nauki (7d)"
            value={`${data.studyHoursLast7d} h`}
            icon={Clock}
            tone="sage"
            hint={`${data.studyHoursLast30d} h w 30 dniach`}
          />
          <AdminKpiCard
            label="Szczyt aktywności"
            value={peakHourLabel}
            icon={Calendar}
            tone="gold"
            hint={`Dzień: ${peakDowLabel}`}
          />
          <AdminKpiCard
            label="Zgłoszenia do rozpatrzenia"
            value={data.pendingReports}
            icon={AlertTriangle}
            tone={data.pendingReports > 0 ? "warning" : "neutral"}
            hint="Wymagają reakcji admina"
          />
        </div>
      </section>

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
          <AdminTrendChart metric="questions" />
          <AdminTrendChart metric="accuracy" />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Użytkownicy — segmenty"
          subtitle="Kto siedzi w platformie: kierunek + rok studiów"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminUserSegmentChart segments={data.userSegments} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Kiedy się uczą"
          subtitle="Pora dnia i dzień tygodnia (ostatnie 30 dni)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminHourDayHeatmap
            cells={data.heatmapLast30d}
            maxSessions={data.heatmapMaxSessions}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Godzina rozpoczęcia sesji"
            subtitle="Liczba sesji rozpoczętych w danej godzinie"
          >
            <AdminHourOfDayChart data={data.hourOfDayLast30d} />
          </ChartCard>
          <ChartCard
            title="Dzień tygodnia"
            subtitle="Sumaryczna aktywność według dnia"
          >
            <AdminDayOfWeekChart data={data.dayOfWeekLast30d} />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Trend dzienny"
          subtitle="Sesje, aktywni użytkownicy i pytania w ostatnich 14 dniach"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminDailyTrendChart data={data.dailyTrendLast14d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Co najpopularniejsze"
          subtitle="Top 10 przedmiotów według liczby sesji (30 dni)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminSubjectsBarChart data={data.subjectPopularityLast30d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Wydajność kierunków"
          subtitle="Sesje vs. średnia poprawność po kierunku i roku (30 dni)"
        />
        <div className="rounded-card border border-border bg-card p-5">
          <AdminTrackPerformanceChart data={data.trackPerformanceLast30d} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Zaangażowanie i monetyzacja"
          subtitle="Segmenty użytkowników oraz status subskrypcji"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Zaangażowanie (30 dni)"
            subtitle="Klasyfikacja na podstawie liczby sesji"
            icon={GraduationCap}
          >
            <AdminEngagementCard data={data.engagementLast30d} />
          </ChartCard>
          <ChartCard
            title="Subskrypcje"
            subtitle="Status w bazie profili"
            icon={CreditCard}
          >
            <AdminSubscriptionDonut data={data.subscriptionBreakdown} />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Rejestracje"
          subtitle="Nowi użytkownicy dzień po dniu (30 dni)"
        />
        <ChartCard
          title={`${data.newRegistrationsLast30d} nowych użytkowników`}
          subtitle={`${data.newRegistrationsLast7d} w ostatnim tygodniu`}
          icon={UserPlus}
        >
          <AdminRegistrationsTrendChart data={data.registrationsLast30d} />
        </ChartCard>
      </section>

      <section>
        <SectionHeader
          title="Tryby nauki"
          subtitle="Jak użytkownicy rozwiązują testy w ostatnich 7 dniach"
        />
        <AdminModeBenchmarkTable rows={data.modeBreakdownLast7d} />
      </section>

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

      <section>
        <SectionHeader
          title="Wzrost"
          subtitle="DAU / WAU / MAU oraz sticky factor"
          icon={TrendingUp}
        />
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
        <div className="mt-3">
          <ChartCard
            title="DAU / WAU / MAU (30 dni)"
            subtitle="Trend aktywnych użytkowników"
            icon={TrendingUp}
          >
            <AdminGrowthChart data={investor.growth.timeSeries} />
          </ChartCard>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Zaangażowanie — głębokie metryki"
          subtitle="Sesje, czas, mediana streaka — średnie 30 dni"
          icon={Zap}
        />
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
      </section>

      <section>
        <SectionHeader
          title="Jakość przygotowania"
          subtitle="Trafność i % gotowych użytkowników"
          icon={CheckCircle2}
        />
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
      </section>

      <section>
        <SectionHeader
          title="Operacje"
          subtitle="Reakcja na zgłoszenia i najczęściej używane przedmioty"
          icon={AlertTriangle}
        />
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
          <div className="mt-3 rounded-card border border-border bg-card p-5">
            <h3 className="font-heading text-lg font-bold text-primary">
              Top 5 przedmiotów (30 dni)
            </h3>
            <ul className="mt-3 space-y-2">
              {investor.operations.topSubjects.map((s, idx) => (
                <li
                  key={s.subjectName}
                  className="flex items-center justify-between gap-3 rounded-btn border border-border bg-background px-3 py-2"
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
      </section>

      <section>
        <SectionHeader
          title="Kohorty: kierunek × rok"
          subtitle="Średni czas na platformie, na testach i % aktywnych subskrypcji (30 dni)"
        />
        <AdminCohortBenchmarkTable rows={data.cohortBenchmarksLast30d} />
      </section>

      <section>
        <SectionHeader
          title="Top użytkownicy"
          subtitle="Ranking aktywności i jakości w ciągu 30 dni — sortuj kolumnami, filtruj kierunkiem i rokiem"
          icon={FileText}
        />
        <AdminUserBenchmarkTable rows={data.userBenchmarksLast30d} />
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof FileText;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary">{title}</h2>
        {subtitle && (
          <p className="mt-1 font-body text-body-xs text-muted">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <span className="hidden sm:flex">
          <Icon className="size-4 text-muted" aria-hidden />
        </span>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-heading-sm text-primary">{title}</h3>
          {subtitle && (
            <p className="mt-1 font-body text-body-xs text-muted">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <span className="rounded-btn bg-white/5 p-2 text-secondary">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
