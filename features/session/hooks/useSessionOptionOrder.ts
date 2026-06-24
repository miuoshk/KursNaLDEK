"use client";

import { useMemo } from "react";
import {
  orderSessionOptions,
  type SessionOption,
  type SessionOptionOrderContext,
} from "@/features/session/lib/sessionOptionOrder";

export function useSessionOptionOrder(
  sessionId: string,
  questionId: string,
  options: SessionOption[],
  ctx: SessionOptionOrderContext = {},
) {
  return useMemo(
    () => orderSessionOptions(sessionId, questionId, options, ctx),
    [sessionId, questionId, options, ctx.disableOptionShuffle, ctx.explanation],
  );
}
