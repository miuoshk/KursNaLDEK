"use client";

import { useEffect, useRef, type SyntheticEvent } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Lightbulb,
  Repeat2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import { contrastToMarkdown } from "@/features/shared/lib/explanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { cn } from "@/lib/utils";
import {
  buildFeedbackShownEvent,
  type FeedbackExpandSection,
  type PendingFeedbackEvent,
} from "@/features/session/lib/feedbackTelemetry";

type FeedbackPanelProps = {
  sessionId: string;
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
  hideExplanation?: boolean;
  variant: FeedbackVariant;
  transferScheduled?: boolean;
  confidence?: Confidence | null;
  onFeedbackShown?: (event: PendingFeedbackEvent) => void;
  onFeedbackExpand?: (
    questionId: string,
    section: FeedbackExpandSection,
  ) => void;
};

function trapAsBlockquote(trap: string): string {
  return trap
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function DistractorReasons({
  options,
  distractors,
  skipIds,
}: {
  options: SessionQuestion["options"];
  distractors: Record<string, string> | undefined;
  skipIds: ReadonlySet<string>;
}) {
  if (!distractors) return null;
  const items = options.filter(
    (option) => !skipIds.has(option.id) && Boolean(distractors[option.id]?.trim()),
  );
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-3">
      {items.map((option) => (
        <li key={option.id}>
          <p className="font-body text-body-sm text-secondary">
            <em>{option.text}</em>
          </p>
          <div className="mt-1">{markdownBlock(distractors[option.id]!)}</div>
        </li>
      ))}
    </ul>
  );
}

export function FeedbackPanel({
  sessionId,
  question,
  selectedOptionId,
  isCorrect,
  hideExplanation = false,
  variant,
  transferScheduled = false,
  confidence = null,
  onFeedbackShown,
  onFeedbackExpand,
}: FeedbackPanelProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const blocks = question.explanationBlocks ?? null;
  const hasBlocks = blocks != null;
  const takeaway = blocks?.takeaway?.trim() ?? "";
  const correctReason = blocks?.correctReason?.trim() ?? "";
  const trap = blocks?.trap?.trim() ?? "";
  const distractors = blocks?.distractors;
  const contrast = blocks?.contrast;
  const selectedDistractorReason =
    distractors?.[selectedOptionId]?.trim() || null;
  const hypercorrection = !isCorrect && confidence === "na_pewno";
  const whyOthersOpen =
    confidence === "troche" || confidence === "nie_wiedzialem";
  const skipCorrect = new Set([question.correctOptionId]);
  const skipCorrectAndSelected = new Set([
    question.correctOptionId,
    selectedOptionId,
  ]);
  const hasAnyDistractor = question.options.some(
    (option) =>
      option.id !== question.correctOptionId &&
      Boolean(distractors?.[option.id]?.trim()),
  );
  const hasRemainingDistractors = question.options.some(
    (option) =>
      option.id !== question.correctOptionId &&
      option.id !== selectedOptionId &&
      Boolean(distractors?.[option.id]?.trim()),
  );
  const orderCtx = {
    disableOptionShuffle: question.disableOptionShuffle,
    explanation: question.explanation,
  };
  const yourLetter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    selectedOptionId,
    orderCtx,
  );
  const correctLetter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    question.correctOptionId,
    orderCtx,
  );
  const answerLine = t("summaryYourAnswer", {
    selected: yourLetter,
    correct: correctLetter,
    topic: "",
  }).replace(/\s·\s*$/, "");

  const shownInput = {
    question,
    selectedOptionId,
    isCorrect,
    hideExplanation,
    variant,
    transferScheduled,
    confidence,
  };
  useEffect(() => {
    if (!onFeedbackShown) return;
    onFeedbackShown(buildFeedbackShownEvent(question.id, shownInput));
  }, [question.id, variant, onFeedbackShown]);

  const skipNextOpen = useRef(whyOthersOpen);
  const handleToggle = (section: FeedbackExpandSection) =>
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      if (skipNextOpen.current) {
        skipNextOpen.current = false;
        return;
      }
      if (event.currentTarget.open) {
        onFeedbackExpand?.(question.id, section);
      }
    };

  return (
    <div
      className="mx-auto mt-8 w-full max-w-3xl space-y-4"
      data-has-blocks={hasBlocks ? "true" : "false"}
    >
      <div
        className={cn(
          "flex items-center gap-2 font-body text-body-lg font-semibold",
          isCorrect ? "text-success" : "text-error",
        )}
      >
        {isCorrect ? (
          <CheckCircle className="size-6 shrink-0" aria-hidden />
        ) : (
          <XCircle className="size-6 shrink-0" aria-hidden />
        )}
        {isCorrect ? t("correctAnswer") : t("incorrectAnswer")}
      </div>
      <p className="font-body text-body-sm text-secondary">{answerLine}</p>
      {hypercorrection ? (
        <p className="font-body text-body-sm font-medium text-gold">
          {t("feedbackHypercorrection")}
        </p>
      ) : null}

      {!hideExplanation && !hasBlocks ? (
        <div className="rounded-card bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            {tCommon("explanation")}
          </h3>
          <div className="mt-3">{markdownBlock(question.explanation)}</div>
        </div>
      ) : null}

      {!hideExplanation && hasBlocks ? (
        <div className="space-y-4">
          {variant === "concise" && takeaway ? (
            <div className="rounded-card bg-card p-5">
              <div className="flex gap-3">
                <Lightbulb
                  className="mt-0.5 size-5 shrink-0 text-gold"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-heading-sm text-primary">
                    {t("feedbackPrinciple")}
                  </h3>
                  <div className="mt-3">{markdownBlock(takeaway)}</div>
                </div>
              </div>
            </div>
          ) : null}

          {(variant === "standard" || variant === "remedial") &&
          correctReason ? (
            <div className="rounded-card bg-card p-5">
              <h3 className="font-heading text-heading-sm text-primary">
                {tCommon("explanation")}
              </h3>
              <div className="mt-3">{markdownBlock(correctReason)}</div>
            </div>
          ) : null}

          {variant === "remedial" && selectedDistractorReason ? (
            <div className="rounded-xl border border-error/20 bg-error/5 p-4">
              <p className="font-body text-caption font-bold uppercase tracking-wide text-error">
                {t("feedbackWhySelected")}
              </p>
              <div className="mt-2">
                {markdownBlock(selectedDistractorReason)}
              </div>
            </div>
          ) : null}

          {variant === "concise" && (correctReason || hasAnyDistractor) ? (
            <details
              className="group rounded-card bg-card p-5"
              onToggle={handleToggle("full")}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 font-body text-body-sm font-semibold text-sage">
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                {t("feedbackFullExplanation")}
              </summary>
              {correctReason ? (
                <div className="mt-3">{markdownBlock(correctReason)}</div>
              ) : null}
              <DistractorReasons
                options={question.options}
                distractors={distractors}
                skipIds={skipCorrect}
              />
            </details>
          ) : null}

          {variant === "standard" && hasAnyDistractor ? (
            <details
              className="group rounded-card bg-card p-5"
              open={whyOthersOpen}
              onToggle={handleToggle("distractors")}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 font-body text-body-sm font-semibold text-sage">
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                {t("feedbackWhyOthers")}
              </summary>
              <DistractorReasons
                options={question.options}
                distractors={distractors}
                skipIds={skipCorrect}
              />
            </details>
          ) : null}

          {variant === "remedial" && hasRemainingDistractors ? (
            <details
              className="group rounded-card bg-card p-5"
              onToggle={handleToggle("distractors")}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 font-body text-body-sm font-semibold text-sage">
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
                {t("feedbackWhyOthers")}
              </summary>
              <DistractorReasons
                options={question.options}
                distractors={distractors}
                skipIds={skipCorrectAndSelected}
              />
            </details>
          ) : null}

          {contrast && contrast.length > 0 ? (
            <div className="rounded-card bg-card p-5">
              {markdownBlock(contrastToMarkdown(contrast))}
            </div>
          ) : null}

          {trap ? (
            <div className="rounded-card bg-card p-5">
              {markdownBlock(trapAsBlockquote(trap))}
            </div>
          ) : null}

          {variant === "remedial" && question.knowledgeCard ? (
            <div className="flex gap-3 rounded-xl border border-gold/25 bg-gold/5 p-4">
              <BookOpen
                className="mt-0.5 size-5 shrink-0 text-gold"
                aria-hidden
              />
              <div>
                <p className="font-body text-caption font-bold uppercase tracking-wide text-gold">
                  {t("feedbackRemediation")}
                </p>
                <div className="mt-2">
                  {markdownBlock(question.knowledgeCard)}
                </div>
              </div>
            </div>
          ) : null}

          {variant === "remedial" && transferScheduled ? (
            <p className="flex items-center gap-2 font-body text-body-sm font-medium text-sage">
              <Repeat2 className="size-4 shrink-0" aria-hidden />
              {t("feedbackTransferScheduled")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
