"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canConsumeHorizontalDelta,
  horizontalScrollDelta,
} from "@/features/session/lib/horizontalCarousel";

type EdgeFade = {
  left: boolean;
  right: boolean;
};

/**
 * Pozioma karuzela: overflow, fade na krawędziach, kółko/trackpad → scroll X.
 */
export function useHorizontalCarousel(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [fade, setFade] = useState<EdgeFade>({ left: false, right: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const nextOverflows = el.scrollWidth > el.clientWidth + 1;
    setOverflows(nextOverflows);
    setFade({
      left: nextOverflows && el.scrollLeft > 1,
      right:
        nextOverflows && el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    el.addEventListener("scroll", sync, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", sync);
    };
  }, [itemCount, sync]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const delta = horizontalScrollDelta(event.deltaX, event.deltaY);
      if (
        !canConsumeHorizontalDelta(
          el.scrollLeft,
          el.clientWidth,
          el.scrollWidth,
          delta,
        )
      ) {
        return;
      }
      event.preventDefault();
      el.scrollLeft += delta;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [itemCount]);

  return { ref, overflows, fade, sync };
}
