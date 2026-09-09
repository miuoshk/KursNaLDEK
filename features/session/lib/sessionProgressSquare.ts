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
    "flex size-11 shrink-0 items-center justify-center rounded-sm border font-body text-[11px] font-medium transition-colors",
    clickable && "cursor-pointer hover:brightness-110",
    isCorrect && "border-success/40 bg-success text-white",
    isWrong && "border-error/40 bg-error text-white",
    !answered &&
      "border-white/15 bg-white/[0.04] text-secondary hover:text-primary",
    isCurrent && !answered && "bg-white/15 text-primary",
    isCurrent &&
      "ring-2 ring-brand-gold/80 ring-offset-1 ring-offset-background",
  );
}
