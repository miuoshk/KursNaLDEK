"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  RotateCcw,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type HeroMotionProps = {
  registrationOpen: boolean;
};

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const copyContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
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

export function HeroMotion({ registrationOpen }: HeroMotionProps) {
  const t = useTranslations("marketing");
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setStage((current) => (current + 1) % 3);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const registrationHref = registrationOpen ? "/register" : "/login";

  return (
    <section
      aria-labelledby="marketing-hero-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden border-b border-border bg-background px-5 pb-16 pt-28 sm:px-8 md:pb-20 md:pt-32 lg:px-12"
    >
      <div
        className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-brand-gold/35 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute left-[8%] top-28 size-64 rounded-full border border-brand-sage/[0.08] md:size-96"
        aria-hidden="true"
      />
      <div
        className="absolute left-[calc(8%+3rem)] top-40 size-40 rounded-full border border-brand-gold/[0.07] md:size-64"
        aria-hidden="true"
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
            <CheckCircle2 className="size-4 text-brand-sage" aria-hidden="true" />
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
          <svg
            viewBox="0 0 720 560"
            className="pointer-events-none absolute -inset-10 hidden size-[calc(100%+5rem)] overflow-visible md:block"
            fill="none"
          >
            <motion.path
              d="M78 112 C 190 28, 278 90, 354 170 S 560 302, 662 210"
              stroke="var(--color-brand-sage)"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="5 7"
              initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.35, ease: EASE_OUT }}
            />
            <motion.path
              d="M52 430 C 190 510, 300 448, 388 380 S 566 316, 690 450"
              stroke="var(--color-brand-gold)"
              strokeOpacity="0.18"
              strokeWidth="1"
              initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.48, ease: EASE_OUT }}
            />
          </svg>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, -3, 0] }}
            transition={{
              opacity: { duration: 0.35, delay: 0.55 },
              x: { duration: 0.35, delay: 0.55, ease: EASE_OUT },
              y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -left-3 top-8 z-20 hidden w-40 rounded-card border border-border bg-card p-4 shadow-xl md:block xl:-left-14"
          >
            <div className="flex items-center gap-2">
              <Target className="size-4 text-brand-gold" />
              <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
                {t("hero.demo.dailyGoal")}
              </span>
            </div>
            <p className="mt-3 font-heading text-2xl text-primary">15/20</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full origin-left rounded-full bg-brand-gold"
                initial={reducedMotion ? { scaleX: 0.75 } : { scaleX: 0 }}
                animate={{ scaleX: 0.75 }}
                transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, 3, 0] }}
            transition={{
              opacity: { duration: 0.35, delay: 0.68 },
              x: { duration: 0.35, delay: 0.68, ease: EASE_OUT },
              y: { duration: 6.2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -right-3 bottom-10 z-20 hidden w-44 rounded-card border border-border bg-card p-4 shadow-xl md:block xl:-right-12"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-brand-gold" />
                <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  {t("hero.demo.streak")}
                </span>
              </div>
              <span className="font-heading text-xl text-brand-gold">12</span>
            </div>
            <p className="mt-2 font-body text-[11px] leading-4 text-muted">{t("hero.demo.streakCaption")}</p>
          </motion.div>

          <div className="relative overflow-hidden rounded-[20px] border border-brand-sage/25 bg-sidebar p-2 shadow-2xl">
            <div className="rounded-[15px] border border-border bg-background">
              <div className="flex h-12 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-brand-gold" />
                  <span className="font-heading text-sm text-primary">Kurs na LDEK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((item) => (
                    <button
                      key={item}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setStage(item)}
                      className="relative size-5"
                      aria-label={t("hero.demo.stageLabel", { number: item + 1 })}
                    >
                      <span className="absolute inset-1.5 rounded-full bg-white/15" />
                      {stage === item ? (
                        <motion.span
                          layoutId="hero-demo-stage"
                          className="absolute inset-1 rounded-full border border-brand-gold bg-brand-gold/20"
                          transition={{ duration: 0.22, ease: EASE_OUT }}
                        />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[390px] p-5 sm:min-h-[420px] sm:p-7">
                <AnimatePresence mode="wait" initial={false}>
                  {stage === 0 ? (
                    <motion.div
                      key="plan"
                      initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: 0.26, ease: EASE_OUT }}
                    >
                      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage">
                        {t("hero.demo.planEyebrow")}
                      </p>
                      <h2 className="mt-3 font-heading text-2xl text-primary sm:text-3xl">
                        {t("hero.demo.planTitle")}
                      </h2>
                      <p className="mt-2 font-body text-body-sm leading-6 text-secondary">
                        {t("hero.demo.planDescription")}
                      </p>
                      <div className="mt-7 grid grid-cols-2 gap-3">
                        <div className="rounded-card border border-border bg-card p-4">
                          <RotateCcw className="size-5 text-brand-gold" />
                          <p className="mt-5 font-heading text-3xl text-primary">8</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">
                            {t("hero.demo.reviews")}
                          </p>
                        </div>
                        <div className="rounded-card border border-border bg-card p-4">
                          <Clock3 className="size-5 text-brand-sage" />
                          <p className="mt-5 font-heading text-3xl text-primary">18</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">
                            {t("hero.demo.minutes")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center justify-center gap-2 rounded-btn bg-brand-gold px-5 py-3 font-body text-body-sm font-semibold text-brand-bg">
                        {t("hero.demo.start")}
                        <ArrowRight className="size-4" />
                      </div>
                    </motion.div>
                  ) : null}

                  {stage === 1 ? (
                    <motion.div
                      key="question"
                      initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: 0.26, ease: EASE_OUT }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage">
                          {t("hero.demo.questionEyebrow")}
                        </p>
                        <span className="font-body text-[10px] text-muted">6 / 20</span>
                      </div>
                      <h2 className="mt-4 text-pretty font-heading text-xl leading-7 text-primary sm:text-2xl sm:leading-8">
                        {t("hero.demo.question")}
                      </h2>
                      <div className="mt-6 space-y-2.5">
                        <div className="rounded-btn border border-white/10 bg-white/[0.025] px-4 py-3 font-body text-body-sm text-secondary">
                          A. {t("hero.demo.answerA")}
                        </div>
                        <motion.div
                          initial={reducedMotion ? false : { borderColor: "rgba(255,255,255,.1)" }}
                          animate={{ borderColor: "rgba(74,222,128,.45)" }}
                          transition={{ duration: 0.3, delay: 0.22 }}
                          className="flex items-center justify-between rounded-btn border bg-success/[0.08] px-4 py-3 font-body text-body-sm text-success"
                        >
                          <span>B. {t("hero.demo.answerB")}</span>
                          <CheckCircle2 className="size-4" />
                        </motion.div>
                        <div className="rounded-btn border border-white/10 bg-white/[0.025] px-4 py-3 font-body text-body-sm text-secondary">
                          C. {t("hero.demo.answerC")}
                        </div>
                      </div>
                      <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.42, ease: EASE_OUT }}
                        className="mt-5 rounded-btn border border-brand-sage/20 bg-brand-sage/[0.08] px-4 py-3"
                      >
                        <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-brand-sage">
                          {t("hero.demo.explanationLabel")}
                        </p>
                        <p className="mt-1 font-body text-body-xs leading-5 text-secondary">
                          {t("hero.demo.explanation")}
                        </p>
                      </motion.div>
                    </motion.div>
                  ) : null}

                  {stage === 2 ? (
                    <motion.div
                      key="summary"
                      initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: 0.26, ease: EASE_OUT }}
                      className="text-center"
                    >
                      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-sage">
                        {t("hero.demo.summaryEyebrow")}
                      </p>
                      <div className="relative mx-auto mt-5 size-32">
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
                            transition={{ duration: 0.85, ease: EASE_OUT }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-heading text-3xl text-primary">85%</span>
                          <span className="font-body text-[10px] uppercase tracking-wider text-muted">
                            {t("hero.demo.accuracy")}
                          </span>
                        </span>
                      </div>
                      <h2 className="mt-5 font-heading text-2xl text-primary">{t("hero.demo.summaryTitle")}</h2>
                      <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                        <div className="rounded-card border border-border bg-card p-4">
                          <p className="font-heading text-2xl text-brand-gold">+120</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">XP</p>
                        </div>
                        <div className="rounded-card border border-border bg-card p-4">
                          <p className="font-heading text-2xl text-primary">6</p>
                          <p className="mt-1 font-body text-body-xs text-secondary">
                            {t("hero.demo.scheduled")}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <p className="sr-only">{t("hero.demo.accessibleDescription")}</p>
        </motion.div>
      </div>
    </section>
  );
}
