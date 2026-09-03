"use client";

import { useLocale, useTranslations } from "next-intl";
import { shouldShowSourceBankPills } from "@/features/shared/lib/sourceBankPills";
import { cn } from "@/lib/utils";

type SourceBankPillsProps = {
  product?: string | null;
  ownCount: number;
  cemCount?: number;
  className?: string;
  compact?: boolean;
};

export function SourceBankPills({
  product,
  ownCount,
  cemCount = 0,
  className,
  compact = false,
}: SourceBankPillsProps) {
  const t = useTranslations("sourceFilter");
  const locale = useLocale();
  if (!shouldShowSourceBankPills(product)) return null;

  const ownAvailable = ownCount > 0;
  const cemAvailable = cemCount > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-body text-body-xs uppercase tracking-normal text-muted">
        {t("label")}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("label")}>
        <BankPill
          compact={compact}
          selected={ownAvailable}
          available={ownAvailable}
          count={ownCount}
          locale={locale}
        >
          {t("own")}
        </BankPill>
        <BankPill
          compact={compact}
          selected={false}
          available={cemAvailable}
          count={cemAvailable ? cemCount : null}
          locale={locale}
        >
          {t("cem")}
        </BankPill>
      </div>
    </div>
  );
}

function BankPill({
  children,
  compact,
  selected,
  available,
  count,
  locale,
}: {
  children: React.ReactNode;
  compact: boolean;
  selected: boolean;
  available: boolean;
  count?: number | null;
  locale: string;
}) {
  return (
    <button
      type="button"
      disabled={!available}
      aria-pressed={available ? selected : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-pill border font-body tabular-nums",
        "transition-colors duration-200 ease-out",
        compact ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-body-xs",
        !available &&
          "cursor-not-allowed border-border/45 bg-white/[0.025] text-muted/65",
        available &&
          selected &&
          "cursor-default border-brand-sage bg-brand-sage font-semibold text-white",
        available &&
          !selected &&
          "cursor-default border-border bg-transparent text-secondary",
      )}
    >
      <span className="truncate">{children}</span>
      {count != null && available ? (
        <span
          className={cn(
            "tabular-nums",
            selected ? "font-medium text-white/80" : "text-muted",
          )}
        >
          {count.toLocaleString(locale)}
        </span>
      ) : null}
    </button>
  );
}
