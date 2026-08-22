"use client";

import { useTranslations } from "next-intl";
import { FEATURES } from "@/lib/featureFlags";
import { isSourceFilterLive } from "@/lib/products";
import type { SessionQuestion } from "@/features/session/types";
import { questionSourceBadgeModel } from "@/features/session/lib/questionSourceBadge";
import { cn } from "@/lib/utils";

type Props = {
  question: SessionQuestion;
  product?: string | null;
  className?: string;
};

export function QuestionSourceBadge({ question, product, className }: Props) {
  if (!(FEATURES.cemSource && isSourceFilterLive(product))) return null;
  return <QuestionSourceBadgeInner question={question} className={className} />;
}

function QuestionSourceBadgeInner({
  question,
  className,
}: {
  question: SessionQuestion;
  className?: string;
}) {
  const t = useTranslations("sourceFilter");
  const model = questionSourceBadgeModel(question);
  if (!model) return null;

  if (model.kind === "own") {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <Pill tone="mint">{t("badgeOwn")}</Pill>
      </div>
    );
  }

  if (model.kind === "uczelnia") {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <Pill tone="gold">{model.label}</Pill>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Pill tone="gold">{model.label}</Pill>
      {model.repeatCount > 1 ? (
        <Pill tone="gold">{t("badgeRepeat", { count: model.repeatCount })}</Pill>
      ) : null}
    </div>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "gold" | "mint";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-pill px-2.5 py-0.5",
        "font-body text-[11px] font-medium leading-tight",
        tone === "gold"
          ? "border border-brand-gold/35 bg-brand-gold/15 text-brand-gold"
          : "border border-brand-sage/35 bg-brand-sage/15 text-brand-sage",
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}
