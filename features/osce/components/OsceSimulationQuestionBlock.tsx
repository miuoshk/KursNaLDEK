"use client";

import { useTranslations } from "next-intl";
import type { ConversionDrillSummary } from "@/features/osce/components/ConversionDrillQuestion";
import { ConversionDrillQuestion } from "@/features/osce/components/ConversionDrillQuestion";
import { ImageIdentifyQuestion } from "@/features/osce/components/ImageIdentifyQuestion";
import type { ImageIdentifyAnswer } from "@/features/osce/components/ImageIdentifyQuestion";
import { OrderingQuestion } from "@/features/osce/components/OrderingQuestion";
import { QuestionCard } from "@/features/osce/components/QuestionCard";
import {
  resolveOsceQuestionKind,
  toOsceConversionItems,
  toOsceImageIdentify,
  toOsceOrdering,
  toOsceSingleChoice,
} from "@/features/osce/lib/topicQuestionMappers";
import type { TopicSessionQuestionRow } from "@/features/osce/types";

type Props = {
  row: TopicSessionQuestionRow;
  onRecordAnswer: (questionId: string, isCorrect: boolean) => void;
  onNext: () => void;
};

export function OsceSimulationQuestionBlock({ row, onRecordAnswer, onNext }: Props) {
  const t = useTranslations("osce");
  const kind = resolveOsceQuestionKind(row);

  if (kind === "ordering") {
    const o = toOsceOrdering(row);
    if (!o) {
      return (
        <p className="font-body text-body-md text-error">
          {t("errorOrdering")}
        </p>
      );
    }
    return (
      <OrderingQuestion
        question={o}
        onAnswer={(qid, _order, isCorrect) => {
          onRecordAnswer(qid, isCorrect);
        }}
        onNext={onNext}
      />
    );
  }

  if (kind === "image_identify") {
    const img = toOsceImageIdentify(row);
    if (!img) {
      return (
        <p className="font-body text-body-md text-error">
          {t("errorImage")}
        </p>
      );
    }
    return (
      <ImageIdentifyQuestion
        question={img}
        onAnswer={(qid, _answers, score) => {
          const isCorrect = Math.abs(score - 1) < 1e-9;
          onRecordAnswer(qid, isCorrect);
        }}
        onNext={onNext}
      />
    );
  }

  if (kind === "conversion_drill") {
    const drills = toOsceConversionItems(row);
    if (!drills) {
      return (
        <p className="font-body text-body-md text-error">
          {t("errorConversion")}
        </p>
      );
    }
    return (
      <ConversionDrillQuestion
        questions={drills}
        onDrillComplete={(summary: ConversionDrillSummary) => {
          const isCorrect = summary.total > 0 && summary.correct === summary.total;
          onRecordAnswer(row.id, isCorrect);
        }}
        onContinueAfterDrill={onNext}
        soundEnabled
      />
    );
  }

  const sc = toOsceSingleChoice(row);
  if (!sc) {
    return (
      <p className="font-body text-body-md text-error">
        {t("errorNoOptionsShort")}
      </p>
    );
  }
  return (
    <QuestionCard
      question={sc}
      onAnswer={(qid, _selected, isCorrect) => {
        onRecordAnswer(qid, isCorrect);
      }}
      onNext={onNext}
    />
  );
}
