import type { SupabaseClient } from "@supabase/supabase-js";
import { clampSessionCount } from "@/features/session/lib/sessionCount";

/** Zapisuje ostatnią liczbę pytań z konfiguracji sesji (fire-and-forget). */
export async function persistLastSessionQuestionCount(
  supabase: SupabaseClient,
  userId: string,
  count: number,
): Promise<void> {
  const safe = clampSessionCount(count);
  const { error } = await supabase
    .from("profiles")
    .update({
      last_session_question_count: safe,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "[persistLastSessionQuestionCount]",
      error.message,
      "— uruchom scripts/2026-05-24-last-session-question-count.sql",
    );
  }
}
