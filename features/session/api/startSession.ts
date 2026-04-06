"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SessionMode, SessionQuestion } from "@/features/session/types";
import {
  fetchSubjectQuestionIds,
  fetchTopicQuestionIds,
  shuffle,
} from "@/features/session/server/questionSelection";
import {
  fetchDueReviewQuestionIds,
  fetchUnseenQuestionIds,
  mixNaukaQuestionIds,
} from "@/features/session/server/sessionQuestionMix";
import {
  loadQuestionsByIdsOrdered,
  mapRowsToSessionQuestions,
} from "@/features/session/server/loadQuestionsByIdsOrdered";

const schema = z.object({
  subjectId: z.string().min(1),
  mode: z.enum(["nauka", "egzamin", "powtorka"]),
  count: z.coerce.number().min(1).max(100),
  topicId: z.string().min(1).optional(),
});

export type StartSessionResult =
  | {
      ok: true;
      sessionId: string;
      subject: { id: string; name: string; short_name: string };
      questions: SessionQuestion[];
    }
  | { ok: false; message: string };

export async function startSession(
  input: z.infer<typeof schema>,
): Promise<StartSessionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe parametry sesji." };
  }

  const { subjectId, mode, count, topicId } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Musisz być zalogowany, aby rozpocząć sesję." };
    }

    const { data: subject, error: subErr } = await supabase
      .from("subjects")
      .select("id, name, short_name")
      .eq("id", subjectId)
      .maybeSingle();

    if (subErr || !subject) {
      return { ok: false, message: "Nie znaleziono przedmiotu." };
    }

    let chosenIds: string[] = [];

    let pool: string[];
    let topicFilter: Set<string> | undefined;
    if (topicId) {
      const { data: top, error: te } = await supabase
        .from("topics")
        .select("subject_id")
        .eq("id", topicId)
        .maybeSingle();
      if (te || !top || top.subject_id !== subjectId) {
        return { ok: false, message: "Nieprawidłowy temat dla tego przedmiotu." };
      }
      pool = await fetchTopicQuestionIds(supabase, topicId);
      topicFilter = new Set(pool);
      if (pool.length === 0) {
        return {
          ok: false,
          message: "Brak aktywnych pytań w wybranym temacie.",
        };
      }
    } else {
      pool = await fetchSubjectQuestionIds(supabase, subjectId);
    }

    if (mode === "powtorka") {
      chosenIds = await fetchDueReviewQuestionIds(
        supabase,
        user.id,
        subjectId,
        count,
        topicFilter,
      );
      if (chosenIds.length === 0) {
        return {
          ok: false,
          message:
            "Nie masz zaległych powtórek z tego przedmiotu. Wróć później lub wybierz tryb Nauka.",
        };
      }
    } else if (mode === "nauka") {
      const dueIds = await fetchDueReviewQuestionIds(
        supabase,
        user.id,
        subjectId,
        count,
        topicFilter,
      );
      const unseenIds = await fetchUnseenQuestionIds(
        supabase,
        user.id,
        pool,
        count,
      );
      chosenIds = mixNaukaQuestionIds(dueIds, unseenIds, pool, count);
    } else {
      chosenIds = shuffle(pool).slice(0, count);
    }

    if (chosenIds.length === 0) {
      return {
        ok: false,
        message:
          "Brak pytań dla tego przedmiotu. Uruchom skrypt seed w Supabase.",
      };
    }

    chosenIds = chosenIds.slice(0, count);

    const rows = await loadQuestionsByIdsOrdered(supabase, chosenIds);
    if (rows.length === 0) {
      return { ok: false, message: "Nie udało się wczytać treści pytań." };
    }

    const questions = mapRowsToSessionQuestions(rows);

    const { data: inserted, error: insErr } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        mode,
        total_questions: questions.length,
        question_ids: chosenIds,
      })
      .select("id")
      .single();

    if (insErr) {
      console.error("[startSession] insert session", insErr.message, insErr);
      return {
        ok: false,
        message:
          "Nie udało się utworzyć sesji. Upewnij się, że w bazie jest kolumna question_ids (skrypt scripts/seed-content.sql).",
      };
    }

    return {
      ok: true,
      sessionId: inserted.id,
      subject: {
        id: subject.id,
        name: subject.name,
        short_name: subject.short_name,
      },
      questions,
    };
  } catch (e) {
    console.error("[startSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
