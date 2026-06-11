"use client";

import { useEffect, useRef, useState } from "react";
import { SESSION_LOADING_SLOGANS } from "@/features/shared/lib/slogans";

/** Jak długo pokazujemy jedno motto, zanim zaczniemy fade do następnego. */
const ROTATE_INTERVAL_MS = 5000;
/** Czas trwania fade out / fade in (musi pasować do duration-500 niżej). */
const FADE_MS = 500;

/**
 * Ekran ładowania sesji - zamiast surowego "Ładowanie sesji..." pokazuje
 * motta z `SESSION_LOADING_SLOGANS` plus podskakujące kropki w kolorze
 * brand-gold. Trzyma "vibe" marki i daje użytkownikowi micro-moment do
 * przygotowania się przed rozpoczęciem pytań (efekt "ostatniego słowa
 * przed lock-inem").
 *
 * Motto startuje od losowego i rotuje co `ROTATE_INTERVAL_MS` z płynnym
 * crossfade (opacity 1 -> 0 -> podmiana tekstu -> 0 -> 1), dzięki czemu
 * zmiana jest spokojna, nie skokowa.
 */
export function SessionLoadingScreen() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * SESSION_LOADING_SLOGANS.length),
  );
  const [visible, setVisible] = useState(true);
  const swapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (SESSION_LOADING_SLOGANS.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      swapTimeout.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % SESSION_LOADING_SLOGANS.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      if (swapTimeout.current) clearTimeout(swapTimeout.current);
    };
  }, []);

  const slogan = SESSION_LOADING_SLOGANS[index] ?? SESSION_LOADING_SLOGANS[0];

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

      <span className="sr-only">Ładowanie sesji…</span>
    </div>
  );
}
