"use server";

import { createClient } from "@/lib/supabase/server";
import { buildSessionSummary } from "@/features/session/server/sessionSummaryBuilder";
import type { SessionSummaryData } from "@/features/session/summaryTypes";

export type LoadSessionSummaryResult =
  | { ok: true; summary: SessionSummaryData }
  | { ok: false; message: string };

export async function loadSessionSummaryAction(
  sessionId: string,
): Promise<LoadSessionSummaryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Brak sesji." };
  }

  const { data: row } = await supabase
    .from("study_sessions")
    .select("is_completed")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row?.is_completed) {
    return { ok: false, message: "Sesja nie jest zakończona." };
  }

  const summary = await buildSessionSummary(supabase, sessionId, user.id);
  if (!summary) {
    return { ok: false, message: "Brak podsumowania." };
  }
  return { ok: true, summary };
}
