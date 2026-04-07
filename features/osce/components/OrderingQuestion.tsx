"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, GripVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { cn } from "@/lib/utils";

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

type TimerBarProps = {
  totalSeconds: number;
  remainingSeconds: number;
};

function TimerBar({ totalSeconds, remainingSeconds }: TimerBarProps) {
  const ratio = totalSeconds > 0 ? Math.max(0, remainingSeconds / totalSeconds) : 0;

  return (
    <div
      className="mb-6 w-full max-w-2xl"
      role="timer"
      aria-live="polite"
      aria-atomic
      aria-label={`Pozostały czas: ${remainingSeconds} sekund`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-body text-body-xs text-secondary">
          <Clock className="size-4 shrink-0 text-brand-gold" aria-hidden />
          Czas na ułożenie
        </span>
        <span className="font-mono text-body-sm tabular-nums text-brand-gold">
          {remainingSeconds}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-white/[0.08]">
        <motion.div
          className="h-full rounded-pill bg-brand-sage"
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function positionStatuses(
  userOrder: string[],
  correctOrder: string[],
): ("correct" | "wrong")[] {
  return userOrder.map((id, i) => (id === correctOrder[i] ? "correct" : "wrong"));
}

type OrderingCardProps = {
  index: number;
  text: string;
  status: "idle" | "correct" | "wrong";
  correctPlace1Based: number | null;
  dragHandleProps?: Record<string, unknown>;
  dragListeners?: DraggableSyntheticListeners;
  dragAttributes?: DraggableAttributes;
  dragRef?: Ref<HTMLDivElement>;
  dragStyle?: CSSProperties;
  isDragging?: boolean;
  mobile?: {
    onMoveUp: () => void;
    onMoveDown: () => void;
    canUp: boolean;
    canDown: boolean;
  };
  checked: boolean;
};

function OrderingCard({
  index,
  text,
  status,
  correctPlace1Based,
  dragHandleProps,
  dragListeners,
  dragAttributes,
  dragRef,
  dragStyle,
  isDragging,
  mobile,
  checked,
}: OrderingCardProps) {
  const surface =
    status === "correct"
      ? "border-success bg-success/10"
      : status === "wrong"
        ? "border-error bg-error/10"
        : "border-brand-sage/45 bg-brand-card-1 hover:border-brand-gold/55";

  return (
    <motion.div
      ref={dragRef}
      style={dragStyle}
      animate={
        checked && status === "wrong"
          ? { x: [0, -6, 6, -4, 4, -3, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "flex w-full max-w-2xl items-stretch gap-3 rounded-card border px-3 py-3 transition-colors duration-200 ease-out sm:px-4",
        surface,
        isDragging && "z-10 opacity-90 shadow-lg ring-2 ring-brand-gold/40",
        !checked && "hover:bg-brand-card-2/80",
      )}
      {...dragAttributes}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-btn border border-brand-gold/45 bg-brand-bg font-mono text-body-sm tabular-nums text-brand-gold",
          checked && status === "correct" && "border-success text-success",
          checked && status === "wrong" && "border-error text-error",
        )}
      >
        {index + 1}
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="text-left font-body text-body-md leading-snug text-primary">{text}</p>
        {checked && status === "wrong" && correctPlace1Based != null ? (
          <p className="mt-2 font-body text-body-xs text-error">
            Właściwe miejsce: pozycja {correctPlace1Based}
          </p>
        ) : null}
      </div>

      {!checked && dragListeners && dragHandleProps ? (
        <button
          type="button"
          className="hidden shrink-0 cursor-grab touch-none items-center justify-center rounded-btn border border-transparent p-2 text-brand-gold/80 transition-colors hover:border-brand-gold/40 hover:text-brand-gold active:cursor-grabbing sm:flex"
          aria-label="Przeciągnij, aby zmienić kolejność"
          {...dragHandleProps}
          {...dragListeners}
        >
          <GripVertical className="size-5" aria-hidden />
        </button>
      ) : null}

      {!checked && mobile ? (
        <div className="flex shrink-0 flex-col gap-1 sm:hidden">
          <button
            type="button"
            onClick={mobile.onMoveUp}
            disabled={!mobile.canUp}
            className={cn(
              "flex size-9 items-center justify-center rounded-btn border border-brand-sage/40 text-brand-gold transition-colors",
              mobile.canUp
                ? "hover:border-brand-gold hover:bg-brand-gold/10"
                : "cursor-not-allowed opacity-35",
            )}
            aria-label="Przesuń wyżej"
          >
            <ChevronUp className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={mobile.onMoveDown}
            disabled={!mobile.canDown}
            className={cn(
              "flex size-9 items-center justify-center rounded-btn border border-brand-sage/40 text-brand-gold transition-colors",
              mobile.canDown
                ? "hover:border-brand-gold hover:bg-brand-gold/10"
                : "cursor-not-allowed opacity-35",
            )}
            aria-label="Przesuń niżej"
          >
            <ChevronDown className="size-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}

type SortableRowProps = {
  id: string;
  index: number;
  text: string;
  checked: boolean;
  status: "idle" | "correct" | "wrong";
  correctPlace1Based: number | null;
};

function SortableOrderingRow({
  id,
  index,
  text,
  checked,
  status,
  correctPlace1Based,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: checked,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <OrderingCard
      index={index}
      text={text}
      status={status}
      correctPlace1Based={correctPlace1Based}
      dragRef={setNodeRef}
      dragStyle={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      dragHandleProps={{}}
      isDragging={isDragging}
      checked={checked}
    />
  );
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
  const [remaining, setRemaining] = useState(() => timerTotal ?? 0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- reset timera przy zmianie pytania */
  useEffect(() => {
    const t = question.timer_seconds != null && question.timer_seconds > 0 ? question.timer_seconds : null;
    setRemaining(t ?? 0);
  }, [question.id, question.timer_seconds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    clearTimer();
    if (checked || timerTotal == null) return;

    timerIntervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (!answeredOnceRef.current) {
            answeredOnceRef.current = true;
            setChecked(true);
            const current = orderRef.current;
            const isCorrect = question.correct_order.every((id, i) => current[i] === id);
            onAnswerRef.current(question.id, [...current], isCorrect);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [question.id, timerTotal, checked, clearTimer, question.correct_order]);

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
        <TimerBar totalSeconds={timerTotal} remainingSeconds={remaining} />
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
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Sprawdź
          </button>
        </div>
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
