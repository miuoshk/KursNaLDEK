"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { SessionMode, SessionQuestion, SessionQuestionMeta } from "@/features/session/types";
import {
  fetchKnnpAllQuestionIds,
  fetchKnnpTopicIdSet,
  fetchSubjectQuestionIds,
  fetchTopicQuestionIds,
  shuffle,
} from "@/features/session/server/questionSelection";
import {
  getAnatomyPeerTopicId,
  getSubjectScopeIds,
  isSubjectInScope,
} from "@/features/session/server/sharedSubjects";
import { buildAntaresInteligentnaSession } from "@/features/session/server/buildAntaresInteligentnaSession";
import { fetchSessionQuestionMeta } from "@/features/session/server/fetchSessionQuestionMeta";
import { attachAntaresMetaToQuestions } from "@/features/session/lib/antares/questionMeta";
import { buildFallbackReserveIds } from "@/features/session/lib/antares/reservePool";
import {
  fetchDueReviewQuestionIdsForTopics,
  fetchUnseenQuestionIds,
  mixNaukaQuestionIds,
} from "@/features/session/server/sessionQuestionMix";
import {
  loadQuestionsByIdsOrdered,
  mapRowsToSessionQuestions,
} from "@/features/session/server/loadQuestionsByIdsOrdered";
import { persistLastSessionQuestionCount } from "@/features/session/server/persistLastSessionQuestionCount";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

const schema = z.object({
  subjectId: z.string().optional(),
  mode: z.enum(["inteligentna", "przeglad", "katalog"]),
  count: z.coerce.number().min(1).max(5000),
  topicId: z.string().min(1).optional(),
  questionIds: z.array(z.string().min(1)).min(1).max(5000).optional(),
});

export type StartSessionResult =
  | {
      ok: true;
      sessionId: string;
      subject: { id: string; name: string; short_name: string };
      questions: SessionQuestion[];
      /** Pula zapasowa (tylko inteligentna) — podmiany w trakcie sesji. */
      reserveQuestions?: SessionQuestion[];
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
  const { mode, count, topicId, questionIds: explicitIds } = parsed.data;
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

    // ── Explicit question IDs (e.g. retry wrong questions) ──
    if (explicitIds && explicitIds.length > 0) {
      const rows = await loadQuestionsByIdsOrdered(supabase, explicitIds);
      if (rows.length === 0) {
        return { ok: false, message: "Nie udało się wczytać treści pytań." };
      }
      const questions =
        mode === "inteligentna"
          ? attachAntaresMetaToQuestions(
              mapRowsToSessionQuestions(rows),
              await fetchSessionQuestionMeta(supabase, user.id, explicitIds),
            )
          : mapRowsToSessionQuestions(rows);

      // Resolve subject from first question
      let resolvedSubjectId = subjectId;
      if (!resolvedSubjectId && rows[0]) {
        const { data: q1 } = await supabase
          .from("questions")
          .select("topic_id")
          .eq("id", rows[0].id)
          .maybeSingle();
        if (q1?.topic_id) {
          const { data: t1 } = await supabase
            .from("topics")
            .select("subject_id")
            .eq("id", q1.topic_id as string)
            .maybeSingle();
          if (t1?.subject_id) resolvedSubjectId = t1.subject_id as string;
        }
      }

      const { data: subjMeta } = await supabase
        .from("subjects")
        .select("id, name, short_name")
        .eq("id", resolvedSubjectId)
        .maybeSingle();

      const { data: inserted, error: insErr } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          subject_id: resolvedSubjectId,
          mode: "nauka",
          total_questions: questions.length,
          question_ids: explicitIds,
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("[startSession] insert retry session", insErr.message);
        return { ok: false, message: "Nie udało się utworzyć sesji." };
      }

      return {
        ok: true,
        sessionId: inserted.id,
        subject: {
          id: resolvedSubjectId,
          name: subjMeta?.name ?? "Powtórka",
          short_name: subjMeta?.short_name ?? "",
        },
        questions,
      };
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
    let reserveIds: string[] = [];
    let antaresMeta = new Map<string, SessionQuestionMeta>();

    let pool: string[];
    let topicFilter: Set<string> | undefined;
    let topicOkForDue: Set<string>;
    if (topicId) {
      const { data: top, error: te } = await supabase
        .from("topics")
        .select("subject_id")
        .eq("id", topicId)
        .maybeSingle();
      if (te || !top || !isSubjectInScope(subjectId, top.subject_id as string)) {
        return { ok: false, message: "Nieprawidłowy temat dla tego przedmiotu." };
      }
      const topicIdsForPool = [topicId];
      const peerTopicId = getAnatomyPeerTopicId(topicId);
      if (peerTopicId) {
        const { data: peerTopic } = await supabase
          .from("topics")
          .select("id")
          .eq("id", peerTopicId)
          .maybeSingle();
        if (peerTopic?.id) topicIdsForPool.push(peerTopic.id as string);
      }

      const pooledByTopic = await Promise.all(
        topicIdsForPool.map((id) => fetchTopicQuestionIds(supabase, id)),
      );
      pool = pooledByTopic.flat();
      topicFilter = new Set(pool);
      const { data: topicRowsForDue } = await supabase
        .from("topics")
        .select("id")
        .in("subject_id", getSubjectScopeIds(subjectId));
      topicOkForDue = new Set((topicRowsForDue ?? []).map((t) => t.id as string));
      if (pool.length === 0) {
        return { ok: false, message: "Brak aktywnych pytań w wybranym temacie." };
      }
    } else if (isMix) {
      // Sesja mieszana / domyślna powtórka: zawężamy pulę do bieżącego
      // (track, year) usera, żeby studentka rok 3 farmy nie dostała pytań
      // z anatomii z poprzednich lat.
      const profile = await getProfileByUserId(user.id);
      const track = normalizeTrack(profile?.current_track);
      const year = normalizeYear(profile?.current_year);
      pool = await fetchKnnpAllQuestionIds(supabase, track, year);
      topicOkForDue = await fetchKnnpTopicIdSet(supabase, track, year);
    } else {
      pool = await fetchSubjectQuestionIds(supabase, subjectId);
      const { data: topicRows } = await supabase
        .from("topics")
        .select("id")
        .in("subject_id", getSubjectScopeIds(subjectId));
      topicOkForDue = new Set((topicRows ?? []).map((t) => t.id as string));
    }

    if (mode === "katalog") {
      chosenIds = pool;
    } else if (mode === "inteligentna") {
      const antares = await buildAntaresInteligentnaSession(
        supabase,
        user.id,
        count,
        pool,
        topicOkForDue,
        topicFilter,
      );
      if (antares.questionIds.length > 0) {
        chosenIds = antares.questionIds;
        reserveIds = antares.reserveIds;
        antaresMeta = antares.metaByQuestionId;
      } else {
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
        reserveIds = buildFallbackReserveIds(count, chosenIds, pool);
        antaresMeta = await fetchSessionQuestionMeta(
          supabase,
          user.id,
          [...chosenIds, ...reserveIds],
        );
      }
    } else {
      chosenIds = shuffle(pool).slice(0, count);
    }

    if (chosenIds.length === 0) {
      return {
        ok: false,
        message: "Brak pytań dla tego przedmiotu. Uruchom skrypt seed w Supabase.",
      };
    }

    if (mode !== "katalog") {
      chosenIds = chosenIds.slice(0, count);
    }

    const rows = await loadQuestionsByIdsOrdered(supabase, chosenIds);
    if (rows.length === 0) {
      return { ok: false, message: "Nie udało się wczytać treści pytań." };
    }

    const questions =
      mode === "inteligentna"
        ? attachAntaresMetaToQuestions(
            mapRowsToSessionQuestions(rows),
            antaresMeta,
          )
        : mapRowsToSessionQuestions(rows);

    let reserveQuestions: SessionQuestion[] = [];
    if (mode === "inteligentna" && reserveIds.length > 0) {
      const reserveRows = await loadQuestionsByIdsOrdered(supabase, reserveIds);
      if (reserveRows.length > 0) {
        reserveQuestions = attachAntaresMetaToQuestions(
          mapRowsToSessionQuestions(reserveRows),
          antaresMeta,
        );
      }
    }

    if (mode === "katalog") {
      return {
        ok: true,
        sessionId: `katalog-${Date.now()}`,
        subject: {
          id: subjectId,
          name: subjectRow?.name ?? "Przeglądanie",
          short_name: subjectRow?.short_name ?? "",
        },
        questions,
      };
    }

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

    const dbMode = mode === "inteligentna" ? "nauka" : "egzamin";

    const { data: inserted, error: insErr } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject_id: insertSubjectId,
        mode: dbMode,
        total_questions: questions.length,
        question_ids: chosenIds,
        reserve_question_ids: reserveIds,
      })
      .select("id")
      .single();

    if (insErr) {
      console.error("[startSession] insert session", insErr.message, insErr);
      return {
        ok: false,
        message: "Nie udało się utworzyć sesji. Upewnij się, że w bazie jest kolumna question_ids.",
      };
    }

    void persistLastSessionQuestionCount(supabase, user.id, count);

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
      reserveQuestions:
        reserveQuestions.length > 0 ? reserveQuestions : undefined,
    };
  } catch (e) {
    console.error("[startSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
