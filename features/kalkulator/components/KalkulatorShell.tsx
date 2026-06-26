"use client";

import { KalkulatorDashboard } from "@/features/kalkulator/components/dashboard/KalkulatorDashboard";
import type { Practice } from "@/features/kalkulator/types/practice";

type Props = {
  practice: Practice;
};

export function KalkulatorShell({ practice }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="border-b border-[color:var(--k-border)] pb-6">
        <p className="font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]">
          kursnaldek.pl
        </p>
        <h1 className="mt-1 font-heading text-2xl text-[color:var(--k-primary)]">
          {practice.name}
        </h1>
        {practice.city || practice.voivodeship ? (
          <p className="mt-1 font-body text-sm text-[color:var(--k-muted)]">
            {[practice.city, practice.voivodeship].filter(Boolean).join(", ")}
          </p>
        ) : null}
      </header>

      <div className="mt-8">
        <KalkulatorDashboard practice={practice} />
      </div>
    </div>
  );
}
