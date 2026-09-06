"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseStoredSessionInsights } from "@/features/session/lib/parseStoredSessionInsights";
import {
  SESSION_ANSWER_ANTARES_SELECT,
  computeAndStoreSessionInsights,
  mapAnswerRowsForPostAntares,
} from "@/features/session/server/completeSessionPostAntares";
import type { LoadSessionAntaresInsightsResult } from "@/features/session/api/loadSessionAntaresInsights";

const schema = z.string().uuid();

/**
 * Dociąga wskazówki z DB albo przelicza je, gdy after() ich nie zapisał.
 * Przycisk Odśwież i timeout polla wołają to zamiast samego odczytu.
 */
export async function ensureSessionInsights(
  sessionIdRaw: string,
): Promise<LoadSessionAntaresInsightsResult> {
  const t = await getTranslations("session");
  const parsed = schema.safeParse(sessionIdRaw);
  if (!parsed.success) {
    return { ok: false, message: t("errors.invalidSessionId") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: t("errors.noSession") };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select(
        "id, user_id, is_completed, session_insights, feedback_experiment_variant, engine_variant, memory_parameter_set_id",
      )
      .eq("id", parsed.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (se || !session) {
      return { ok: false, message: t("errors.sessionNotFound") };
    }

    const existing = parseStoredSessionInsights(session.session_insights);
    if (existing.sessionInsights != null || existing.examReadiness != null) {
      return {
        ok: true,
        ready: true,
        sessionInsights: existing.sessionInsights,
        examReadiness: existing.examReadiness,
      };
    }

    if (!session.is_completed) {
      return {
        ok: true,
        ready: false,
        sessionInsights: null,
        examReadiness: null,
      };
    }

    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("session_answers")
      .select(SESSION_ANSWER_ANTARES_SELECT)
      .eq("session_id", session.id);
    const ansRows = mapAnswerRowsForPostAntares(rows ?? []);
    if (ansRows.length === 0) {
      return {
        ok: true,
        ready: false,
        sessionInsights: null,
        examReadiness: null,
      };
    }

    const result = await computeAndStoreSessionInsights(admin, {
      userId: user.id,
      sessionId: session.id as string,
      ansRows,
      answeredCount: ansRows.length,
      adaptiveFeedbackEnabled:
        session.feedback_experiment_variant === "treatment",
      engineVariant:
        session.engine_variant === "treatment" ? "treatment" : "shadow",
      parameterSetId:
        (session.memory_parameter_set_id as string | null) ?? null,
    });

    if (!result) {
      return {
        ok: true,
        ready: false,
        sessionInsights: null,
        examReadiness: null,
      };
    }

    return {
      ok: true,
      ready: true,
      sessionInsights: result.sessionInsights,
      examReadiness: result.examReadiness,
    };
  } catch (e) {
    console.error("[ensureSessionInsights]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
