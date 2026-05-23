"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseStoredSessionInsights } from "@/features/session/lib/parseStoredSessionInsights";
import type {
  ExamReadinessSnapshot,
  SessionInsightsPayload,
} from "@/features/session/summaryTypes";

const schema = z.string().uuid();

export type LoadSessionAntaresInsightsResult =
  | {
      ok: true;
      ready: boolean;
      sessionInsights: SessionInsightsPayload | null;
      examReadiness: ExamReadinessSnapshot | null;
    }
  | { ok: false; message: string };

export async function loadSessionAntaresInsights(
  sessionIdRaw: string,
): Promise<LoadSessionAntaresInsightsResult> {
  const parsed = schema.safeParse(sessionIdRaw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowy identyfikator sesji." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Brak sesji." };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select("session_insights, is_completed")
      .eq("id", parsed.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (se || !session) {
      return { ok: false, message: "Sesja nie została znaleziona." };
    }

    const { sessionInsights, examReadiness } = parseStoredSessionInsights(
      session.session_insights,
    );

    const ready = sessionInsights != null || examReadiness != null;

    return {
      ok: true,
      ready,
      sessionInsights,
      examReadiness,
    };
  } catch (e) {
    console.error("[loadSessionAntaresInsights]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
