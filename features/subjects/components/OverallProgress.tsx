type OverallProgressProps = {
  year: number;
  totalQuestions: number;
};

export function OverallProgress({ year, totalQuestions }: OverallProgressProps) {
  return (
    <div className="rounded-card bg-card border border-border p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-body text-body-xs uppercase tracking-widest text-muted">
            Postęp ogólny roku {year}
          </p>
          <p className="mt-2 font-mono text-3xl text-brand-gold">0%</p>
        </div>
        <div className="text-left md:text-right">
          <p className="font-mono text-lg text-secondary">
            0 / {totalQuestions}{" "}
            <span className="font-body text-body-sm text-muted">liczba pytań</span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-1">
        <div className="h-2 flex-1 rounded-full bg-white/10" />
        <div className="h-2 flex-1 rounded-full bg-white/10" />
        <div className="h-2 flex-1 rounded-full bg-white/10" />
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
