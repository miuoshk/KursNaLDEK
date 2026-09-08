export type SessionBottomBarMode = "hidden" | "confidence" | "next";

export function resolveSessionNextLabel(input: {
  isLast: boolean;
  allAnswered: boolean;
  canEndPrzeglad: boolean;
  continueLabel: string;
  summaryLabel: string;
}): string {
  if (input.isLast || input.allAnswered || input.canEndPrzeglad) {
    return input.summaryLabel;
  }
  return input.continueLabel;
}

export function resolveSessionBottomBarMode(input: {
  isPrzeglad: boolean;
  isWaitingForConfidence: boolean;
  isShowingFeedback: boolean;
}): SessionBottomBarMode {
  if (input.isWaitingForConfidence && !input.isPrzeglad) return "confidence";
  if (input.isShowingFeedback) return "next";
  return "hidden";
}

export function prefersSessionReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollSessionScroller(
  scroller: HTMLElement,
  target: HTMLElement | null,
  offsetPx: number,
): void {
  const behavior: ScrollBehavior = prefersSessionReducedMotion()
    ? "auto"
    : "smooth";
  if (!target) {
    scroller.scrollTo({ top: 0, behavior });
    return;
  }
  const nextTop =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    offsetPx;
  scroller.scrollTo({ top: Math.max(0, nextTop), behavior });
}
