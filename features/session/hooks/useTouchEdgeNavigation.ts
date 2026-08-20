"use client";

import { useEffect, useRef } from "react";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";

const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 450;
const SWIPE_MAX_VERTICAL_PX = 36;
const TAP_MAX_PX = 14;
const TAP_EDGE_MAX_PX = 72;
const TAP_EDGE_RATIO = 0.12;

type Options = {
  onPrevious: () => void;
  onNext: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  enabled?: boolean;
};

type TouchStart = {
  x: number;
  y: number;
  t: number;
  fromHorizontalScroll: boolean;
  interactive: boolean;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("a, button, input, textarea, select, [role='button']"),
  );
}

function isInsideHorizontalScroll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-horizontal-scroll]")) return true;

  let node: HTMLElement | null =
    target instanceof HTMLElement ? target : target.parentElement;
  while (node && node !== document.body) {
    const { overflowX } = window.getComputedStyle(node);
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      node.scrollWidth > node.clientWidth + 1
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Nawigacja dotykowa (telefon, iPad): swipe poziomy oraz tap przy krawędzi.
 * Nie przechwytuje gestów na poziomych paskach (katalog / postęp sesji)
 * i nie blokuje pionowego scrolla treści pytania.
 */
export function useTouchEdgeNavigation({
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  enabled = true,
}: Options) {
  const narrow = useNarrowViewport();
  const touchStart = useRef<TouchStart | null>(null);
  const active = enabled && narrow;

  useEffect(() => {
    if (!active) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStart.current = {
        x: t.clientX,
        y: t.clientY,
        t: Date.now(),
        fromHorizontalScroll: isInsideHorizontalScroll(e.target),
        interactive: isInteractiveTarget(e.target),
      };
    }

    function onTouchEnd(e: TouchEvent) {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || e.changedTouches.length !== 1) return;
      if (start.fromHorizontalScroll) return;

      const end = e.changedTouches[0];
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      const elapsed = Date.now() - start.t;
      if (elapsed > SWIPE_MAX_MS) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX <= TAP_MAX_PX && absY <= TAP_MAX_PX) {
        if (start.interactive) return;
        const edge = Math.min(window.innerWidth * TAP_EDGE_RATIO, TAP_EDGE_MAX_PX);
        if (start.x <= edge && canPrevious) {
          onPrevious();
        } else if (start.x >= window.innerWidth - edge && canNext) {
          onNext();
        }
        return;
      }

      if (absX < SWIPE_MIN_PX) return;
      if (absY >= SWIPE_MAX_VERTICAL_PX) return;
      if (absX < absY * 1.6) return;

      if (dx > 0 && canPrevious) {
        onPrevious();
      } else if (dx < 0 && canNext) {
        onNext();
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [active, canPrevious, canNext, onPrevious, onNext]);
}
