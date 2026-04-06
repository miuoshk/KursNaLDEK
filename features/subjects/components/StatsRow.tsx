const RING_SIZE = 64;
const R = 26;
const C = 2 * Math.PI * R;

function SubjectMasteryRing() {
  const pct = 0;
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

export function StatsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-card bg-brand-card-1 p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-widest text-muted">
          Opanowanie przedmiotu
        </p>
        <p className="mt-3 font-mono text-3xl text-brand-gold">0%</p>
        <div className="mt-4 flex justify-center">
          <SubjectMasteryRing />
        </div>
        <p className="mt-3 text-center font-body text-body-xs text-muted">Łączny postęp</p>
      </div>

      <div className="rounded-card bg-brand-card-1 p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-widest text-muted">
          Pytania rozwiązane
        </p>
        <p className="mt-3 font-mono text-2xl text-primary">0 / 0</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div className="h-full w-0 rounded-full bg-brand-gold" />
        </div>
      </div>

      <div className="rounded-card bg-brand-card-1 p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-widest text-muted">
          Trafność odpowiedzi
        </p>
        <p className="mt-3 font-mono text-2xl text-primary">—</p>
        <p className="mt-4 font-body text-body-xs text-muted">+0% w tym tyg.</p>
      </div>

      <div className="rounded-card bg-brand-card-1 p-5">
        <p className="font-body text-body-xs font-medium uppercase tracking-widest text-muted">
          Następna powtórka
        </p>
        <p className="mt-3 font-mono text-lg text-muted">Brak danych</p>
      </div>
    </div>
  );
}
