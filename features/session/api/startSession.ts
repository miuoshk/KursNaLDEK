"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SessionMode, SessionQuestion } from "@/features/session/types";
import {
  fetchKnnpAllQuestionIds,
  fetchKnnpTopicIdSet,
  fetchSubjectQuestionIds,
  fetchTopicQuestionIds,
  shuffle,
} from "@/features/session/server/questionSelection";
import {
  fetchDueReviewQuestionIdsForTopics,
  fetchUnseenQuestionIds,
  mixNaukaQuestionIds,
} from "@/features/session/server/sessionQuestionMix";
import {
  loadQuestionsByIdsOrdered,
  mapRowsToSessionQuestions,
} from "@/features/session/server/loadQuestionsByIdsOrdered";

const schema = z.object({
  /** Puste = sesja mieszana (wszystkie przedmioty knnp). */
  subjectId: z.string().optional(),
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

  const rawSubject = parsed.data.subjectId?.trim() ?? "";
  const isMix = rawSubject.length === 0;
  const { mode, count, topicId } = parsed.data;
  const subjectId = isMix ? "" : rawSubject;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Musisz być zalogowany, aby rozpocząć sesję." };
    }

    if (isMix && topicId) {
      return {
        ok: false,
        message: "Sesja mieszana nie obsługuje filtra po pojedynczym temacie.",
      };
    }

    let subjectRow: { id: string; name: string; short_name: string } | null = null;
    if (!isMix) {
      const { data: subject, error: subErr } = await supabase
        .from("subjects")
        .select("id, name, short_name")
        .eq("id", subjectId)
        .maybeSingle();

      if (subErr || !subject) {
        return { ok: false, message: "Nie znaleziono przedmiotu." };
      }
      subjectRow = subject;
    }

    let chosenIds: string[] = [];

    let pool: string[];
    let topicFilter: Set<string> | undefined;
    let topicOkForDue: Set<string>;
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
      const { data: topicRowsForDue } = await supabase
        .from("topics")
        .select("id")
        .eq("subject_id", subjectId);
      topicOkForDue = new Set((topicRowsForDue ?? []).map((t) => t.id as string));
      if (pool.length === 0) {
        return {
          ok: false,
          message: "Brak aktywnych pytań w wybranym temacie.",
        };
      }
    } else if (isMix) {
      pool = await fetchKnnpAllQuestionIds(supabase);
      topicOkForDue = await fetchKnnpTopicIdSet(supabase);
    } else {
      pool = await fetchSubjectQuestionIds(supabase, subjectId);
      const { data: topicRows } = await supabase
        .from("topics")
        .select("id")
        .eq("subject_id", subjectId);
      topicOkForDue = new Set((topicRows ?? []).map((t) => t.id as string));
    }

    if (mode === "powtorka") {
      chosenIds = await fetchDueReviewQuestionIdsForTopics(
        supabase,
        user.id,
        topicOkForDue,
        count,
        topicFilter,
      );
      if (chosenIds.length === 0) {
        return {
          ok: false,
          message: isMix
            ? "Nie masz zaległych powtórek. Wróć później lub wybierz tryb Nauka."
            : "Nie masz zaległych powtórek z tego przedmiotu. Wróć później lub wybierz tryb Nauka.",
        };
      }
    } else if (mode === "nauka") {
      const dueIds = await fetchDueReviewQuestionIdsForTopics(
        supabase,
        user.id,
        topicOkForDue,
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

    let insertSubjectId = subjectId;
    if (isMix && rows[0]) {
      const { data: q1 } = await supabase
        .from("questions")
        .select("topic_id")
        .eq("id", rows[0].id)
        .maybeSingle();
      const { data: t1 } = await supabase
        .from("topics")
        .select("subject_id")
        .eq("id", q1?.topic_id as string)
        .maybeSingle();
      if (t1?.subject_id) insertSubjectId = t1.subject_id as string;
    }

    const { data: inserted, error: insErr } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject_id: insertSubjectId,
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

    const { data: insertSubject } = await supabase
      .from("subjects")
      .select("id, name, short_name")
      .eq("id", insertSubjectId)
      .maybeSingle();

    return {
      ok: true,
      sessionId: inserted.id,
      subject: {
        id: insertSubjectId,
        name: isMix ? "Sesja mieszana" : (insertSubject?.name ?? subjectRow?.name ?? ""),
        short_name: isMix ? "Mix" : (insertSubject?.short_name ?? subjectRow?.short_name ?? ""),
      },
      questions,
    };
  } catch (e) {
    console.error("[startSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
