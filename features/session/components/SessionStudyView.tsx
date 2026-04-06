"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { completeSession } from "@/features/session/api/completeSession";
import { submitAnswer } from "@/features/session/api/submitAnswer";
import { SessionEndDialog } from "@/features/session/components/SessionEndDialog";
import { SessionQuestionContent } from "@/features/session/components/SessionQuestionContent";
import { SessionSaveToast } from "@/features/session/components/SessionSaveToast";
import { SessionTopBar } from "@/features/session/components/SessionTopBar";
import { useSession } from "@/features/session/hooks/useSession";
import { useTimer } from "@/features/session/hooks/useTimer";
import type { Confidence, SessionMode, SessionQuestion } from "@/features/session/types";

type SessionStudyViewProps = {
  sessionId: string;
  subjectName: string;
  mode: SessionMode;
  questions: SessionQuestion[];
};

async function submitWithRetry(
  payload: Parameters<typeof submitAnswer>[0],
  retries = 3,
) {
  let last: Awaited<ReturnType<typeof submitAnswer>> | null = null;
  for (let i = 0; i < retries; i++) {
    last = await submitAnswer(payload);
    if (last.ok) return last;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return last ?? { ok: false as const, message: "Nie udało się zapisać odpowiedzi." };
}

export function SessionStudyView({
  sessionId,
  subjectName,
  mode,
  questions,
}: SessionStudyViewProps) {
  const router = useRouter();
  const sessionStart = useRef(Date.now());
  const timeSpentQuestion = useRef(0);
  const questionStartedAtRef = useRef(Date.now());
  const qTimer = useTimer();
  const [examSec, setExamSec] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const s = useSession(questions, sessionId, mode);

  useEffect(() => {
    if (mode !== "egzamin") return;
    const t = setInterval(() => setExamSec((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [mode]);

  useEffect(() => {
    if (!s.currentQuestion) return;
    questionStartedAtRef.current = Date.now();
    qTimer.reset();
    qTimer.start();
  }, [s.currentIndex, s.currentQuestion?.id, qTimer]);

  useEffect(() => {
    if (s.isShowingFeedback) qTimer.pause();
  }, [s.isShowingFeedback, qTimer]);

  const dismissToast = useCallback(() => setSaveToast(null), []);

  const handleCheck = useCallback(() => {
    if (!s.selectedOptionId) return;
    timeSpentQuestion.current = Math.max(
      0,
      Math.floor((Date.now() - questionStartedAtRef.current) / 1000),
    );
    qTimer.pause();
    s.checkAnswer();
  }, [s, qTimer]);

  const handleEndConfirm = useCallback(async () => {
    setEndOpen(false);
    const dur = Math.floor((Date.now() - sessionStart.current) / 1000);
    const comp = await completeSession({
      sessionId,
      durationSecondsFallback: dur,
    });
    if (!comp.ok) {
      setSaveToast(comp.message);
      return;
    }
    router.push(`/sesja/${sessionId}/podsumowanie`);
  }, [sessionId, router]);

  const handleNext = useCallback(async () => {
    if (!s.currentQuestion || s.confidence === null || !s.selectedOptionId) return;
    const isCorrect = s.selectedOptionId === s.currentQuestion.correctOptionId;
    const isLast = s.currentIndex >= questions.length - 1;
    const payload = {
      sessionId,
      questionId: s.currentQuestion.id,
      selectedOptionId: s.selectedOptionId,
      isCorrect,
      confidence: s.confidence as Confidence,
      timeSpentSeconds: timeSpentQuestion.current,
      questionOrder: s.currentIndex,
    };

    if (!isLast) {
      s.completeCurrentAndGoNext({
        questionId: s.currentQuestion.id,
        selectedOptionId: s.selectedOptionId,
        isCorrect,
        confidence: s.confidence,
        timeSpentSeconds: timeSpentQuestion.current,
      });
      void submitWithRetry(payload).then((res) => {
        if (!res.ok) {
          setSaveToast(
            "Nie udało się zapisać odpowiedzi. Spróbuj ponownie.",
          );
        }
      });
      return;
    }

    const res = await submitWithRetry(payload);
    if (!res.ok) {
      setSaveToast("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
      return;
    }
    const dur = Math.floor((Date.now() - sessionStart.current) / 1000);
    const comp = await completeSession({
      sessionId,
      durationSecondsFallback: dur,
    });
    if (!comp.ok) {
      setSaveToast(comp.message);
      return;
    }
    router.push(`/sesja/${sessionId}/podsumowanie`);
  }, [s, questions.length, sessionId, router]);

  if (!s.currentQuestion) return null;

  const q = s.currentQuestion;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SessionSaveToast message={saveToast} onDismiss={dismissToast} />
      <SessionEndDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        answeredCount={s.answers.length}
        totalQuestions={questions.length}
        onConfirm={handleEndConfirm}
      />
      <SessionTopBar
        subjectName={subjectName}
        current={s.currentIndex}
        total={s.total}
        mode={mode}
        examElapsedSeconds={mode === "egzamin" ? examSec : null}
        onEnd={() => setEndOpen(true)}
      />
      <SessionQuestionContent
        q={q}
        currentIndex={s.currentIndex}
        total={s.total}
        selectedOptionId={s.selectedOptionId}
        isShowingFeedback={s.isShowingFeedback}
        confidence={s.confidence}
        onSelectOption={s.selectOption}
        onConfidence={s.setConfidence}
        onCheck={handleCheck}
        onNext={handleNext}
      />
    </div>
  );
}
