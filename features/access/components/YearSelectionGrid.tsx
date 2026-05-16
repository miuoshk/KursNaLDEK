import { Lock, FlaskConical, CreditCard } from "lucide-react";
import type { StudyOption } from "@/features/access/lib/studyAccess";
import { formatTrackLabel } from "@/features/access/lib/studyAccess";
import { cn } from "@/lib/utils";

type Props = {
  options: Array<
    StudyOption & {
      isSelected: boolean;
      isUnlocked: boolean;
    }
  >;
  activateFreeAction: (formData: FormData) => Promise<void>;
  checkoutAction: (formData: FormData) => Promise<void>;
};

export function YearSelectionGrid({ options, activateFreeAction, checkoutAction }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const title = `${formatTrackLabel(option.track)} · rok ${option.year}`;
        const ctaLabel = option.isFreeTest
          ? option.isUnlocked
            ? "Dostęp aktywny"
            : "Aktywuj i przejdź do pulpitu"
          : option.isUnlocked
            ? "Dostęp aktywny"
            : "Przejdź do płatności";

        return (
          <article
            key={`${option.track}-${option.year}`}
            className={cn(
              "rounded-card border bg-surface-card p-5",
              option.isSelected
                ? "border-brand-gold shadow-[0_0_0_1px_rgba(201,168,76,0.3)]"
                : "border-white/10",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl text-primary">{title}</h3>
                <p className="mt-2 font-body text-body-sm text-secondary">
                  {option.isFreeTest
                    ? "Rok testowy — darmowy dostęp."
                    : "Dostęp płatny jednorazowo."}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-medium",
                  option.isFreeTest
                    ? "bg-brand-sage/20 text-brand-sage"
                    : "bg-brand-gold/15 text-brand-gold",
                )}
              >
                {option.isFreeTest ? <FlaskConical className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {option.isFreeTest ? "Testowy" : "Płatny"}
              </span>
            </div>

            <form action={option.isFreeTest ? activateFreeAction : checkoutAction} className="mt-5">
              <input type="hidden" name="track" value={option.track} />
              <input type="hidden" name="year" value={String(option.year)} />
              <button
                type="submit"
                disabled={option.isUnlocked}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 py-2.5 font-body text-body-sm font-semibold transition duration-200 ease-out",
                  option.isUnlocked
                    ? "cursor-not-allowed bg-white/10 text-secondary"
                    : option.isFreeTest
                      ? "bg-brand-sage text-white hover:brightness-110"
                      : "bg-brand-gold text-brand-bg hover:brightness-110",
                )}
              >
                {!option.isFreeTest && !option.isUnlocked ? <CreditCard className="h-4 w-4" /> : null}
                {ctaLabel}
              </button>
            </form>
          </article>
        );
      })}
    </div>
  );
}
