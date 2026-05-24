"use client";

import { useMemo } from "react";
import {
  orderSessionOptions,
  type SessionOption,
  type SessionOptionOrderContext,
} from "@/features/session/lib/sessionOptionOrder";

export function useSessionOptionOrder(
  questionId: string,
  options: SessionOption[],
  ctx: SessionOptionOrderContext = {},
) {
  return useMemo(
    () => orderSessionOptions(questionId, options, ctx),
    [questionId, options, ctx.disableOptionShuffle, ctx.explanation],
  );
}
