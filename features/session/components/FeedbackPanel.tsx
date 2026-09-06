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
import { sessionOptionLetter } from "@/features/session/lib/sessionOptionOrder";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import { contrastToMarkdown } from "@/features/shared/lib/explanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { cn } from "@/lib/utils";
import {
  buildFeedbackShownEvent,
  type FeedbackExpandSection,
  type FeedbackShownEvent,
} from "@/features/session/lib/feedbackTelemetry";

export const SESSION_READING_COLUMN =
  "mx-auto w-full max-w-3xl md:max-w-[72ch]";

type FeedbackPanelProps = {
  sessionId: string;
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
  hideExplanation?: boolean;
  variant: FeedbackVariant;
  transferScheduled?: boolean;
  confidence?: Confidence | null;
  onFeedbackShown?: (event: FeedbackShownEvent) => void;
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
      {children}
    </p>
  );
}

function FeedbackSection({
  label,
  children,
  compact = false,
  takeaway = false,
  testId,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
  takeaway?: boolean;
  testId?: string;
}) {
  return (
    <section
      data-feedback-section={testId ?? label}
      className={cn(
        compact ? "px-5 py-3" : "px-5 py-5",
        takeaway && "border-l-2 border-brand-gold",
      )}
    >
      <SectionLabel>{label}</SectionLabel>
      <div className={cn("mt-2", takeaway && "font-body text-body-md")}>
        {children}
      </div>
    </section>
  );
}

function optionScreenLine(
  sessionId: string,
  question: SessionQuestion,
  option: SessionQuestion["options"][number],
): string {
  const letter = sessionOptionLetter(
    sessionId,
    question.id,
    question.options,
    option.id,
    {
      disableOptionShuffle: question.disableOptionShuffle,
      explanation: question.explanation,
    },
  );
  return `${letter} · ${option.text}`;
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
  if (!distractors) return null;
  const items = question.options.filter(
    (option) => !skipIds.has(option.id) && Boolean(distractors[option.id]?.trim()),
  );
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-3">
      {items.map((option) => (
        <li key={option.id}>
          <p className="font-body text-body-sm text-secondary">
            <em>{optionScreenLine(sessionId, question, option)}</em>
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
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);
  const selectedDistractorReason =
    distractors?.[selectedOptionId]?.trim() || null;
  const showYourChoice = !isCorrect && Boolean(selectedDistractorReason);
  const hypercorrection = !isCorrect && confidence === "na_pewno";
  const whyOthersOpen =
    confidence === "troche" || confidence === "nie_wiedzialem";
  const skipCorrect = new Set([question.correctOptionId]);
  const skipCorrectAndSelected = new Set([
    question.correctOptionId,
    selectedOptionId,
  ]);
  const remainingSkipIds = isCorrect ? skipCorrect : skipCorrectAndSelected;
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
  const showRemainingAccordion =
    variant === "concise"
      ? Boolean(correctReason || hasRemainingDistractors || hasAnyDistractor)
      : variant === "standard"
        ? isCorrect
          ? hasAnyDistractor
          : hasRemainingDistractors
        : hasRemainingDistractors;
  const showTakeawayHeader = variant === "concise" && Boolean(takeaway);
  const showTakeawayFooter = Boolean(takeaway) && !showTakeawayHeader;
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

  const yourChoiceBlock =
    showYourChoice && selectedOption ? (
      <FeedbackSection
        label={t("feedbackYourChoice")}
        testId="your-choice"
      >
        <p className="font-body text-body-sm text-secondary">
          <em>{optionScreenLine(sessionId, question, selectedOption)}</em>
        </p>
        <div className="mt-2">{markdownBlock(selectedDistractorReason!)}</div>
      </FeedbackSection>
    ) : null;

  const remainingAccordion =
    showRemainingAccordion && variant !== "concise" ? (
      <details
        className="group px-5 py-5"
        open={variant === "standard" ? whyOthersOpen : false}
        onToggle={handleToggle("distractors")}
        data-feedback-section="why-others"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <ChevronDown
            className="size-4 shrink-0 text-brand-gold transition-transform group-open:rotate-180"
            aria-hidden
          />
          <SectionLabel>{t("feedbackWhyOthers")}</SectionLabel>
        </summary>
        <DistractorReasons
          sessionId={sessionId}
          question={question}
          distractors={distractors}
          skipIds={remainingSkipIds}
        />
      </details>
    ) : null;

  const conciseAccordion =
    variant === "concise" && showRemainingAccordion ? (
      <details
        className="group px-5 py-5"
        onToggle={handleToggle("full")}
        data-feedback-section="full"
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
          sessionId={sessionId}
          question={question}
          distractors={distractors}
          skipIds={remainingSkipIds}
        />
      </details>
    ) : null;

  const hasCardSections =
    showTakeawayHeader ||
    ((variant === "standard" || variant === "remedial") && correctReason) ||
    showYourChoice ||
    remainingAccordion != null ||
    conciseAccordion != null ||
    Boolean(contrast && contrast.length > 0) ||
    Boolean(trap) ||
    (variant === "remedial" && Boolean(question.knowledgeCard)) ||
    (variant === "remedial" && transferScheduled) ||
    showTakeawayFooter;

  return (
    <div
      className={cn(SESSION_READING_COLUMN, "mt-8")}
      data-has-blocks={hasBlocks ? "true" : "false"}
    >
      <div
        data-session-verdict
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
      <p className="mt-2 font-body text-body-sm text-secondary">{answerLine}</p>
      {hypercorrection ? (
        <p className="mt-2 font-body text-body-sm font-medium text-gold">
          {t("feedbackHypercorrection")}
        </p>
      ) : null}

      {!hideExplanation && !hasBlocks ? (
        <div className="mt-4 rounded-card bg-card p-5">
          <h3 className="font-heading text-heading-sm text-primary">
            {tCommon("explanation")}
          </h3>
          <div className="mt-3">{markdownBlock(question.explanation)}</div>
        </div>
      ) : null}

      {!hideExplanation && hasBlocks && hasCardSections ? (
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-card bg-card">
          {showTakeawayHeader ? (
            <FeedbackSection
              label={t("feedbackPrinciple")}
              takeaway
              testId="takeaway-header"
            >
              {markdownBlock(takeaway)}
            </FeedbackSection>
          ) : null}

          {(variant === "standard" || variant === "remedial") &&
          correctReason ? (
            <FeedbackSection label={tCommon("explanation")} testId="explanation">
              {markdownBlock(correctReason)}
            </FeedbackSection>
          ) : null}

          {yourChoiceBlock}

          {conciseAccordion}
          {remainingAccordion}

          {contrast && contrast.length > 0 ? (
            <FeedbackSection label={t("feedbackContrast")} testId="contrast">
              {markdownBlock(contrastToMarkdown(contrast))}
            </FeedbackSection>
          ) : null}

          {trap ? (
            <FeedbackSection
              label={t("feedbackTrap")}
              compact
              testId="trap"
            >
              {markdownBlock(trapAsBlockquote(trap))}
            </FeedbackSection>
          ) : null}

          {variant === "remedial" && question.knowledgeCard ? (
            <section className="flex gap-3 px-5 py-5" data-feedback-section="remediation">
              <BookOpen
                className="mt-0.5 size-5 shrink-0 text-gold"
                aria-hidden
              />
              <div>
                <SectionLabel>{t("feedbackRemediation")}</SectionLabel>
                <div className="mt-2">
                  {markdownBlock(question.knowledgeCard)}
                </div>
              </div>
            </section>
          ) : null}

          {variant === "remedial" && transferScheduled ? (
            <p
              className="flex items-center gap-2 px-5 py-5 font-body text-body-sm font-medium text-sage"
              data-feedback-section="transfer"
            >
              <Repeat2 className="size-4 shrink-0" aria-hidden />
              {t("feedbackTransferScheduled")}
            </p>
          ) : null}

          {showTakeawayFooter ? (
            <FeedbackSection
              label={t("feedbackPrinciple")}
              takeaway
              testId="takeaway-footer"
            >
              {markdownBlock(takeaway)}
            </FeedbackSection>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
