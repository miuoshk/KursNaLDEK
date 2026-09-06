import type { Confidence } from "@/features/session/types";

export type SessionShortcut =
  | { type: "previous" }
  | { type: "next" }
  | { type: "confidence"; confidence: Confidence }
  | { type: "select"; optionIndex: number }
  | { type: "none" };

export function resolveSessionShortcut(
  key: string,
  ctx: {
    currentIndex: number;
    total: number;
    isShowingFeedback: boolean;
    isCurrentAnswered: boolean;
    isWaitingForConfidence: boolean;
    isPrzeglad: boolean;
    optionCount: number;
  },
): SessionShortcut {
  if (key === "ArrowLeft" && ctx.currentIndex > 0) {
    return { type: "previous" };
  }

  if (ctx.isWaitingForConfidence && !ctx.isPrzeglad) {
    if (key === "1") return { type: "confidence", confidence: "nie_wiedzialem" };
    if (key === "2") return { type: "confidence", confidence: "troche" };
    if (key === "3") return { type: "confidence", confidence: "na_pewno" };
    return { type: "none" };
  }

  if (key === "ArrowRight") {
    if (
      ctx.currentIndex >= ctx.total - 1 &&
      !(ctx.isShowingFeedback || ctx.isCurrentAnswered)
    ) {
      return { type: "none" };
    }
    return { type: "next" };
  }

  if (
    (key === "Enter" || key === " ") &&
    (ctx.isShowingFeedback || ctx.isCurrentAnswered)
  ) {
    return { type: "next" };
  }

  if (!ctx.isShowingFeedback && !ctx.isCurrentAnswered) {
    if (key >= "1" && key <= "9") {
      const optionIndex = Number(key) - 1;
      if (optionIndex >= 0 && optionIndex < ctx.optionCount) {
        return { type: "select", optionIndex };
      }
    }
  }

  return { type: "none" };
}
