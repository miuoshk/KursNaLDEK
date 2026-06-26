"use client";

import { useEffect } from "react";

export default function KalkulatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[kalkulator] route error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-6 py-16 text-center">
      <h1 className="font-heading text-2xl text-[color:var(--k-primary)]">Coś poszło nie tak</h1>
      <p className="mt-3 font-body text-sm text-[color:var(--k-muted)]">
        Odśwież stronę. Jeśli problem wraca, wyloguj się i zaloguj ponownie.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 self-center rounded-[var(--k-radius-btn)] bg-[color:var(--k-primary)] px-5 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-[color:var(--k-primary-light)]"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
