"use client";

import { useEffect, useRef, type ReactNode, type SyntheticEvent } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Repeat2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import { useSessionOptionOrder } from "@/features/session/hooks/useSessionOptionOrder";
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import {
  contrastToMarkdown,
  isStatementSetBlocks,
} from "@/features/shared/lib/explanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { StatementSetFeedback } from "@/features/session/components/StatementSetFeedback";
import { RichTextContent } from "@/features/shared/components/RichTextContent";
import { cn } from "@/lib/utils";
import {
  buildFeedbackShownEvent,
  type FeedbackExpandSection,
  type FeedbackShownEvent,
} from "@/features/session/lib/feedbackTelemetry";

export const SESSION_READING_COLUMN =
  "mx-auto w-full max-w-3xl md:max-w-[72ch]";

const UFO_PROSE =
  "text-[16px] leading-[1.6] text-primary md:text-[17px] [&_p]:my-0 [&_p]:text-[16px] [&_p]:leading-[1.6] [&_p]:text-primary md:[&_p]:text-[17px] [&_p+_p]:mt-2";

type FeedbackPanelProps = {
  sessionId: string;
  question: SessionQuestion;
  selectedOptionId: string | null;
  isCorrect: boolean;
  hideExplanation?: boolean;
  showResult?: boolean;
  variant: FeedbackVariant;
  transferScheduled?: boolean;
  confidence?: Confidence | null;
  onFeedbackShown?: (event: FeedbackShownEvent) => void;
  onFeedbackExpand?: (
    questionId: string,
    section: FeedbackExpandSection,
  ) => void;
};

function SectionLabel({
  children,
  tone = "secondary",
}: {
  children: ReactNode;
  tone?: "secondary" | "gold";
}) {
  return (
    <p
      className={cn(
        "font-body text-[13px] font-semibold md:text-[14px]",
        tone === "gold" ? "text-brand-gold" : "text-secondary",
      )}
    >
      {children}
    </p>
  );
}

function FeedbackSection({
  label,
  children,
  testId,
  labelTone = "secondary",
}: {
  label: string;
  children: ReactNode;
  testId?: string;
  labelTone?: "secondary" | "gold";
}) {
  return (
    <section
      data-feedback-section={testId ?? label}
      className="px-4 py-3 sm:px-5"
    >
      <SectionLabel tone={labelTone}>{label}</SectionLabel>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function OptionLetterPill({
  letter,
  tone = "neutral",
}: {
  letter: string;
  tone?: "neutral" | "wrong";
}) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border font-body text-[10px] font-semibold",
        tone === "wrong"
          ? "border-error bg-error text-brand-bg"
          : "border-border bg-background text-secondary",
      )}
    >
      {letter}
    </span>
  );
}

function OptionReasonBlock({
  letter,
  optionText,
  reason,
  tone = "neutral",
}: {
  letter: string;
  optionText: string;
  reason?: string | null;
  tone?: "neutral" | "wrong";
}) {
  return (
    <div>
      <p className="flex items-start gap-2 font-body text-[16px] leading-[1.6] text-primary md:text-[17px]">
        <OptionLetterPill letter={letter} tone={tone} />
        <span className="min-w-0 flex-1">
          <RichTextContent text={optionText} className="text-primary" />
        </span>
      </p>
      {reason ? (
        <div className="mt-1">{markdownBlock(reason, UFO_PROSE)}</div>
      ) : null}
    </div>
  );
}

function DistractorReasons({
  sessionId,
  question,
  distractors,
  skipIds,
}: {
  sessionId: string;
  question: SessionQuestion;
  distractors: Record<string, string> | undefined;
  skipIds: ReadonlySet<string>;
}) {
  const displayOptions = useSessionOptionOrder(
    sessionId,
    question.id,
    question.options,
    {
      disableOptionShuffle: question.disableOptionShuffle,
      explanation: question.explanation,
    },
  );
  if (!distractors) return null;
  const items = displayOptions.flatMap((option, index) => {
    if (skipIds.has(option.id)) return [];
    const reason = distractors[option.id]?.trim();
    if (!reason) return [];
    return [
      {
        option,
        letter: String.fromCharCode(65 + index),
        reason,
      },
    ];
  });
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-3">
      {items.map((item) => (
        <li key={item.option.id}>
          <OptionReasonBlock
            letter={item.letter}
            optionText={item.option.text}
            reason={item.reason}
          />
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
  showResult = true,
  variant,
  transferScheduled = false,
  confidence = null,
  onFeedbackShown,
  onFeedbackExpand,
}: FeedbackPanelProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const verdictRef = useRef<HTMLDivElement>(null);
  const blocks = question.explanationBlocks ?? null;
  const blocksStatus =
    question.explanationBlocksStatus ??
    (blocks
      ? isStatementSetBlocks(blocks)
        ? "statement_set"
        : "sba"
      : "legacy");
  const blocksInvalid = blocksStatus === "invalid";
  const hasBlocks = blocks != null && !blocksInvalid;
  const statementSet = isStatementSetBlocks(blocks) ? blocks : null;
  const takeaway = blocks?.takeaway?.trim() ?? "";
  const correctReason = blocks?.correctReason?.trim() ?? "";
  const trap = blocks?.trap?.trim() ?? "";
  const distractors = statementSet ? undefined : blocks?.distractors;
  const contrast = blocks?.contrast;
  const selectedOption = selectedOptionId
    ? question.options.find((option) => option.id === selectedOptionId)
    : undefined;
  const correctOption = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  const selectedDistractorReason = selectedOptionId
    ? distractors?.[selectedOptionId]?.trim() || null
    : null;
  const showYourChoice = !isCorrect && selectedOption != null;
  const hypercorrection = !isCorrect && confidence === "na_pewno";
  const skipCorrect = new Set([question.correctOptionId]);
  const skipCorrectAndSelected = new Set(
    selectedOptionId
      ? [question.correctOptionId, selectedOptionId]
      : [question.correctOptionId],
  );
  const remainingSkipIds = isCorrect ? skipCorrect : skipCorrectAndSelected;
  const hasRemainingDistractors = question.options.some(
    (option) =>
      option.id !== question.correctOptionId &&
      option.id !== selectedOptionId &&
      Boolean(distractors?.[option.id]?.trim()),
  );
  const showTakeawayHeader = Boolean(takeaway);
  const orderCtx = {
    disableOptionShuffle: question.disableOptionShuffle,
    explanation: question.explanation,
  };
  const yourLetter = selectedOptionId
    ? sessionOptionLetter(
        sessionId,
        question.id,
        question.options,
        selectedOptionId,
        orderCtx,
      )
    : "";
  const correctLetter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    question.correctOptionId,
    orderCtx,
  );

  const shownInput = {
    question,
    selectedOptionId: selectedOptionId ?? question.correctOptionId,
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

  useEffect(() => {
    verdictRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  const skipNextOpen = useRef(false);
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

  const yourChoiceBlock =
    showYourChoice && selectedOption ? (
      <FeedbackSection
        label={t("feedbackYourChoice")}
        testId="your-choice"
      >
        <OptionReasonBlock
          letter={yourLetter}
          optionText={selectedOption.text}
          reason={selectedDistractorReason}
          tone="wrong"
        />
      </FeedbackSection>
    ) : null;

  const remainingAccordion = hasRemainingDistractors ? (
    <details
      className="group px-4 py-3 sm:px-5"
      onToggle={handleToggle("distractors")}
      data-feedback-section="why-others"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-btn marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="size-4 shrink-0 text-secondary motion-reduce:transition-none transition-transform group-open:rotate-180"
          aria-hidden
        />
        <SectionLabel>{t("feedbackRemaining")}</SectionLabel>
      </summary>
      <DistractorReasons
        sessionId={sessionId}
        question={question}
        distractors={distractors}
        skipIds={remainingSkipIds}
      />
    </details>
  ) : null;

  const mechanismBlock = correctReason ? (
    <FeedbackSection label={tCommon("explanation")} testId="explanation">
      {markdownBlock(correctReason, UFO_PROSE)}
    </FeedbackSection>
  ) : null;

  const hasCardSections =
    showTakeawayHeader ||
    mechanismBlock != null ||
    showYourChoice ||
    remainingAccordion != null ||
    Boolean(contrast && contrast.length > 0) ||
    Boolean(trap) ||
    (variant === "remedial" && Boolean(question.knowledgeCard)) ||
    (variant === "remedial" && transferScheduled);

  return (
    <div
      className={cn(SESSION_READING_COLUMN, "mt-5")}
      data-has-blocks={hasBlocks ? "true" : "false"}
    >
      <div ref={verdictRef} tabIndex={-1} data-session-verdict className="outline-none">
        {showResult ? (
          <div
            aria-live="polite"
            className={cn(
              "flex items-center gap-2 font-body text-[16px] font-semibold leading-[1.6] md:text-[17px]",
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
        ) : null}
        {!statementSet && correctOption ? (
          <div
            data-feedback-section="correct-answer"
            className={showResult ? "mt-3" : undefined}
          >
            <SectionLabel>{t("feedbackCorrectOption")}</SectionLabel>
            <p className="mt-1.5 flex items-start gap-2 font-body text-[16px] leading-[1.6] text-primary md:text-[17px]">
              <OptionLetterPill letter={correctLetter} />
              <span className="min-w-0 flex-1">
                <RichTextContent
                  text={correctOption.text}
                  className="text-primary"
                />
              </span>
            </p>
          </div>
        ) : null}
        {hypercorrection ? (
          <p className="mt-2 font-body text-body-sm font-medium text-secondary">
            {t("feedbackHypercorrection")}
          </p>
        ) : null}
      </div>

      {!hideExplanation && blocksInvalid ? (
        <div className="mt-4 rounded-card bg-card p-4">
          <p className="font-body text-[16px] leading-[1.6] text-primary md:text-[17px]">
            {t("feedbackUnavailable")}
          </p>
        </div>
      ) : null}

      {!hideExplanation &&
      !hasBlocks &&
      !blocksInvalid &&
      question.explanation.trim() ? (
        <div className="mt-4 rounded-card bg-card p-4">
          <h3 className="font-heading text-heading-sm text-primary">
            {tCommon("explanation")}
          </h3>
          <div className="mt-3">{markdownBlock(question.explanation, UFO_PROSE)}</div>
        </div>
      ) : null}

      {!hideExplanation && statementSet ? (
        <StatementSetFeedback
          blocks={statementSet}
          selectedOptionId={selectedOptionId}
          isCorrect={isCorrect}
        />
      ) : null}

      {!hideExplanation && hasBlocks && !statementSet && hasCardSections ? (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-card bg-card">
          {showTakeawayHeader ? (
            <FeedbackSection
              label={t("feedbackPrinciple")}
              testId="takeaway-header"
              labelTone="gold"
            >
              {markdownBlock(takeaway, UFO_PROSE)}
            </FeedbackSection>
          ) : null}

          {yourChoiceBlock}

          {mechanismBlock}

          {remainingAccordion}

          {contrast && contrast.length > 0 ? (
            <FeedbackSection label={t("feedbackContrast")} testId="contrast">
              {markdownBlock(contrastToMarkdown(contrast), UFO_PROSE)}
            </FeedbackSection>
          ) : null}

          {trap ? (
            <section className="px-4 py-3 sm:px-5" data-feedback-section="trap">
              <div className="border-l-2 border-brand-gold py-0 pl-3">
                <SectionLabel>{t("feedbackConfusion")}</SectionLabel>
                <div className="mt-2">{markdownBlock(trap, UFO_PROSE)}</div>
              </div>
            </section>
          ) : null}

          {variant === "remedial" && question.knowledgeCard ? (
            <section className="flex gap-3 px-4 py-3 sm:px-5" data-feedback-section="remediation">
              <BookOpen
                className="mt-0.5 size-5 shrink-0 text-secondary"
                aria-hidden
              />
              <div>
                <SectionLabel>{t("feedbackRemediation")}</SectionLabel>
                <div className="mt-2">
                  {markdownBlock(question.knowledgeCard, UFO_PROSE)}
                </div>
              </div>
            </section>
          ) : null}

          {variant === "remedial" && transferScheduled ? (
            <p
              className="flex items-center gap-2 px-4 py-3 font-body text-body-sm font-medium text-brand-sage sm:px-5"
              data-feedback-section="transfer"
            >
              <Repeat2 className="size-4 shrink-0" aria-hidden />
              {t("feedbackTransferScheduled")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
