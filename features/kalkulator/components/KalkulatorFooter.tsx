import { KALKULATOR_FOOTER_TEXT } from "@/features/kalkulator/constants/branding";

export function KalkulatorFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--k-border)] bg-[color:var(--k-card-bg)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-center font-body text-xs text-[color:var(--k-muted)] sm:text-sm">
          {KALKULATOR_FOOTER_TEXT}
        </p>
      </div>
    </footer>
  );
}
