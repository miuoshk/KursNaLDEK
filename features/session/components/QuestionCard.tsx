"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { SessionQuestion } from "@/features/session/types";
import { QuestionTextContent } from "@/features/shared/components/QuestionTextContent";
import { QuestionSourceBadge } from "@/features/shared/components/QuestionSourceBadge";
import { FEATURES } from "@/lib/featureFlags";
import { isSourceFilterLive } from "@/lib/products";

type QuestionCardProps = {
  question: SessionQuestion;
  children: ReactNode;
  /** Nazwa działu nad pytaniem (Ustawienia → Tematy w sesji). */
  showTopicName?: boolean;
  product?: string | null;
};

export function QuestionCard({
  question,
  children,
  showTopicName = true,
  product,
}: QuestionCardProps) {
  const t = useTranslations("session");
  const topicDefault = t("topicDefault");
  const topicLabel =
    showTopicName && question.topicName && question.topicName !== topicDefault
      ? question.topicName
      : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      {topicLabel ? (
        <p className="mb-1 hidden font-body text-body-xs text-muted sm:block">
          {topicLabel}
        </p>
      ) : null}
      {FEATURES.cemSource && isSourceFilterLive(product) ? (
        <QuestionSourceBadge
          question={question}
          product={product}
          className="mb-2 mt-1"
        />
      ) : null}
      {question.imageUrl ? (
        <div className="relative mt-6 h-64 w-full overflow-hidden rounded-card border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne URL (Supabase Storage) */}
          <img
            src={question.imageUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
      <QuestionTextContent
        text={question.text}
        className="mt-6 text-body-md md:text-body-lg"
      />
      <div className="mt-6 flex flex-col gap-3 overflow-visible py-1">{children}</div>
    </div>
  );
}
