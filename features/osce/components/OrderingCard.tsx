"use client";

import {
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { type CSSProperties, type Ref } from "react";
import { cn } from "@/lib/utils";

export type OrderingCardProps = {
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

export function OrderingCard({
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
