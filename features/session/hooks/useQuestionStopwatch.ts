"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Licznik czasu na pytanie przez performance.now() (bez setInterval w deps).
 */
export function useQuestionStopwatch(questionKey: string | undefined) {
  const startTimeRef = useRef(0);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  /** Zwraca sekundy od startu (zaokrąglone w dół). */
  const pauseAndGetSeconds = useCallback((): number => {
    return Math.max(0, Math.floor((performance.now() - startTimeRef.current) / 1000));
  }, []);

  useEffect(() => {
    if (!questionKey) return;
    startTimeRef.current = performance.now();
  }, [questionKey, start]);

  return { start, pauseAndGetSeconds };
}
