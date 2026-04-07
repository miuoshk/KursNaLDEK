"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties } from "react";
import { OrderingCard } from "./OrderingCard";

export type SortableRowProps = {
  id: string;
  index: number;
  text: string;
  checked: boolean;
  status: "idle" | "correct" | "wrong";
  correctPlace1Based: number | null;
};

export function SortableOrderingRow({
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
