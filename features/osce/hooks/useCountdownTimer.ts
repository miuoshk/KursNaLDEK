import { useCallback, useEffect, useRef, useState } from "react";

export type UseCountdownTimerOptions = {
  totalSeconds: number | null;
  questionId: string;
  onTimeout: () => void;
  /** Gdy false, interwał jest czyszczony (np. po odpowiedzi). */
  enabled?: boolean;
};

export type UseCountdownTimerReturn = {
  remaining: number;
  clearTimer: () => void;
};

export function useCountdownTimer(opts: UseCountdownTimerOptions): UseCountdownTimerReturn {
  const { totalSeconds, questionId, onTimeout, enabled = true } = opts;
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const [remaining, setRemaining] = useState(() => totalSeconds ?? 0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- reset timera przy zmianie pytania */
  useEffect(() => {
    const t = totalSeconds != null && totalSeconds > 0 ? totalSeconds : null;
    setRemaining(t ?? 0);
  }, [questionId, totalSeconds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    clearTimer();
    if (!enabled || totalSeconds == null || totalSeconds <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          onTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [questionId, totalSeconds, enabled, clearTimer]);

  return { remaining, clearTimer };
}
