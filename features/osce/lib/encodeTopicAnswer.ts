import type { ConversionDrillRoundResult } from "@/features/osce/components/ConversionDrillQuestion";
import type { ImageIdentifyAnswer } from "@/features/osce/components/ImageIdentifyQuestion";

type OsceAnswerPayload =
  | { v: 1; t: "ordering"; order: string[] }
  | { v: 1; t: "image_identify"; answers: ImageIdentifyAnswer[]; score: number }
  | {
      v: 1;
      t: "conversion_drill";
      rounds: ConversionDrillRoundResult[];
      correct: number;
      total: number;
    };

export function encodeTopicAnswerSelection(input: {
  questionType: string;
  singleChoiceId?: string | null;
  ordering?: string[];
  imageIdentify?: { answers: ImageIdentifyAnswer[]; score: number };
  conversionDrill?: {
    rounds: ConversionDrillRoundResult[];
    correct: number;
    total: number;
  };
}): string {
  if (input.questionType === "single_choice") {
    const id = input.singleChoiceId?.trim();
    if (id) return id;
    return "osce:single_choice:none";
  }
  let payload: OsceAnswerPayload;
  if (input.questionType === "ordering" && input.ordering) {
    payload = { v: 1, t: "ordering", order: input.ordering };
  } else if (input.questionType === "image_identify" && input.imageIdentify) {
    payload = {
      v: 1,
      t: "image_identify",
      answers: input.imageIdentify.answers,
      score: input.imageIdentify.score,
    };
  } else if (input.questionType === "conversion_drill" && input.conversionDrill) {
    payload = {
      v: 1,
      t: "conversion_drill",
      rounds: input.conversionDrill.rounds,
      correct: input.conversionDrill.correct,
      total: input.conversionDrill.total,
    };
  } else {
    return `osce:empty:${input.questionType}`;
  }
  return `osce:${JSON.stringify(payload)}`;
}
