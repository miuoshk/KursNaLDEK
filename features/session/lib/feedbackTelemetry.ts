import {
  questionHasNormalizedBlocks,
  type FeedbackVariant,
} from "@/features/session/lib/adaptiveFeedback";
import type { Confidence, SessionQuestion } from "@/features/session/types";

export type FeedbackExpandSection = "full" | "distractors";

export type FeedbackShownPayload = {
  variant: FeedbackVariant;
  hasBlocks: boolean;
  hypercorrection: boolean;
  elements: string[];
};

export type FeedbackShownEvent = {
  eventType: "feedback_shown";
  questionId: string;
  payload: FeedbackShownPayload;
};

export type PendingFeedbackEvent =
  | FeedbackShownEvent
  | {
      eventType: "feedback_expand";
      questionId: string;
      payload: { section: FeedbackExpandSection };
    };

export type DistractorRecommendation = "pisz" | "opcjonalnie" | "martwy dystraktor" | "klucz";

export function listFeedbackElements(input: {
  question: SessionQuestion;
  selectedOptionId: string;
  isCorrect: boolean;
  hideExplanation?: boolean;
  variant: FeedbackVariant;
  transferScheduled?: boolean;
  confidence?: Confidence | null;
}): string[] {
  const {
    question,
    selectedOptionId,
    isCorrect,
    hideExplanation = false,
    variant,
    transferScheduled = false,
    confidence = null,
  } = input;
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

  const elements: string[] = ["verdict"];
  if (hypercorrection) elements.push("hypercorrection");
  if (hideExplanation) return elements;
  if (!hasBlocks) {
    elements.push("legacy");
    return elements;
  }
  if (variant === "concise" && takeaway) elements.push("takeaway");
  if ((variant === "standard" || variant === "remedial") && correctReason) {
    elements.push("correctReason");
  }
  if (!isCorrect && selectedDistractorReason) {
    elements.push("selectedDistractor");
  }
  if (variant === "concise" && (correctReason || hasAnyDistractor)) {
    elements.push("full");
  }
  if (variant === "standard" && hasAnyDistractor) elements.push("distractors");
  if (variant === "remedial" && hasRemainingDistractors) {
    elements.push("distractors");
  }
  if (contrast && contrast.length > 0) elements.push("contrast");
  if (trap) elements.push("trap");
  if (variant === "remedial" && question.knowledgeCard) {
    elements.push("remediation");
  }
  if (variant === "remedial" && transferScheduled) elements.push("transfer");
  if ((variant === "standard" || variant === "remedial") && takeaway) {
    elements.push("takeaway");
  }
  return elements;
}

export function buildFeedbackShownEvent(
  questionId: string,
  input: Parameters<typeof listFeedbackElements>[0],
): FeedbackShownEvent {
  const hypercorrection =
    !input.isCorrect && input.confidence === "na_pewno";
  return {
    eventType: "feedback_shown",
    questionId,
    payload: {
      variant: input.variant,
      hasBlocks: questionHasNormalizedBlocks(input.question),
      hypercorrection,
      elements: listFeedbackElements(input),
    },
  };
}

export function classifyDistractorRecommendation(
  pctOfWrong: number | null,
  isCorrect: boolean,
): DistractorRecommendation {
  if (isCorrect) return "klucz";
  if (pctOfWrong == null || pctOfWrong < 3) return "martwy dystraktor";
  if (pctOfWrong < 15) return "opcjonalnie";
  return "pisz";
}

export function createFeedbackEventQueue() {
  const events: PendingFeedbackEvent[] = [];
  const shown = new Set<string>();

  return {
    recordShown(event: FeedbackShownEvent) {
      if (shown.has(event.questionId)) return;
      shown.add(event.questionId);
      events.push(event);
    },
    recordExpand(questionId: string, section: FeedbackExpandSection) {
      events.push({
        eventType: "feedback_expand",
        questionId,
        payload: { section },
      });
    },
    drain(): PendingFeedbackEvent[] {
      return events.splice(0, events.length);
    },
  };
}
