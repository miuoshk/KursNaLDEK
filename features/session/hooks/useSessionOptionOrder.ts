"use client";

import { useMemo } from "react";
import {
  orderSessionOptions,
  type SessionOption,
} from "@/features/session/lib/sessionOptionOrder";

export function useSessionOptionOrder(
  questionId: string,
  options: SessionOption[],
  disableOptionShuffle = false,
) {
  return useMemo(
    () => orderSessionOptions(questionId, options, disableOptionShuffle),
    [questionId, options, disableOptionShuffle],
  );
}
