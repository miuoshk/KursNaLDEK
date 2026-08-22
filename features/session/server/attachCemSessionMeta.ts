import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionRow } from "@/features/session/lib/mapSessionQuestion";

const CHUNK = 200;

/**
 * Dociąga cem_sessions.label i numer z cem_question_occurrences
 * dla first_seen_session. Nie zgaduje numeru, gdy occurrence.question_number IS NULL.
 * Wołać tylko gdy filtr źródła jest na live (LDEK/LDEW).
 */
export async function attachCemSessionMeta(
  supabase: SupabaseClient,
  rows: QuestionRow[],
): Promise<void> {
  const sessionIds = [
    ...new Set(
      rows
        .map((row) => row.first_seen_session)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (sessionIds.length === 0) return;

  const labels = new Map<string, string>();
  for (let i = 0; i < sessionIds.length; i += CHUNK) {
    const chunk = sessionIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("cem_sessions")
      .select("id, label")
      .in("id", chunk);
    if (error) {
      console.error("[attachCemSessionMeta] cem_sessions", error.message);
      break;
    }
    for (const row of data ?? []) {
      labels.set(row.id as string, row.label as string);
    }
  }

  const cemRows = rows.filter(
    (row) => row.source === "cem" && row.first_seen_session,
  );
  const numbers = new Map<string, number | null>();
  for (let i = 0; i < cemRows.length; i += CHUNK) {
    const chunk = cemRows.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("cem_question_occurrences")
      .select("question_id, cem_session_id, question_number")
      .in(
        "question_id",
        chunk.map((row) => row.id),
      )
      .in(
        "cem_session_id",
        chunk.map((row) => row.first_seen_session as string),
      );
    if (error) {
      console.error("[attachCemSessionMeta] occurrences", error.message);
      break;
    }
    for (const occ of data ?? []) {
      const sid = occ.cem_session_id as string;
      const qid = occ.question_id as string;
      if (chunk.some((row) => row.id === qid && row.first_seen_session === sid)) {
        const raw = occ.question_number;
        numbers.set(
          `${sid}::${qid}`,
          raw == null ? null : Number(raw),
        );
      }
    }
  }

  for (const row of rows) {
    if (row.first_seen_session) {
      row.cemSessionLabel = labels.get(row.first_seen_session) ?? null;
    }
    if (row.source === "cem" && row.first_seen_session) {
      const key = `${row.first_seen_session}::${row.id}`;
      row.cemQuestionNumber = numbers.has(key) ? numbers.get(key) ?? null : null;
    }
  }
}
