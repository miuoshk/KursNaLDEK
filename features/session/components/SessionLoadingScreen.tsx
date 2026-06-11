"use client";

import { useEffect, useState } from "react";
import { SESSION_LOADING_SLOGANS } from "@/features/shared/lib/slogans";

/** Co ile ms zmienia się motto na ekranie ładowania. */
const ROTATE_INTERVAL_MS = 3000;

/**
 * Ekran ładowania sesji - zamiast surowego "Ładowanie sesji..." pokazuje
 * motta z `SESSION_LOADING_SLOGANS` plus pulsujące kropki w kolorze
 * brand-gold. Trzyma "vibe" marki i daje użytkownikowi micro-moment do
 * przygotowania się przed rozpoczęciem pytań (efekt "ostatniego słowa
 * przed lock-inem").
 *
 * Motto startuje od losowego i rotuje co `ROTATE_INTERVAL_MS`, więc przy
 * dłuższym ładowaniu użytkownik widzi kilka różnych tekstów. Każda zmiana
 * remountuje <p> przez `key`, co retriggeruje animację `animate-fade-in`.
 *
 * Cała animacja jest czysto CSS (keyframes z tailwind.config + delay
 * inline), brak zewnętrznych bibliotek.
 */
export function SessionLoadingScreen() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * SESSION_LOADING_SLOGANS.length),
  );

  useEffect(() => {
    if (SESSION_LOADING_SLOGANS.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % SESSION_LOADING_SLOGANS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
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
        key={index}
        className="mt-6 max-w-md animate-fade-in font-heading text-2xl font-bold text-primary md:text-3xl"
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
