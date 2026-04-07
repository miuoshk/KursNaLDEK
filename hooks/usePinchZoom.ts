"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function mid(touches: TouchList): Point {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function touchDistance(touches: TouchList): number {
  return dist(
    { x: touches[0].clientX, y: touches[0].clientY },
    { x: touches[1].clientX, y: touches[1].clientY },
  );
}

export type UsePinchZoomOptions = {
  minScale?: number;
  maxScale?: number;
  doubleTapScale?: number;
  doubleTapDelayMs?: number;
};

export type UsePinchZoomReturn = {
  containerRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  scale: number;
  translate: { x: number; y: number };
  contentStyle: CSSProperties;
  resetView: () => void;
};

/**
 * Pinch-to-zoom + pan (1 palec przy scale &gt; 1) + double-tap / double-click zoom.
 * Kontener: overflow: hidden, touch-action: none, className z [touch-action:none].
 */
export function usePinchZoom(options?: UsePinchZoomOptions): UsePinchZoomReturn {
  const minScale = options?.minScale ?? 1;
  const maxScale = options?.maxScale ?? 4;
  const doubleTapScale = options?.doubleTapScale ?? 2;
  const doubleTapDelayMs = options?.doubleTapDelayMs ?? 280;

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    mid: Point;
    tx: number;
    ty: number;
  } | null>(null);

  const panStartRef = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);

  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  useEffect(() => {
    scaleRef.current = scale;
    translateRef.current = translate;
  }, [scale, translate]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
  }, []);

  const applyDoubleTapZoom = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const current = scaleRef.current;

      if (current < 1.2) {
        const target = Math.min(maxScale, doubleTapScale);
        setScale(target);
        scaleRef.current = target;
        const ox = clientX - cx;
        const oy = clientY - cy;
        const tx = -ox * (target - 1) * 0.45;
        const ty = -oy * (target - 1) * 0.45;
        setTranslate({ x: tx, y: ty });
        translateRef.current = { x: tx, y: ty };
      } else {
        resetView();
      }
    },
    [doubleTapScale, maxScale, resetView],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartRef.current = {
          distance: touchDistance(e.touches),
          scale: scaleRef.current,
          mid: mid(e.touches),
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        };
        panStartRef.current = null;
      } else if (e.touches.length === 1 && scaleRef.current > 1.01) {
        panStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translateRef.current.x,
          ty: translateRef.current.y,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault();
        const start = pinchStartRef.current;
        const d = touchDistance(e.touches);
        if (start.distance < 1) return;
        let nextScale = start.scale * (d / start.distance);
        nextScale = Math.min(maxScale, Math.max(minScale, nextScale));
        setScale(nextScale);
        scaleRef.current = nextScale;

        const newMid = mid(e.touches);
        const dx = newMid.x - start.mid.x;
        const dy = newMid.y - start.mid.y;
        const tx = start.tx + dx;
        const ty = start.ty + dy;
        setTranslate({ x: tx, y: ty });
        translateRef.current = { x: tx, y: ty };
      } else if (e.touches.length === 1 && panStartRef.current && scaleRef.current > 1.01) {
        e.preventDefault();
        const p = panStartRef.current;
        const dx = e.touches[0].clientX - p.x;
        const dy = e.touches[0].clientY - p.y;
        const tx = p.tx + dx;
        const ty = p.ty + dy;
        setTranslate({ x: tx, y: ty });
        translateRef.current = { x: tx, y: ty };
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartRef.current = null;
      }
      if (e.touches.length === 0) {
        panStartRef.current = null;
      }

      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const t = e.changedTouches[0];
        const now = Date.now();
        const last = lastTapRef.current;
        if (
          last &&
          now - last.t < doubleTapDelayMs &&
          Math.abs(t.clientX - last.x) < 44 &&
          Math.abs(t.clientY - last.y) < 44
        ) {
          applyDoubleTapZoom(t.clientX, t.clientY);
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { t: now, x: t.clientX, y: t.clientY };
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      applyDoubleTapZoom(e.clientX, e.clientY);
    };
    el.addEventListener("dblclick", onDblClick);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("dblclick", onDblClick);
    };
  }, [applyDoubleTapZoom, doubleTapDelayMs, maxScale, minScale]);

  const contentStyle: CSSProperties = {
    transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
    transformOrigin: "center center",
    willChange: "transform",
  };

  return {
    containerRef,
    contentRef,
    scale,
    translate,
    contentStyle,
    resetView,
  };
}
