import Link from "next/link";
import type { ComponentType } from "react";
import { IconDental } from "@tabler/icons-react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  RotateCcw,
  Stethoscope,
  Target,
  Trophy,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DemoMarkdown } from "@/features/marketing/components/DemoMarkdown";
import { HeroMotion } from "@/features/marketing/components/HeroMotion";
import { MarketingNav } from "@/features/marketing/components/MarketingNav";
import { Reveal } from "@/features/marketing/components/Reveal";
import { Rycina } from "@/features/shared/components/Rycina";
import { cn } from "@/lib/utils";

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

type CourseKey = "ldek" | "ldew" | "dentistry" | "medicine";

const SESSION_ANSWERS = ["A", "B", "C", "D", "E"] as const;
const SESSION_CORRECT = 1;
/** Feedback po sesji: trafność w najsłabszych obszarach (mock). */
const FEEDBACK_AREAS = [
  { key: "feedbackArea1", value: "45%", tone: "gold" },
  { key: "feedbackArea2", value: "58%", tone: "gold" },
  { key: "feedbackArea3", value: "72%", tone: "sage" },
] as const;

type CourseIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/** Rycina wypełnia prawą część karty od góry do dołu i dotyka prawej krawędzi; aspect wg viewBox pliku. */
const COURSES: { key: CourseKey; icon: CourseIcon; rycina: string; rycinaClass: string }[] = [
  { key: "ldek", icon: BookOpen, rycina: "path-stoma-skull", rycinaClass: "aspect-[1.4]" },
  { key: "ldew", icon: BadgeCheck, rycina: "anat-permanent-arch", rycinaClass: "aspect-[1.4]" },
  { key: "dentistry", icon: IconDental, rycina: "anat-skull-lat", rycinaClass: "aspect-[1.17]" },
  { key: "medicine", icon: Stethoscope, rycina: "path-lek-heart-lungs", rycinaClass: "aspect-[1.4]" },
];

type MobileRycinaProps = {
  id: string;
  aspectClass: string;
  /** Breakpoint, od którego pasek znika (na desktopie rycina siedzi na krawędzi sekcji). */
  hideFrom: "md" | "lg";
  className?: string;
};

/** Mobile: rycina jako pasek pod nagłówkiem sekcji, mockupy idą niżej bez tła. */
function MobileRycina({ id, aspectClass, hideFrom, className }: MobileRycinaProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rycina-mask-fade-y relative mt-6 h-64 overflow-hidden",
        hideFrom === "md" ? "md:hidden" : "lg:hidden",
        className,
      )}
    >
      <Rycina
        id={id}
        opacity={0.36}
        mask="none"
        className={cn("left-1/2 top-1/2 w-[112vw] -translate-x-1/2 -translate-y-1/2", aspectClass)}
      />
    </div>
  );
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

  const progressPoints = [
    t("progress.points.activity"),
    t("progress.points.mastery"),
    t("progress.points.antares"),
    t("progress.points.calibration"),
    t("progress.points.readiness"),
  ];

  const masteryRows: [string, string][] = [
    [t("progress.mock.surgery"), "82%"],
    [t("progress.mock.endodontics"), "64%"],
    [t("progress.mock.orthodontics"), "51%"],
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

        <section
          className="relative overflow-hidden px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="product-heading"
        >
          <Rycina
            id="sec-progress-brain"
            opacity={0.24}
            mask="edge-right"
            className="hidden md:block inset-y-0 right-0 aspect-[1.4] h-full"
          />
          <div className="relative mx-auto max-w-[1400px]">
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

            <MobileRycina id="sec-progress-brain" aspectClass="aspect-[1.4]" hideFrom="md" />

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
                  <span className="mt-8 font-heading text-2xl text-brand-gold">{t("product.mock.rankName")}</span>
                  <div className="mt-auto">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[68%] rounded-full bg-brand-gold" />
                    </div>
                    <p className="mt-3 font-body text-body-xs text-secondary">{t("product.mock.rankProgress")}</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          id="jak-dziala"
          className="relative scroll-mt-16 overflow-hidden border-y border-border bg-sidebar/30 px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="session-heading"
        >
          <Rycina
            id="anat-vessels-head"
            opacity={0.26}
            mask="edge-right"
            className="hidden lg:block inset-y-0 right-0 aspect-square h-full"
          />
          <div className="relative mx-auto max-w-[1400px]">
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

            <MobileRycina id="anat-vessels-head" aspectClass="aspect-square" hideFrom="lg" />

            {/* 02 (pełne pytanie) jest najwyższe, więc zajmuje prawą kolumnę na dwa wiersze; 04 idzie na całą szerokość. */}
            <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto]">
              <Reveal className="lg:col-start-1 lg:row-start-1">
                <article className="flex h-full flex-col rounded-card border border-border bg-card/90 p-6 backdrop-blur-sm">
                  <span className="font-heading text-3xl text-brand-gold">01</span>
                  <h3 className="mt-6 font-heading text-2xl">{t("session.steps.chooseTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.chooseDescription")}
                  </p>
                  <div className="mt-auto space-y-2 pt-6">
                    <div className="rounded-btn border border-brand-sage/25 bg-brand-sage/10 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-body-sm font-semibold">{t("session.mock.smartSession")}</span>
                        <span className="rounded-pill border border-brand-gold/30 px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-brand-gold">
                          {t("session.mock.recommended")}
                        </span>
                      </div>
                      <p className="mt-2 font-body text-body-xs text-secondary">{t("session.mock.smartCaption")}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-btn border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-body-sm text-secondary">
                      <span>{t("session.mock.bySubject")}</span>
                      <ArrowRight className="size-4 text-muted" aria-hidden="true" />
                    </div>
                    <div className="flex items-center justify-between rounded-btn border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-body-sm text-secondary">
                      <span>{t("session.mock.overdue")}</span>
                      <span className="rounded-pill bg-brand-gold/15 px-2 py-0.5 font-body text-body-xs font-semibold text-brand-gold">8</span>
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.07} className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <article className="h-full rounded-card border border-border bg-card/90 p-6 backdrop-blur-sm">
                  <span className="font-heading text-3xl text-brand-gold">02</span>
                  <h3 className="mt-6 font-heading text-2xl">{t("session.steps.answerTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.answerDescription")}
                  </p>
                  <div className="mt-6 rounded-card border border-white/[0.08] bg-background/45 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage">
                        {t("session.mock.questionEyebrow")}
                      </p>
                      <span className="font-body text-[10px] text-muted">12 / 20</span>
                    </div>
                    <p className="mt-3 text-pretty font-heading text-lg leading-6 text-primary">
                      {t("session.mock.question")}
                    </p>
                    <div className="mt-4 space-y-1.5">
                      {SESSION_ANSWERS.map((letter, index) => {
                        const correct = index === SESSION_CORRECT;
                        return (
                          <div
                            key={letter}
                            className={
                              correct
                                ? "flex items-center justify-between rounded-btn border border-success/40 bg-success/[0.08] px-3 py-2 font-body text-body-xs text-success sm:text-body-sm"
                                : "rounded-btn border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-body-xs text-secondary sm:text-body-sm"
                            }
                          >
                            <span>
                              {letter}. {t(`session.mock.answer${letter}`)}
                            </span>
                            {correct ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : null}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 rounded-btn border border-brand-sage/20 bg-brand-sage/[0.08] px-3 py-2.5">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-sage">
                        {t("hero.demo.explanationLabel")}
                      </p>
                      <DemoMarkdown className="mt-1">{t("session.mock.explanation")}</DemoMarkdown>
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.14} className="lg:col-start-1 lg:row-start-2">
                <article className="flex h-full flex-col rounded-card border border-border bg-card/90 p-6 backdrop-blur-sm">
                  <span className="font-heading text-3xl text-brand-gold">03</span>
                  <h3 className="mt-6 font-heading text-2xl">{t("session.steps.rateTitle")}</h3>
                  <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                    {t("session.steps.rateDescription")}
                  </p>
                  <div className="mt-auto space-y-2 pt-6">
                    <div className="rounded-btn border border-success/20 bg-success/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-success">
                      {t("session.mock.knewForSure")}
                    </div>
                    <div className="rounded-btn border border-brand-gold/25 bg-brand-gold/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-brand-gold">
                      {t("session.mock.knewSomewhat")}
                    </div>
                    <div className="rounded-btn border border-error/20 bg-error/[0.08] px-3 py-2.5 text-center font-body text-body-sm text-error">
                      {t("session.mock.didNotKnow")}
                    </div>
                  </div>
                </article>
              </Reveal>

              <Reveal delay={0.21} className="lg:col-span-2 lg:row-start-3">
                <article className="grid gap-6 rounded-card border border-border bg-card/90 p-6 backdrop-blur-sm lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <div>
                    <span className="font-heading text-3xl text-brand-gold">04</span>
                    <h3 className="mt-6 font-heading text-2xl">{t("session.steps.feedbackTitle")}</h3>
                    <p className="mt-3 font-body text-body-sm leading-6 text-secondary">
                      {t("session.steps.feedbackDescription")}
                    </p>
                  </div>
                  <div className="rounded-card border border-white/[0.08] bg-background/45 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
                        {t("session.mock.feedbackTitle")}
                      </p>
                      <span className="font-body text-[10px] text-muted">{t("session.mock.feedbackScheduled")}</span>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {FEEDBACK_AREAS.map((area) => (
                        <li key={area.key}>
                          <div className="flex items-center justify-between gap-3 font-body text-body-xs sm:text-body-sm">
                            <span className="text-primary">{t(`session.mock.${area.key}`)}</span>
                            <span className={area.tone === "gold" ? "text-brand-gold" : "text-secondary"}>{area.value}</span>
                          </div>
                          <div className="mt-1.5 h-1 rounded-full bg-white/10">
                            <div
                              className={area.tone === "gold" ? "h-full rounded-full bg-brand-gold" : "h-full rounded-full bg-brand-sage"}
                              style={{ width: area.value }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between rounded-btn border border-brand-sage/20 bg-brand-sage/[0.08] px-3 py-2 font-body text-body-xs">
                      <span className="text-secondary">{t("session.mock.feedbackCalibrationLabel")}</span>
                      <span className="font-semibold text-brand-sage">{t("session.mock.feedbackCalibrationValue")}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="progress-heading"
        >
          <Rycina
            id="sky-kalibra"
            opacity={0.26}
            mask="edge-left"
            className="hidden lg:block inset-y-0 left-0 aspect-square h-full"
          />
          <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
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
              <MobileRycina id="sky-kalibra" aspectClass="aspect-square" hideFrom="lg" />
              <ul className="mt-8 space-y-4">
                {progressPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 font-body text-body-sm leading-6 text-secondary">
                    <Check className="mt-1 size-4 shrink-0 text-brand-gold" aria-hidden="true" />
                    {point}
                  </li>
                ))}
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
                  {masteryRows.map(([label, value], index) => (
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
          id="kursy"
          className="scroll-mt-16 border-y border-border bg-sidebar/30 px-5 py-20 sm:px-8 md:py-28 lg:px-12"
          aria-labelledby="courses-heading"
        >
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="max-w-2xl">
              <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
                {t("courses.eyebrow")}
              </p>
              <h2
                id="courses-heading"
                className="mt-3 text-balance font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.08] tracking-[-0.025em]"
              >
                {t("courses.title")}
              </h2>
              <p className="mt-5 font-body text-base leading-7 text-secondary">{t("courses.description")}</p>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {COURSES.map((course, index) => {
                const Icon = course.icon;
                return (
                  <Reveal key={course.key} delay={index * 0.06}>
                    <Link
                      href={registrationHref}
                      className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-card border border-border bg-card p-7 transition-colors duration-200 ease-out hover:border-brand-sage/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                    >
                      <Rycina
                        id={course.rycina}
                        mask="fade-left"
                        className={`inset-y-0 right-0 h-full opacity-[0.3] transition-opacity duration-300 ease-out group-hover:opacity-[0.4] ${course.rycinaClass}`}
                      />
                      <div className="relative z-10 flex h-full flex-col">
                        <Icon className="size-8 text-brand-sage" aria-hidden="true" />
                        <h3 className="mt-10 font-heading text-3xl">{t(`courses.${course.key}.title`)}</h3>
                        <p className="mt-3 max-w-md font-body text-body-md leading-7 text-secondary">
                          {t(`courses.${course.key}.description`)}
                        </p>
                        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                          <p className="font-body text-body-xs font-semibold uppercase tracking-widest text-brand-gold">
                            {t(`courses.${course.key}.scope`)}
                          </p>
                          <ArrowRight
                            className="size-5 shrink-0 text-secondary transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-primary"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden px-5 py-24 text-center sm:px-8 md:py-32 lg:px-12"
          aria-labelledby="final-cta-heading"
        >
          <Rycina
            id="sky-antares"
            opacity={0.24}
            mask="fade-y"
            className="inset-x-0 top-1/2 aspect-[1.33] w-full -translate-y-1/2"
          />
          <Reveal className="relative mx-auto max-w-3xl">
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
                {t("actions.login")}
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
              href="mailto:info@zenitlabs.pl"
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
