import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  GraduationCap,
  RotateCcw,
  Target,
  Trophy,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { HeroMotion } from "@/features/marketing/components/HeroMotion";
import { MarketingNav } from "@/features/marketing/components/MarketingNav";
import { Reveal } from "@/features/marketing/components/Reveal";

type LandingContentProps = {
  registrationOpen: boolean;
};

const HEATMAP_LEVELS = [
  0, 0, 1, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 0, 2, 3, 4, 3, 2, 0, 1, 2, 4, 3, 2, 1, 0, 1,
  3, 4, 4, 2, 1, 0, 2, 3, 4, 3, 1, 0, 0, 1, 2, 3, 4, 2, 1, 0, 2, 4, 4, 3, 2, 1,
  0, 1, 3, 4, 3, 2, 0, 0, 2, 3, 4, 4, 2, 1, 0, 1, 2, 4, 3, 2, 1, 0, 2, 3, 4, 3,
  2, 0, 0, 1, 3, 4, 2, 1, 0, 0,
];

function heatmapColor(level: number) {
  if (level === 0) return "border-white/[0.04] bg-background";
  if (level === 1) return "border-white/[0.04] bg-card-hover";
  if (level === 2) return "border-brand-sage/15 bg-[#1a4a40]";
  if (level === 3) return "border-brand-sage/30 bg-brand-sage";
  return "border-brand-gold/30 bg-brand-gold";
}

export async function LandingContent({ registrationOpen }: LandingContentProps) {
  const t = await getTranslations("marketing");
  const registrationHref = registrationOpen ? "/register" : "/login";

  const featureCards = [
    {
      icon: Target,
      title: t("product.dailyGoalTitle"),
      description: t("product.dailyGoalDescription"),
    },
    {
      icon: RotateCcw,
      title: t("product.reviewsTitle"),
      description: t("product.reviewsDescription"),
    },
    {
      icon: Trophy,
      title: t("product.rankTitle"),
      description: t("product.rankDescription"),
    },
  ];

  const faqItems = [
    [t("faq.items.accessQuestion"), t("faq.items.accessAnswer")],
    [t("faq.items.universityQuestion"), t("faq.items.universityAnswer")],
    [t("faq.items.adaptiveQuestion"), t("faq.items.adaptiveAnswer")],
    [t("faq.items.mobileQuestion"), t("faq.items.mobileAnswer")],
    [t("faq.items.paymentQuestion"), t("faq.items.paymentAnswer")],
    [t("faq.items.trialQuestion"), t("faq.items.trialAnswer")],
  ];

  return (
    <div className="overflow-x-clip bg-background text-primary">
      <MarketingNav registrationOpen={registrationOpen} />
      <main>
        <HeroMotion registrationOpen={registrationOpen} />

        <section className="border-y border-border bg-sidebar/35 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1400px] gap-5 sm:grid-cols-3">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.06}>
                  <div className="flex gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-btn border border-brand-sage/25 bg-brand-sage/10">
                      <Icon className="size-5 text-brand-sage" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg text-primary">{item.title}</h2>
                      <p className="mt-1 font-body text-body-sm leading-6 text-secondary">{item.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12" aria-labelledby="product-heading">
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="max-w-2xl">
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("product.eyebrow")}
              </p>
              <h2
                id="product-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("product.title")}
              </h2>
              <p className="mt-5 max-w-xl font-body text-base leading-7 text-secondary">
                {t("product.description")}
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal>
                <div className="flex min-h-56 flex-col rounded-card border border-border bg-card p-5">
                  <p className="font-body text-body-xs font-semibold uppercase tracking-widest text-secondary">
                    {t("product.mock.dailyGoal")}
                  </p>
                  <div className="relative mx-auto mt-5 size-28">
                    <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                      <circle cx="60" cy="60" r="47" fill="none" stroke="rgba(54,115,104,.28)" strokeWidth="8" />
                      <circle
                        cx="60"
                        cy="60"
                        r="47"
                        fill="none"
                        stroke="var(--color-brand-gold)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="295"
                        strokeDashoffset="74"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl">
                      15<span className="text-base text-secondary">/20</span>
                    </span>
                  </div>
                  <p className="mt-auto text-center font-body text-body-sm text-secondary">
                    {t("product.mock.goalProgress")}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <div className="flex min-h-56 flex-col rounded-card border border-border bg-card p-5">
                  <p className="font-body text-body-xs font-semibold uppercase tracking-widest text-secondary">
                    {t("product.mock.streak")}
                  </p>
                  <div className="mt-8 flex items-center gap-3">
                    <Flame className="size-10 text-brand-gold" aria-hidden="true" />
                    <span className="font-heading text-5xl text-brand-gold">12</span>
                  </div>
                  <p className="mt-auto font-body text-body-sm text-secondary">{t("product.mock.streakCaption")}</p>
                </div>
              </Reveal>

              <Reveal delay={0.12}>
                <div className="flex min-h-56 flex-col rounded-card border border-border bg-card p-5">
                  <p className="font-body text-body-xs font-semibold uppercase tracking-widest text-secondary">
                    {t("product.mock.reviews")}
                  </p>
                  <span className="mt-8 font-heading text-5xl text-brand-gold">8</span>
                  <div className="mt-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-btn border border-brand-gold/35 px-3 py-1.5 font-body text-body-sm text-brand-gold">
                      <RotateCcw className="size-4" aria-hidden="true" />
                      {t("product.mock.reviewAction")}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="flex min-h-56 flex-col rounded-card border border-brand-gold/20 bg-card p-5 ring-1 ring-brand-gold/10">
                  <p className="font-body text-body-xs font-semibold uppercase tracking-widest text-secondary">
                    {t("product.mock.rank")}
                  </p>
                  <span className="mt-8 font-heading text-2xl text-brand-gold">
                    {t("product.mock.rankName")}
                  </span>
                  <div className="mt-auto">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[68%] rounded-full bg-brand-gold" />
                    </div>
                    <p className="mt-3 font-body text-body-xs text-secondary">
                      {t("product.mock.rankProgress")}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          id="jak-dziala"
          className="scroll-mt-16 border-y border-border bg-sidebar/30 px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="session-heading"
        >
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="max-w-2xl">
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("session.eyebrow")}
              </p>
              <h2
                id="session-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("session.title")}
              </h2>
              <p className="mt-5 max-w-xl font-body text-base leading-7 text-secondary">
                {t("session.description")}
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              <Reveal>
                <article className="h-full rounded-card border border-border bg-card p-6">
                  <span className="font-heading text-3xl text-brand-gold">01</span>
                  <h3 className="mt-8 font-heading text-2xl">{t("session.steps.chooseTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.chooseDescription")}
                  </p>
                  <div className="mt-8 rounded-btn border border-brand-sage/25 bg-brand-sage/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-body-sm font-semibold">{t("session.mock.smartSession")}</span>
                      <span className="rounded-pill border border-brand-gold/30 px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-brand-gold">
                        {t("session.mock.recommended")}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-body-xs text-secondary">{t("session.mock.smartCaption")}</p>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.07}>
                <article className="h-full rounded-card border border-border bg-card p-6">
                  <span className="font-heading text-3xl text-brand-gold">02</span>
                  <h3 className="mt-8 font-heading text-2xl">{t("session.steps.answerTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.answerDescription")}
                  </p>
                  <div className="mt-8 space-y-2">
                    <div className="rounded-btn border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-body-sm text-secondary">
                      A. {t("session.mock.answerA")}
                    </div>
                    <div className="flex items-center justify-between rounded-btn border border-success/35 bg-success/[0.08] px-4 py-3 font-body text-body-sm text-success">
                      <span>B. {t("session.mock.answerB")}</span>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    </div>
                    <div className="rounded-btn border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-body-sm text-secondary">
                      C. {t("session.mock.answerC")}
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.14}>
                <article className="h-full rounded-card border border-border bg-card p-6">
                  <span className="font-heading text-3xl text-brand-gold">03</span>
                  <h3 className="mt-8 font-heading text-2xl">{t("session.steps.rateTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.rateDescription")}
                  </p>
                  <div className="mt-8 space-y-2">
                    <div className="rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-error">
                      {t("session.mock.didNotKnow")}
                    </div>
                    <div className="rounded-btn border border-brand-gold/25 bg-brand-gold/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-brand-gold">
                      {t("session.mock.knewSomewhat")}
                    </div>
                    <div className="rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-success">
                      {t("session.mock.knewForSure")}
                    </div>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28 lg:px-12" aria-labelledby="progress-heading">
          <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("progress.eyebrow")}
              </p>
              <h2
                id="progress-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("progress.title")}
              </h2>
              <p className="mt-5 max-w-xl font-body text-base leading-7 text-secondary">
                {t("progress.description")}
              </p>
              <ul className="mt-8 space-y-4">
                {[t("progress.points.activity"), t("progress.points.weaknesses"), t("progress.points.schedule")].map(
                  (point) => (
                    <li key={point} className="flex items-start gap-3 font-body text-body-sm leading-6 text-secondary">
                      <Check className="mt-1 size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                      {point}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="rounded-card border border-border bg-card p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-heading text-xl">{t("progress.mock.title")}</p>
                    <p className="mt-1 font-body text-body-xs text-secondary">{t("progress.mock.caption")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-2xl text-brand-gold">68%</p>
                    <p className="font-body text-[10px] uppercase tracking-wider text-muted">
                      {t("progress.mock.mastery")}
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid grid-flow-col grid-rows-7 gap-1.5 overflow-hidden" aria-hidden="true">
                  {HEATMAP_LEVELS.map((level, index) => (
                    <span
                      key={index}
                      className={`aspect-square min-w-2 rounded-[3px] border ${heatmapColor(level)}`}
                    />
                  ))}
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    [t("progress.mock.biochemistry"), "82%"],
                    [t("progress.mock.physiology"), "64%"],
                    [t("progress.mock.microbiology"), "51%"],
                  ].map(([label, value], index) => (
                    <div key={label} className="rounded-btn border border-white/[0.08] bg-background/45 p-3">
                      <div className="flex items-center justify-between gap-2 font-body text-body-xs">
                        <span className="text-secondary">{label}</span>
                        <span className={index === 2 ? "text-brand-gold" : "text-primary"}>{value}</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-white/10">
                        <div
                          className={index === 2 ? "h-full rounded-full bg-brand-gold" : "h-full rounded-full bg-brand-sage"}
                          style={{ width: value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="dla-kogo"
          className="scroll-mt-16 border-y border-border bg-sidebar/30 px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="paths-heading"
        >
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="max-w-2xl">
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("paths.eyebrow")}
              </p>
              <h2
                id="paths-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("paths.title")}
              </h2>
              <p className="mt-5 font-body text-base leading-7 text-secondary">{t("paths.description")}</p>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Reveal>
                <article className="group relative overflow-hidden rounded-card border border-border bg-card p-7 transition-colors duration-200 ease-out hover:border-brand-sage/40">
                  <GraduationCap className="size-8 text-brand-sage" aria-hidden="true" />
                  <h3 className="mt-10 font-heading text-3xl">{t("paths.dentistry.title")}</h3>
                  <p className="mt-3 max-w-lg font-body text-body-md leading-7 text-secondary">
                    {t("paths.dentistry.description")}
                  </p>
                  <p className="mt-8 font-body text-body-xs font-semibold uppercase tracking-widest text-brand-gold">
                    {t("paths.dentistry.scope")}
                  </p>
                </article>
              </Reveal>
              <Reveal delay={0.08}>
                <article className="group relative overflow-hidden rounded-card border border-border bg-card p-7 transition-colors duration-200 ease-out hover:border-brand-sage/40">
                  <BookOpen className="size-8 text-brand-sage" aria-hidden="true" />
                  <h3 className="mt-10 font-heading text-3xl">{t("paths.medicine.title")}</h3>
                  <p className="mt-3 max-w-lg font-body text-body-md leading-7 text-secondary">
                    {t("paths.medicine.description")}
                  </p>
                  <p className="mt-8 font-body text-body-xs font-semibold uppercase tracking-widest text-brand-gold">
                    {t("paths.medicine.scope")}
                  </p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-16 border-y border-border bg-sidebar/30 px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <Reveal>
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("faq.eyebrow")}
              </p>
              <h2
                id="faq-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("faq.title")}
              </h2>
              <p className="mt-5 font-body text-base leading-7 text-secondary">{t("faq.description")}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <div>
                {faqItems.map(([question, answer]) => (
                  <details key={question} className="group border-b border-border">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 font-body text-body-md font-medium text-primary marker:content-none">
                      {question}
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-brand-gold transition-transform duration-200 ease-out group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-5 pr-12 font-body text-body-sm leading-7 text-secondary">{answer}</p>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-24 text-center sm:px-8 md:py-32 lg:px-12" aria-labelledby="final-cta-heading">
          <Reveal className="mx-auto max-w-3xl">
            <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
              {t("finalCta.eyebrow")}
            </p>
            <h2
              id="final-cta-heading"
              className="mt-4 text-balance font-heading text-[clamp(2.3rem,5vw,4.5rem)] leading-[1.03] tracking-[-0.03em]"
            >
              {t("finalCta.title")} <span className="italic text-brand-gold">{t("finalCta.accent")}</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-7 text-secondary">
              {t("finalCta.description")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={registrationHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand-gold px-7 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110 active:scale-[0.98]"
              >
                {registrationOpen ? t("actions.register") : t("actions.login")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-btn border border-white/15 px-7 py-3 font-body text-body-md font-semibold text-primary transition-colors duration-200 ease-out hover:bg-white/[0.05]"
              >
                {t("actions.alreadyHaveAccount")}
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border bg-sidebar/35 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-base text-secondary">
            Kurs na <span className="text-brand-gold">LDEK</span>
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label={t("footer.ariaLabel")}>
            <a
              href="mailto:kontakt@kursnaldek.pl"
              className="font-body text-body-xs text-muted transition-colors hover:text-secondary"
            >
              {t("footer.contact")}
            </a>
            <Link
              href="/regulamin"
              className="font-body text-body-xs text-muted transition-colors hover:text-secondary"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/polityka-prywatnosci"
              className="font-body text-body-xs text-muted transition-colors hover:text-secondary"
            >
              {t("footer.privacy")}
            </Link>
          </nav>
          <p className="font-body text-body-xs text-muted">{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
