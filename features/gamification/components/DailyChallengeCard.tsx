export function DailyChallengeSection() {
  return (
    <section>
      <h2 className="font-heading text-heading-md text-primary">Wyzwania</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            Wyzwanie dnia: Biochemia
          </h3>
          <p className="mt-2 font-body text-body-sm text-secondary">
            Odpowiedz na 15 pytań z biochemii z minimum 70% trafnością
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">0 / 15 pytań</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full w-0 rounded-full bg-brand-gold/70" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-brand-gold/10 px-2 py-0.5 font-body text-body-xs text-brand-gold">
              +50 XP
            </span>
            <span className="font-body text-body-xs text-muted">Pozostało: do końca dnia</span>
          </div>
        </article>

        <article className="rounded-card border border-[rgba(255,255,255,0.06)] bg-card p-5">
          <h3 className="font-body text-body-md font-semibold text-primary">
            Wyzwanie dnia: Anatomia
          </h3>
          <p className="mt-2 font-body text-body-sm text-secondary">
            Ukończ sesję z anatomii z co najmniej 10 pytaniami i 80% trafnością
          </p>
          <p className="mt-4 font-body text-body-xs text-muted">0 / 10 pytań</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full w-0 rounded-full bg-brand-gold/70" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-brand-gold/10 px-2 py-0.5 font-body text-body-xs text-brand-gold">
              +40 XP
            </span>
            <span className="font-body text-body-xs text-muted">Pozostało: do końca dnia</span>
          </div>
        </article>
      </div>
    </section>
  );
}
