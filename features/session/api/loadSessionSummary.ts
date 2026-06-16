"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { buildSessionSummary } from "@/features/session/server/sessionSummaryBuilder";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export type LoadSessionSummaryResult =
  | { ok: true; summary: SessionSummaryData }
  | { ok: false; message: string };

export async function loadSessionSummaryAction(
  sessionId: string,
): Promise<LoadSessionSummaryResult> {
  const t = await getTranslations("session");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("errors.noSession") };
  }

  const { data: row } = await supabase
    .from("study_sessions")
    .select("is_completed")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row?.is_completed) {
    return { ok: false, message: t("errors.sessionNotCompleted") };
  }

  const summary = await buildSessionSummary(supabase, sessionId, user.id);
  if (!summary) {
    return { ok: false, message: t("errors.summaryMissing") };
  }
  return { ok: true, summary };
}
