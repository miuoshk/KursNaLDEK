import type { SubjectStats } from "@/features/subjects/server/loadSubjectDashboard";

function formatNextReview(iso: string): string {
  const target = new Date(iso);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round(
    (targetDay.getTime() - todayStart.getTime()) / 86_400_000,
  );

  if (diffDays <= 0) return "Dziś";
  if (diffDays === 1) return "Jutro";
  if (diffDays <= 7) return `Za ${diffDays} dni`;
  return targetDay.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

const RING_SIZE = 64;
const R = 26;
const C = 2 * Math.PI * R;

function SubjectMasteryRing({ pct }: { pct: number }) {
  const dash = (pct / 100) * C;

  return (
    <svg
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={R}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={4}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeDasharray={`${dash} ${C}`}
        strokeLinecap="round"
        className="text-brand-gold"
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </svg>
  );
}

export function StatsRow({ stats }: { stats: SubjectStats }) {
  const accPct = Math.round(stats.accuracy * 100);
  const progressPct =
    stats.totalQuestions > 0
      ? Math.round((stats.answeredQuestions / stats.totalQuestions) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-card border border-border bg-card p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-normal text-muted">
          Opanowanie przedmiotu
        </p>
        <p className="mt-3 font-body text-3xl text-brand-gold">{stats.masteryPct}%</p>
        <div className="mt-4 flex justify-center">
          <SubjectMasteryRing pct={stats.masteryPct} />
        </div>
        <p className="mt-3 text-center font-body text-body-xs text-muted">Łączny postęp</p>
      </div>

      <div className="rounded-card border border-border bg-card p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-normal text-muted">
          Pytania rozwiązane
        </p>
        <p className="mt-3 font-body text-2xl text-primary">
          {stats.answeredQuestions} / {stats.totalQuestions}
        </p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-brand-gold transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-normal text-muted">
          Trafność odpowiedzi
        </p>
        <p className="mt-3 font-body text-2xl text-primary">
          {stats.answeredQuestions > 0 ? `${accPct}%` : "—"}
        </p>
      </div>

      <div className="rounded-card border border-border bg-card p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-normal text-muted">
          Następna powtórka
        </p>
        {stats.nextReviewDate ? (
          <>
            <p className="mt-3 font-body text-2xl text-primary">
              {formatNextReview(stats.nextReviewDate)}
            </p>
            {stats.dueCount > 0 && (
              <p className="mt-2 font-body text-body-xs text-brand-gold">
                {stats.dueCount} {stats.dueCount === 1 ? "pytanie" : stats.dueCount < 5 ? "pytania" : "pytań"} do powtórki
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 font-body text-lg text-muted">Brak zaplanowanych</p>
        )}
      </div>
    </div>
  );
}
