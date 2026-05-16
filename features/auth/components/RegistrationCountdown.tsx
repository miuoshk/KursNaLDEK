"use client";

import { useEffect, useMemo, useState } from "react";
import { getRegistrationRemainingMs } from "@/lib/registrationWindow";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    `${String(days).padStart(2, "0")}d`,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    `${String(seconds).padStart(2, "0")}s`,
  ];

  return parts.join(" ");
}

export function RegistrationCountdown() {
  const [remainingMs, setRemainingMs] = useState<number>(() => getRegistrationRemainingMs());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs(getRegistrationRemainingMs());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const formatted = useMemo(() => formatRemaining(remainingMs), [remainingMs]);

  if (remainingMs <= 0) {
    return (
      <p className="mt-4 rounded-card border border-brand-sage/40 bg-brand-sage/10 px-4 py-3 font-body text-body-sm text-secondary">
        Rejestracja została ponownie otwarta.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-card border border-brand-gold/40 bg-brand-gold/10 px-4 py-3">
      <p className="font-body text-body-sm text-secondary">
        Rejestracja nowych uczestników wróci 17 maja 2026 o 21:00.
      </p>
      <p className="mt-2 font-body text-body-md font-semibold text-brand-gold">{formatted}</p>
    </div>
  );
}
