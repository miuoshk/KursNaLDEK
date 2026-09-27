import { cn } from "@/lib/utils";

export function sessionProgressSquareClass(input: {
  isCurrent: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  clickable?: boolean;
}): string {
  const { isCurrent, isCorrect, isWrong, clickable = false } = input;
  const answered = isCorrect || isWrong;
  return cn(
    "inline-flex size-7 shrink-0 items-center justify-center rounded-full border font-body text-[11px] font-medium transition-colors",
    clickable && "cursor-pointer hover:brightness-110",
    isCorrect && "border-success/40 bg-success/15 text-success",
    isWrong && "border-error/40 bg-error/15 text-error",
    !answered && "border-border bg-transparent text-secondary hover:text-primary",
    isCurrent && "ring-1 ring-brand-gold/80 ring-offset-2 ring-offset-background",
  );
}
