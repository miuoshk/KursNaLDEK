"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useTranslations } from "next-intl";
import { FEATURES } from "@/lib/featureFlags";
import { REFERENCE_LABEL, isSourceFilterLive } from "@/lib/products";
import type { SourceFilter } from "@/features/session/types";
import type { SourceFilterCounts } from "@/features/session/lib/sourceFilter";
import { cn } from "@/lib/utils";

type SourceFilterBarProps = {
  product: string;
  value: SourceFilter;
  onChange: (next: SourceFilter) => void;
  counts: SourceFilterCounts;
  caption?: string;
  className?: string;
};

export function SourceFilterBar({
  product,
  value,
  onChange,
  counts,
  caption,
  className,
}: SourceFilterBarProps) {
  const t = useTranslations("sourceFilter");
  if (!(FEATURES.cemSource && isSourceFilterLive(product))) return null;
  const referenceLabel = REFERENCE_LABEL[product] ?? t("referenceFallback");

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="font-body text-body-xs uppercase tracking-normal text-muted">
        {t("label")}
      </p>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next === "all" || next === "reference" || next === "own") {
            onChange(next);
          }
        }}
        className="flex w-full flex-wrap gap-1 rounded-btn border border-border bg-card p-1"
        aria-label={t("label")}
      >
        <Segment value="all" count={counts.all}>
          {t("all")}
        </Segment>
        <Segment value="reference" count={counts.reference}>
          {referenceLabel}
        </Segment>
        <Segment value="own" count={counts.own}>
          {t("own")}
        </Segment>
      </ToggleGroup.Root>
      {caption ? (
        <p className="font-body text-body-xs text-muted">{caption}</p>
      ) : null}
    </div>
  );
}

function Segment({
  value,
  count,
  children,
}: {
  value: SourceFilter;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroup.Item
      value={value}
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2.5 py-1.5",
        "font-body text-body-xs font-medium tabular-nums transition-colors duration-200 ease-out",
        "text-secondary hover:text-primary",
        "data-[state=on]:bg-brand-sage data-[state=on]:text-white",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
      )}
    >
      <span className="truncate">{children}</span>
      <span className="tabular-nums opacity-80">{count}</span>
    </ToggleGroup.Item>
  );
}
