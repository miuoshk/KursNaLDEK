"use client";

import { OnboardingWizard } from "@/features/kalkulator/components/onboarding/OnboardingWizard";
import { KalkulatorShell } from "@/features/kalkulator/components/KalkulatorShell";
import { KalkulatorLogPanel } from "@/features/kalkulator/components/log/KalkulatorLogPanel";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";
import { useUserPractice } from "@/features/kalkulator/hooks/useUserPractice";

type Props = {
  mode?: "dashboard" | "log";
};

export function KalkulatorAppGate({ mode = "dashboard" }: Props) {
  const { user, signOut } = useKalkulatorAuth();
  const { practice, loading, reload } = useUserPractice();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="font-body text-sm text-[color:var(--k-muted)]">Ładowanie gabinetu…</p>
      </div>
    );
  }

  if (!practice) {
    return <OnboardingWizard onComplete={() => void reload()} />;
  }

  return (
    <>
      {mode === "dashboard" ? (
        <div className="border-b border-[color:var(--k-border)] bg-[color:var(--k-card-bg)]">
          <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-white px-3 py-1.5 font-body text-xs text-[color:var(--k-text)] transition hover:border-[color:var(--k-primary-light)]"
            >
              Wyloguj ({user?.email})
            </button>
          </div>
        </div>
      ) : null}

      {mode === "log" ? (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <KalkulatorLogPanel practice={practice} />
        </div>
      ) : (
        <KalkulatorShell practice={practice} />
      )}
    </>
  );
}
