import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Gauge,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { loadAdminInvestor } from "@/features/admin/server/loadAdminInvestor";
import { AdminKpiCard } from "@/features/admin/components/AdminKpiCard";
import { AdminGrowthChart } from "@/features/admin/components/AdminGrowthChart";
import { ChartCard, SectionHeader } from "@/features/admin/components/sections/AdminSectionsCommon";

function formatHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  const r = Math.round(h % 24);
  return r > 0 ? `${d}d ${r}h` : `${d}d`;
}

export async function InvestorSections() {
  const investor = await loadAdminInvestor();

  return (
    <>
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
    </>
  );
}
