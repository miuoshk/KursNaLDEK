"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getSloganPool } from "@/features/shared/lib/slogans";

/** Jak długo pokazujemy jedno motto, zanim zaczniemy fade do następnego. */
const ROTATE_INTERVAL_MS = 5000;
/** Czas trwania fade out / fade in (musi pasować do duration-500 niżej). */
const FADE_MS = 500;

export function SessionLoadingScreen() {
  const tSlogans = useTranslations("slogans");
  const tSession = useTranslations("session");
  const slogans = useMemo(() => getSloganPool(tSlogans, "sessionLoading"), [tSlogans]);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * Math.max(1, slogans.length)),
  );
  const [visible, setVisible] = useState(true);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slogans.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      swapTimeout.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % slogans.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      if (swapTimeout.current) clearTimeout(swapTimeout.current);
    };
  }, [slogans.length]);

  const slogan = slogans[index] ?? slogans[0] ?? tSlogans("default");

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="font-body text-body-xs uppercase tracking-[0.25em] text-muted">
        Przygotowuję sesję
      </p>

      <p
        className={`mt-6 max-w-md font-heading text-2xl font-bold text-primary transition-opacity duration-500 ease-out md:text-3xl ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {slogan}
      </p>

      <div className="mt-8 flex items-center gap-2" aria-hidden>
        <span
          className="inline-block size-2.5 rounded-full bg-brand-gold animate-bounce-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="inline-block size-2.5 rounded-full bg-brand-gold animate-bounce-dot"
          style={{ animationDelay: "160ms" }}
        />
        <span
          className="inline-block size-2.5 rounded-full bg-brand-gold animate-bounce-dot"
          style={{ animationDelay: "320ms" }}
        />
      </div>

      <span className="sr-only">{tSession("loadingSession")}</span>
    </div>
  );
}
