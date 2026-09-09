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

export function isSessionTargetOffscreen(
  scrollerRect: { top: number; bottom: number },
  targetRect: { top: number },
  offsetPx: number,
): boolean {
  const visibleTop = scrollerRect.top + offsetPx;
  return targetRect.top < visibleTop - 1 || targetRect.top > scrollerRect.bottom - 8;
}

/** Extra air below the last line so it is not flush against the overlay footer. */
export const SESSION_OVERLAY_CHROME_GAP_PX = 12;

export function sessionOverlayChromePadding(
  chromeHeightPx: number,
  overlay: boolean,
): string {
  if (!overlay) return "0px";
  return `${Math.max(0, chromeHeightPx) + SESSION_OVERLAY_CHROME_GAP_PX}px`;
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
  if (
    !isSessionTargetOffscreen(
      scroller.getBoundingClientRect(),
      target.getBoundingClientRect(),
      offsetPx,
    )
  ) {
    return;
  }
  const nextTop =
    target.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    offsetPx;
  scroller.scrollTo({ top: Math.max(0, nextTop), behavior });
}
