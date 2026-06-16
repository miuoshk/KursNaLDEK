"use client";

import { Lock, FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StudyOption } from "@/features/access/lib/studyAccess";
import { formatTrackLabel } from "@/features/access/lib/studyAccess";
import { CheckoutPaymentForm } from "@/features/checkout/components/CheckoutPaymentForm";
import { cn } from "@/lib/utils";

type Props = {
  options: Array<
    StudyOption & {
      isSelected: boolean;
      isUnlocked: boolean;
      isRegistrationClosed: boolean;
    }
  >;
  activateFreeAction: (formData: FormData) => Promise<void>;
  checkoutAction: (formData: FormData) => Promise<void>;
};

export function YearSelectionGrid({ options, activateFreeAction, checkoutAction }: Props) {
  const t = useTranslations("access");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const track = formatTrackLabel(option.track, t);
        const title = t("yearTitle", { track, year: option.year });
        const ctaLabel = option.isFreeTest
          ? option.isUnlocked
            ? t("goToDashboard")
            : t("activateAndGo")
          : option.isUnlocked
            ? t("goToDashboard")
            : t("goToPayment");

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
                  {option.isFreeTest ? t("freeTestDescription") : t("paidDescription")}
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
                {option.isFreeTest ? t("badgeTest") : t("badgePaid")}
              </span>
            </div>

            {option.isUnlocked ? (
              <a
                href="/pulpit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-white/10 px-4 py-2.5 font-body text-body-sm font-semibold text-primary transition duration-200 ease-out hover:bg-white/15"
              >
                {ctaLabel}
              </a>
            ) : option.isRegistrationClosed ? (
              <p className="mt-5 rounded-btn border border-white/15 bg-white/5 px-4 py-2.5 text-center font-body text-body-sm text-secondary">
                {t("registrationClosed")}
              </p>
            ) : option.isFreeTest ? (
              <form action={activateFreeAction} className="mt-5">
                <input type="hidden" name="track" value={option.track} />
                <input type="hidden" name="year" value={String(option.year)} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-sage px-4 py-2.5 font-body text-body-sm font-semibold text-white transition duration-200 ease-out hover:brightness-110"
                >
                  {ctaLabel}
                </button>
              </form>
            ) : (
              <CheckoutPaymentForm
                track={option.track}
                year={option.year}
                ctaLabel={ctaLabel}
                checkoutAction={checkoutAction}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
