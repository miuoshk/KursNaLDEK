"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { QuestionFooterActions } from "@/features/shared/components/QuestionFooterActions";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { useCountdownTimer } from "@/features/osce/hooks/useCountdownTimer";
import { OrderingCard } from "@/features/osce/components/OrderingCard";
import { OrderingTimerBar } from "@/features/osce/components/OrderingTimerBar";
import { SortableOrderingRow } from "@/features/osce/components/SortableOrderingRow";

export type OrderingQuestionOption = { id: string; text: string };

export type OrderingQuestionData = {
  id: string;
  text: string;
  options: OrderingQuestionOption[];
  correct_order: string[];
  explanation: string;
  timer_seconds?: number | null;
};

export type OrderingQuestionProps = {
  question: OrderingQuestionData;
  onAnswer: (questionId: string, userOrder: string[], isCorrect: boolean) => void;
  /** Po sprawdzeniu odpowiedzi — np. przejście do następnego pytania w sesji. */
  onNext?: () => void;
};

function shuffleIds(ids: string[], correctOrder: string[]): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length > 1 && a.every((id, idx) => id === correctOrder[idx])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

function positionStatuses(
  userOrder: string[],
  correctOrder: string[],
): ("correct" | "wrong")[] {
  return userOrder.map((id, i) => (id === correctOrder[i] ? "correct" : "wrong"));
}

export function OrderingQuestion({ question, onAnswer, onNext }: OrderingQuestionProps) {
  const dndDomId = useId();
  const onAnswerRef = useRef(onAnswer);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  const isMobile = useMobileViewport();

  const optionsById = useMemo(
    () => new Map(question.options.map((o) => [o.id, o])),
    [question.options],
  );

  const initialOrder = useMemo(
    () => shuffleIds(question.options.map((o) => o.id), question.correct_order),
    [question.options, question.correct_order],
  );

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [checked, setChecked] = useState(false);
  const answeredOnceRef = useRef(false);
  const orderRef = useRef(order);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // Reset kolejności przy nowym pytaniu (props z serwera / nawigacja).
  /* eslint-disable react-hooks/set-state-in-effect -- synchronizacja lokalnego stanu z question.id */
  useEffect(() => {
    const next = shuffleIds(question.options.map((o) => o.id), question.correct_order);
    setOrder(next);
    orderRef.current = next;
    setChecked(false);
    answeredOnceRef.current = false;
  }, [question.id, question.options, question.correct_order]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const timerTotal =
    question.timer_seconds != null && question.timer_seconds > 0
      ? question.timer_seconds
      : null;

  const { remaining, clearTimer } = useCountdownTimer({
    totalSeconds: timerTotal,
    questionId: question.id,
    enabled: !checked,
    onTimeout: () => {
      if (!answeredOnceRef.current) {
        answeredOnceRef.current = true;
        setChecked(true);
        const current = orderRef.current;
        const isCorrect = question.correct_order.every((id, i) => current[i] === id);
        onAnswerRef.current(question.id, [...current], isCorrect);
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const moveAt = useCallback((index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.length) return prev;
      return arrayMove(prev, index, next);
    });
  }, []);

  const handleCheck = useCallback(() => {
    if (checked || answeredOnceRef.current) return;
    answeredOnceRef.current = true;
    clearTimer();
    setChecked(true);
    const current = orderRef.current;
    const isCorrect = question.correct_order.every((id, i) => current[i] === id);
    onAnswer(question.id, [...current], isCorrect);
  }, [checked, clearTimer, onAnswer, question.correct_order, question.id]);

  const statuses = checked
    ? positionStatuses(order, question.correct_order)
    : order.map(() => "idle" as const);

  const correctPlace = (optionId: string) => question.correct_order.indexOf(optionId) + 1;

  const list = (
    <ul className="flex w-full max-w-2xl flex-col items-center gap-3" aria-label="Kolejność elementów">
      {order.map((id, index) => {
        const opt = optionsById.get(id);
        if (!opt) return null;
        const st = statuses[index];
        const wrongPlace =
          checked && st === "wrong" ? correctPlace(id) : null;

        if (isMobile) {
          return (
            <li key={id} className="w-full max-w-2xl list-none">
              <OrderingCard
                index={index}
                text={opt.text}
                status={st}
                correctPlace1Based={wrongPlace}
                checked={checked}
                mobile={{
                  onMoveUp: () => moveAt(index, -1),
                  onMoveDown: () => moveAt(index, 1),
                  canUp: index > 0,
                  canDown: index < order.length - 1,
                }}
              />
            </li>
          );
        }

        return (
          <li key={id} className="w-full max-w-2xl list-none">
            <SortableOrderingRow
              id={id}
              index={index}
              text={opt.text}
              checked={checked}
              status={st}
              correctPlace1Based={wrongPlace}
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto w-full max-w-2xl bg-brand-bg">
      {timerTotal != null ? (
        <OrderingTimerBar totalSeconds={timerTotal} remainingSeconds={remaining} />
      ) : null}

      <p className="font-body text-body-lg leading-relaxed text-primary">{question.text}</p>

      <div className="mt-6">
        {isMobile ? (
          list
        ) : (
          <DndContext
            id={`ordering-dnd-${dndDomId}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              {list}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {!checked ? (
        <>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleCheck}
              className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
            >
              Sprawdź
            </button>
          </div>
          <QuestionFooterActions questionId={question.id} questionText={question.text} />
        </>
      ) : null}

      <AnimatePresence>
        {checked ? (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-8 rounded-card border border-white/[0.08] bg-brand-card-1 p-5"
          >
            <p className="font-heading text-heading-sm text-brand-gold">Wyjaśnienie</p>
            <p className="mt-3 whitespace-pre-wrap font-body text-body-sm leading-relaxed text-secondary">
              {question.explanation}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {checked ? (
        <QuestionFooterActions questionId={question.id} questionText={question.text} />
      ) : null}

      {checked && onNext ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onNext}
            className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Następne pytanie
          </button>
        </div>
      ) : null}
    </div>
  );
}
