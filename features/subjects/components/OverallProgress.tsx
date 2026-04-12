type OverallProgressProps = {
  year: number;
  totalQuestions: number;
  answered: number;
  mastered: number;
  reviewing: number;
};

export function OverallProgress({
  year,
  totalQuestions,
  answered,
  mastered,
  reviewing,
}: OverallProgressProps) {
  const percentage =
    totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

  const masteredPct =
    totalQuestions > 0 ? (mastered / totalQuestions) * 100 : 0;
  const reviewingPct =
    totalQuestions > 0 ? (reviewing / totalQuestions) * 100 : 0;

  return (
    <div className="rounded-card border border-border bg-card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-body text-sm uppercase tracking-widest text-secondary">
            Postęp ogólny roku {year}
          </p>
          <p className="mt-2 font-body text-3xl text-brand-gold">{percentage}%</p>
        </div>
        <div className="text-left md:text-right">
          <p className="font-body text-lg text-secondary">
            {answered} / {totalQuestions}{" "}
            <span className="font-body text-body-sm text-muted">liczba pytań</span>
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="flex h-full">
          {masteredPct > 0 && (
            <div
              className="h-full bg-success transition-[width] duration-300 ease-out"
              style={{ width: `${masteredPct}%` }}
            />
          )}
          {reviewingPct > 0 && (
            <div
              className="h-full bg-brand-gold transition-[width] duration-300 ease-out"
              style={{ width: `${reviewingPct}%` }}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-body text-body-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          Opanowane
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-gold" aria-hidden />
          Powtórki
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-white/20" aria-hidden />
          Do nauki
        </span>
      </div>
    </div>
  );
}
