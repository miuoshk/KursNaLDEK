"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  mapRowToSessionQuestion,
  type QuestionRow,
} from "@/features/session/lib/mapSessionQuestion";
import type { SessionQuestion } from "@/features/session/types";

const schema = z.string().uuid();

export type LoadSessionQuestionsResult =
  | {
      ok: true;
      sessionId: string;
      subject: { id: string; name: string; short_name: string };
      mode: string;
      questions: SessionQuestion[];
    }
  | { ok: false; message: string };

export async function loadSessionQuestions(
  sessionIdRaw: string,
): Promise<LoadSessionQuestionsResult> {
  const sessionId = schema.safeParse(sessionIdRaw);
  if (!sessionId.success) {
    return { ok: false, message: "Nieprawidłowy identyfikator sesji." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Musisz być zalogowany." };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select("id, user_id, subject_id, mode, question_ids")
      .eq("id", sessionId.data)
      .maybeSingle();

    if (se || !session || session.user_id !== user.id) {
      return { ok: false, message: "Nie znaleziono sesji." };
    }

    const ids = (session.question_ids as string[] | null) ?? [];
    if (ids.length === 0) {
      return {
        ok: false,
        message: "Sesja nie zawiera kolejki pytań. Rozpocznij sesję ponownie.",
      };
    }

    const { data: subject, error: subErr } = await supabase
      .from("subjects")
      .select("id, name, short_name")
      .eq("id", session.subject_id as string)
      .maybeSingle();

    if (subErr || !subject) {
      return { ok: false, message: "Nie znaleziono przedmiotu." };
    }

    const { data: rows, error: qe } = await supabase
      .from("questions")
      .select(
        "id, text, options, correct_option_id, explanation, difficulty, source_code, topics ( name )",
      )
      .in("id", ids);

    if (qe) {
      console.error("[loadSessionQuestions]", qe.message);
      return { ok: false, message: "Nie udało się wczytać pytań." };
    }

    const byId = new Map((rows ?? []).map((r) => [r.id as string, r as QuestionRow]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as QuestionRow[];

    return {
      ok: true,
      sessionId: session.id,
      subject,
      mode: session.mode as string,
      questions: ordered.map(mapRowToSessionQuestion),
    };
  } catch (e) {
    console.error("[loadSessionQuestions]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
