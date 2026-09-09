"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionTopBar } from "@/features/session/components/SessionTopBar";
import {
  UFO_ACCEPTANCE_ANSWERS,
  UFO_ACCEPTANCE_QUESTIONS,
} from "@/features/session/fixtures/ufoAcceptance";
import type { SessionAnswer } from "@/features/session/types";

export function UfoAcceptanceSessionClient() {
  const t = useTranslations("session");
  const questions = UFO_ACCEPTANCE_QUESTIONS;
  const [index, setIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, SessionAnswer>>(
    () => ({ ...UFO_ACCEPTANCE_ANSWERS }),
  );
  const [summary, setSummary] = useState(false);
  const q = questions[index];
  const existing = q ? answeredMap[q.id] : undefined;

  const answers = useMemo(() => Object.values(answeredMap), [answeredMap]);
  const allAnswered = answers.length >= questions.length;

  const recordIfNeeded = useCallback(
    (questionId: string, optionId: string, isCorrect: boolean) => {
      setAnsweredMap((prev) => {
        if (prev[questionId]) return prev;
        return {
          ...prev,
          [questionId]: {
            questionId,
            selectedOptionId: optionId,
            isCorrect,
            confidence: null,
            timeSpentSeconds: 0,
          },
        };
      });
    },
    [],
  );

  if (summary) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="font-heading text-heading-md text-primary">
          {t("summaryTitle")}
        </p>
        <p className="max-w-md text-center font-body text-body-sm text-secondary">
          Przykładowe podsumowanie odbioru UFO. Nic nie zostało zapisane do bazy.
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-btn bg-brand-gold px-4 font-body text-body-sm font-semibold text-brand-bg"
          onClick={() => {
            setSummary(false);
            setIndex(questions.length - 1);
          }}
        >
          {t("previous")}
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <p className="sr-only">
        Przykład testowy odbioru UFO. To nie jest pytanie podręcznikowe.
      </p>
      <SessionTopBar
        subjectName="Chirurgia stomatologiczna i szczękowo-twarzowa"
        selectedTopicName={q.topicName}
        current={index}
        total={questions.length}
        mode="przeglad"
        examElapsedSeconds={90}
        questions={questions}
        answeredMap={answeredMap}
        onJumpTo={setIndex}
        onEnd={() => setSummary(true)}
      />
      <SessionQuestionContent
        sessionId="ufo-accept-layout"
        q={q}
        currentIndex={index}
        total={questions.length}
        selectedOptionId={existing?.selectedOptionId ?? null}
        isShowingFeedback={existing != null}
        isCurrentAnswered={existing != null}
        isWaitingForConfidence={false}
        allAnswered={index >= questions.length - 1 && allAnswered}
        isPrzeglad
        questions={questions}
        answeredMap={answeredMap}
        onJumpTo={setIndex}
        onSelectOption={(optionId) => {
          if (existing) return;
          recordIfNeeded(q.id, optionId, optionId === q.correctOptionId);
        }}
        onConfidencePick={() => undefined}
        onNext={() => {
          if (index >= questions.length - 1) {
            setSummary(true);
            return;
          }
          setIndex((value) => Math.min(questions.length - 1, value + 1));
        }}
        onPrevious={() => setIndex((value) => Math.max(0, value - 1))}
        showTopicName={false}
        subjectId="ufo-accept"
        feedbackVariant="standard"
      />
    </div>
  );
}
