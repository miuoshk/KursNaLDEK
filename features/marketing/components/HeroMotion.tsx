"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, Flame, RotateCcw, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { DemoMarkdown } from "@/features/marketing/components/DemoMarkdown";
import { Rycina } from "@/features/shared/components/Rycina";

type HeroMotionProps = {
  registrationOpen: boolean;
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const STAGE_MS = 5200;
const STAGE_COUNT = 3;
const GOAL_TOTAL = 20;
const ANSWER_KEYS = ["answerA", "answerB", "answerC", "answerD", "answerE"] as const;
const ANSWER_LETTERS = ["A", "B", "C", "D", "E"] as const;
const CORRECT_ANSWER = 1;
/** Rozkład 20 pytań dzisiejszej sesji na przedmioty (mock). */
const PLAN_SUBJECTS = [
  { key: "subjectSurgery", count: 6, width: "30%" },
  { key: "subjectEndo", count: 8, width: "40%" },
  { key: "subjectOrtho", count: 6, width: "30%" },
] as const;
const WEAK_AREAS = [
  { key: "subjectOrtho", score: "2/4", width: "50%" },
  { key: "subjectSurgery", score: "3/4", width: "75%" },
] as const;
/** Liczby na kartach „Cel dzienny” i „Seria” per etap demo — karty żyją razem z ekranem. */
const GOAL_BY_STAGE = [12, 13, 20] as const;
const STREAK_BY_STAGE = [12, 12, 13] as const;

const copyContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const copyItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

const stageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT, staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const stageItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
};

export function HeroMotion({ registrationOpen }: HeroMotionProps) {
  const t = useTranslations("marketing");
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const deviceRef = useRef<HTMLDivElement>(null);
  const inView = useInView(deviceRef, { amount: 0.35 });

  const running = !reducedMotion && !hovered && !hidden && inView;

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setStage((current) => (current + 1) % STAGE_COUNT);
    }, STAGE_MS);
    return () => window.clearInterval(interval);
  }, [running, stage]);

  const registrationHref = registrationOpen ? "/register" : "/login";
  const goal = GOAL_BY_STAGE[stage];
  const streak = STREAK_BY_STAGE[stage];
  const goalDone = goal >= GOAL_TOTAL;

  return (
    <section
      aria-labelledby="marketing-hero-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden border-b border-border bg-background px-5 pb-16 pt-28 sm:px-8 md:pb-20 md:pt-32 lg:px-12"
    >
      <div
        className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-brand-gold/35 to-transparent"
        aria-hidden="true"
      />

      <Rycina
        id="sec-session-trigeminal"
        priority
        mask="edge-right"
        className="-right-[22%] top-0 aspect-[0.8] h-[72vh] opacity-[0.16] lg:-top-[18%] lg:right-0 lg:h-[136%] lg:opacity-[0.38]"
      />
      {/* Rycina wychodzi poza sekcję, więc zanikanie przy górnej i dolnej krawędzi robi nakładka z tła. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
        <motion.div variants={copyContainer} initial="hidden" animate="visible" className="relative z-10 max-w-2xl">
          <motion.p
            variants={copyItem}
            className="font-body text-body-xs font-semibold uppercase tracking-[0.22em] text-brand-sage"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            variants={copyItem}
            id="marketing-hero-title"
            className="mt-5 max-w-[11ch] text-balance font-heading text-[clamp(3rem,6.3vw,6rem)] leading-[0.98] tracking-[-0.04em] text-primary"
          >
            {t("hero.titleStart")}{" "}
            <span className="italic text-brand-gold">{t("hero.titleAccent")}</span>
          </motion.h1>
          <motion.p
            variants={copyItem}
            className="mt-7 max-w-xl text-pretty font-body text-base leading-7 text-secondary md:text-lg md:leading-8"
          >
            {t("hero.description")}
          </motion.p>
          <motion.div variants={copyItem} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={registrationHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand-gold px-6 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110 active:scale-[0.98]"
            >
              {registrationOpen ? t("actions.register") : t("actions.login")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#jak-dziala"
              className="inline-flex min-h-11 items-center justify-center rounded-btn border border-white/15 px-6 py-3 font-body text-body-md font-semibold text-primary transition-colors duration-200 ease-out hover:border-brand-sage/50 hover:bg-white/[0.04]"
            >
              {t("actions.seeHow")}
            </a>
          </motion.div>
          <motion.div variants={copyItem} className="mt-9 flex items-center gap-3">
            <CheckCircle2 className="size-4 shrink-0 text-brand-sage" aria-hidden="true" />
            <p className="font-body text-body-xs text-muted">{t("hero.productProof")}</p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.18, ease: EASE_OUT }}
          className="relative mx-auto w-full max-w-[720px]"
          aria-hidden="true"
        >
          <div
            ref={deviceRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative overflow-hidden rounded-[20px] border border-brand-sage/25 bg-sidebar p-2 shadow-2xl"
          >
            <div className="rounded-[15px] border border-border bg-background">
              <div className="flex h-12 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-gold" />
                  <span className="font-heading text-sm text-primary">Kurs na LDEK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: STAGE_COUNT }, (_, item) => {
                    const active = stage === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        tabIndex={-1}
                        onClick={() => setStage(item)}
                        className="group relative flex h-5 items-center"
                        aria-label={t("hero.demo.stageLabel", { number: item + 1 })}
                      >
                        <motion.span
                          layout
                          transition={{ duration: 0.28, ease: EASE_OUT }}
                          className={
                            active
                              ? "relative h-1.5 w-7 overflow-hidden rounded-full bg-white/15"
                              : "h-1.5 w-1.5 rounded-full bg-white/20 transition-colors group-hover:bg-white/40"
                          }
                        >
                          {active ? (
                            <motion.span
                              key={`${item}-${running ? "run" : "hold"}`}
                              className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-brand-gold"
                              initial={{ scaleX: running ? 0 : 1 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: running ? STAGE_MS / 1000 : 0, ease: "linear" }}
                            />
                          ) : null}
                        </motion.span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Od lg lewy padding robi miejsce pod pływającą kartę „Cel dzienny”. */}
              <div className="min-h-[520px] p-5 sm:min-h-[540px] sm:p-7 lg:min-h-[600px] lg:pl-[5.5rem] xl:pl-16">
                <AnimatePresence mode="wait" initial={false}>
                  {stage === 0 ? (
                    <motion.div
                      key="plan"
                      variants={stageVariants}
                      initial={reducedMotion ? false : "hidden"}
                      animate="visible"
                      exit={reducedMotion ? undefined : "exit"}
                    >
                      <motion.p
                        variants={stageItem}
                        className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage"
                      >
                        {t("hero.demo.planEyebrow")}
                      </motion.p>
                      <motion.h2 variants={stageItem} className="mt-3 font-heading text-2xl text-primary sm:text-3xl">
                        {t("hero.demo.planTitle")}
                      </motion.h2>
                      <motion.p variants={stageItem} className="mt-2 font-body text-body-sm leading-6 text-secondary">
                        {t("hero.demo.planDescription")}
                      </motion.p>
                      <motion.div variants={stageItem} className="mt-7 grid grid-cols-2 gap-3">
                        <div className="rounded-card border border-border bg-card p-4">
                          <RotateCcw className="size-5 text-brand-gold" />
                          <p className="mt-5 font-heading text-3xl text-primary">8</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">{t("hero.demo.reviews")}</p>
                        </div>
                        <div className="rounded-card border border-border bg-card p-4">
                          <Clock3 className="size-5 text-brand-sage" />
                          <p className="mt-5 font-heading text-3xl text-primary">18</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">{t("hero.demo.minutes")}</p>
                        </div>
                      </motion.div>
                      <motion.div
                        variants={stageItem}
                        className="mt-4 rounded-card border border-border bg-card p-4"
                      >
                        <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
                          {t("hero.demo.planSubjectsLabel")}
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {PLAN_SUBJECTS.map((subject) => (
                            <li key={subject.key}>
                              <div className="flex items-center justify-between font-body text-body-xs">
                                <span className="text-primary">{t(`hero.demo.${subject.key}`)}</span>
                                <span className="text-secondary">{subject.count}</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-white/10">
                                <motion.div
                                  className="h-full rounded-full bg-brand-sage"
                                  initial={reducedMotion ? false : { width: 0 }}
                                  animate={{ width: subject.width }}
                                  transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                      <motion.div
                        variants={stageItem}
                        className="mt-4 flex items-center justify-center gap-2 rounded-btn bg-brand-gold px-5 py-3 font-body text-body-sm font-semibold text-brand-bg"
                      >
                        {t("hero.demo.start")}
                        <ArrowRight className="size-4" />
                      </motion.div>
                      <motion.p
                        variants={stageItem}
                        className="mt-3 text-center font-body text-[11px] text-muted"
                      >
                        {t("hero.demo.lastSession")}
                      </motion.p>
                    </motion.div>
                  ) : null}

                  {stage === 1 ? (
                    <motion.div
                      key="question"
                      variants={stageVariants}
                      initial={reducedMotion ? false : "hidden"}
                      animate="visible"
                      exit={reducedMotion ? undefined : "exit"}
                    >
                      <motion.div variants={stageItem} className="flex items-center justify-between">
                        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage">
                          {t("hero.demo.questionEyebrow")}
                        </p>
                        <span className="font-body text-[10px] text-muted">6 / 20</span>
                      </motion.div>
                      <motion.h2
                        variants={stageItem}
                        className="mt-3 text-pretty font-heading text-lg leading-6 text-primary sm:text-xl sm:leading-7"
                      >
                        {t("hero.demo.question")}
                      </motion.h2>
                      <div className="mt-4 space-y-1.5">
                        {ANSWER_KEYS.map((key, index) => {
                          const correct = index === CORRECT_ANSWER;
                          return (
                            <motion.div
                              key={key}
                              variants={stageItem}
                              className={
                                correct
                                  ? "flex items-center justify-between rounded-btn border border-success/45 bg-success/[0.08] px-3 py-2 font-body text-body-xs text-success sm:text-body-sm"
                                  : "rounded-btn border border-white/10 bg-white/[0.025] px-3 py-2 font-body text-body-xs text-secondary sm:text-body-sm"
                              }
                            >
                              <span>
                                {ANSWER_LETTERS[index]}. {t(`hero.demo.${key}`)}
                              </span>
                              {correct ? <CheckCircle2 className="size-4 shrink-0" /> : null}
                            </motion.div>
                          );
                        })}
                      </div>
                      <motion.div
                        variants={stageItem}
                        className="mt-3 rounded-btn border border-brand-sage/20 bg-brand-sage/[0.08] px-3 py-2.5"
                      >
                        <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-sage">
                          {t("hero.demo.explanationLabel")}
                        </p>
                        <DemoMarkdown className="mt-1">{t("hero.demo.explanation")}</DemoMarkdown>
                      </motion.div>
                    </motion.div>
                  ) : null}

                  {stage === 2 ? (
                    <motion.div
                      key="summary"
                      variants={stageVariants}
                      initial={reducedMotion ? false : "hidden"}
                      animate="visible"
                      exit={reducedMotion ? undefined : "exit"}
                      className="text-center"
                    >
                      <motion.p
                        variants={stageItem}
                        className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage"
                      >
                        {t("hero.demo.summaryEyebrow")}
                      </motion.p>
                      <motion.div variants={stageItem} className="relative mx-auto mt-4 size-28">
                        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="var(--color-brand-gold)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            pathLength="1"
                            strokeDasharray="1"
                            initial={reducedMotion ? { strokeDashoffset: 0.15 } : { strokeDashoffset: 1 }}
                            animate={{ strokeDashoffset: 0.15 }}
                            transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-heading text-3xl text-primary">85%</span>
                          <span className="font-body text-[10px] uppercase tracking-wider text-muted">
                            {t("hero.demo.accuracy")}
                          </span>
                        </span>
                      </motion.div>
                      <motion.h2 variants={stageItem} className="mt-4 font-heading text-2xl text-primary">
                        {t("hero.demo.summaryTitle")}
                      </motion.h2>
                      <motion.div variants={stageItem} className="mt-5 grid grid-cols-3 gap-2 text-left">
                        <div className="rounded-card border border-border bg-card p-3">
                          <p className="font-heading text-xl text-brand-gold">+120</p>
                          <p className="mt-1 font-body text-[11px] text-secondary">XP</p>
                        </div>
                        <div className="rounded-card border border-border bg-card p-3">
                          <p className="font-heading text-xl text-primary">17/20</p>
                          <p className="mt-1 font-body text-[11px] text-secondary">{t("hero.demo.correct")}</p>
                        </div>
                        <div className="rounded-card border border-border bg-card p-3">
                          <p className="font-heading text-xl text-primary">6</p>
                          <p className="mt-1 font-body text-[11px] text-secondary">{t("hero.demo.scheduled")}</p>
                        </div>
                      </motion.div>
                      <motion.div
                        variants={stageItem}
                        className="mt-3 rounded-card border border-border bg-card p-4 text-left"
                      >
                        <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                          {t("hero.demo.summaryWeakLabel")}
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {WEAK_AREAS.map((area) => (
                            <li key={area.key}>
                              <div className="flex items-center justify-between font-body text-body-xs">
                                <span className="text-primary">{t(`hero.demo.${area.key}`)}</span>
                                <span className="text-secondary">{area.score}</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-white/10">
                                <motion.div
                                  className="h-full rounded-full bg-brand-gold"
                                  initial={reducedMotion ? false : { width: 0 }}
                                  animate={{ width: area.width }}
                                  transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 flex items-center gap-1.5 font-body text-[11px] text-muted">
                          <Clock3 className="size-3.5" />
                          {t("hero.demo.summaryNextReview")}
                        </p>
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Do lg karty stoją pod ekranem w siatce; od lg `contents` zdejmuje siatkę i karty pływają obok ekranu. */}
          <div className="mt-3 grid grid-cols-2 gap-3 lg:contents">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, -3, 0] }}
              transition={{
                opacity: { duration: 0.35, delay: 0.55 },
                x: { duration: 0.35, delay: 0.55, ease: EASE_OUT },
                y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
              }}
              className="rounded-card border border-border bg-card p-4 shadow-xl lg:absolute lg:-left-16 lg:top-10 lg:z-20 lg:w-40 xl:-left-24"
            >
              <div className="flex items-center gap-2">
                <Target className="size-4 text-brand-gold" />
                <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  {t("hero.demo.dailyGoal")}
                </span>
              </div>
              <p className="mt-3 flex items-baseline font-heading text-2xl text-primary">
                <span className="relative inline-grid overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={goal}
                      initial={reducedMotion ? false : { y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={reducedMotion ? undefined : { y: -14, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="tabular-nums"
                    >
                      {goal}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="text-base text-secondary">/{GOAL_TOTAL}</span>
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full origin-left rounded-full bg-brand-gold"
                  initial={reducedMotion ? { scaleX: goal / GOAL_TOTAL } : { scaleX: 0 }}
                  animate={{ scaleX: goal / GOAL_TOTAL }}
                  transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.1, ease: EASE_OUT }}
                />
              </div>
              <p className="mt-2 font-body text-[11px] leading-4 text-muted">
                {goalDone ? t("hero.demo.goalDone") : t("hero.demo.goalLeft", { count: GOAL_TOTAL - goal })}
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, 3, 0] }}
              transition={{
                opacity: { duration: 0.35, delay: 0.68 },
                x: { duration: 0.35, delay: 0.68, ease: EASE_OUT },
                y: { duration: 6.2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="rounded-card border border-border bg-card p-4 shadow-xl lg:absolute lg:-bottom-8 lg:right-6 lg:z-20 lg:w-44"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={goalDone && !reducedMotion ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                    className="inline-flex"
                  >
                    <Flame className="size-4 text-brand-gold" />
                  </motion.span>
                  <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    {t("hero.demo.streak")}
                  </span>
                </div>
                <span className="relative inline-grid overflow-hidden font-heading text-xl text-brand-gold">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={streak}
                      initial={reducedMotion ? false : { y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={reducedMotion ? undefined : { y: -12, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="tabular-nums"
                    >
                      {streak}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
              <p className="mt-2 font-body text-[11px] leading-4 text-muted">
                {goalDone ? t("hero.demo.streakExtended") : t("hero.demo.streakCaption")}
              </p>
            </motion.div>
          </div>

          <p className="sr-only">{t("hero.demo.accessibleDescription")}</p>
        </motion.div>
      </div>
    </section>
  );
}
