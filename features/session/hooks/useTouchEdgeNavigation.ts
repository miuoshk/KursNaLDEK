"use client";

import { useCallback, useEffect, useRef } from "react";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";

const SWIPE_MIN_PX = 48;
const SWIPE_MAX_MS = 450;

type Options = {
  onPrevious: () => void;
  onNext: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
  enabled?: boolean;
};

/**
 * Nawigacja dotykowa (telefon, iPad): swipe poziomy oraz strefy na skrajach ekranu.
 */
export function useTouchEdgeNavigation({
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
  enabled = true,
}: Options) {
  const narrow = useNarrowViewport();
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const active = enabled && narrow;

  useEffect(() => {
    if (!active) return;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    }

    function onTouchEnd(e: TouchEvent) {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || e.changedTouches.length !== 1) return;

      const end = e.changedTouches[0];
      const dx = end.clientX - start.x;
      const dy = end.clientY - start.y;
      const elapsed = Date.now() - start.t;

      if (elapsed > SWIPE_MAX_MS) return;
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

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

  const handleEdgePrevious = useCallback(() => {
    if (active && canPrevious) onPrevious();
  }, [active, canPrevious, onPrevious]);

  const handleEdgeNext = useCallback(() => {
    if (active && canNext) onNext();
  }, [active, canNext, onNext]);

  return {
    touchNavActive: active,
    onEdgePrevious: handleEdgePrevious,
    onEdgeNext: handleEdgeNext,
  };
}
