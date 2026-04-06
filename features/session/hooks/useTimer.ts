"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Licznik sekund. `start()` zeruje i odpala interwał; `pause()` zatrzymuje;
 * `reset()` czyści bez startu.
 */
export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, [clear]);

  const pause = useCallback(() => {
    clear();
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setElapsed(0);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  return { elapsed, start, pause, reset };
}
