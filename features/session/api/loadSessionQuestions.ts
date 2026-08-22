"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireLearningAccessForSubject } from "@/features/access/server/requireLearningAccess";
import {
  loadQuestionsByIdsOrdered,
  mapRowsToSessionQuestions,
} from "@/features/session/server/loadQuestionsByIdsOrdered";
import { attachAntaresMetaToQuestions } from "@/features/session/lib/antares/questionMeta";
import { fetchSessionQuestionMeta } from "@/features/session/server/fetchSessionQuestionMeta";
import type { SessionQuestion } from "@/features/session/types";
import { isSourceFilterUiEnabled } from "@/features/session/lib/sourceFilter";

const schema = z.string().uuid();

export type LoadSessionQuestionsResult =
  | {
      ok: true;
      sessionId: string;
      subject: { id: string; name: string; short_name: string };
      mode: string;
      questions: SessionQuestion[];
      reserveQuestions?: SessionQuestion[];
      product?: string | null;
    }
  | { ok: false; message: string };

export async function loadSessionQuestions(
  sessionIdRaw: string,
): Promise<LoadSessionQuestionsResult> {
  const t = await getTranslations("session");
  const sessionId = schema.safeParse(sessionIdRaw);
  if (!sessionId.success) {
    return { ok: false, message: t("errors.invalidSessionId") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: t("errors.mustLogin") };
    }

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select("id, user_id, subject_id, mode, question_ids, reserve_question_ids")
      .eq("id", sessionId.data)
      .maybeSingle();

    if (se || !session || session.user_id !== user.id) {
      return { ok: false, message: t("errors.sessionNotFound") };
    }

    const access = await requireLearningAccessForSubject(
      user.id,
      session.subject_id as string,
    );
    if (!access.ok) {
      return { ok: false, message: access.message };
    }

    const ids = (session.question_ids as string[] | null) ?? [];
    if (ids.length === 0) {
      return {
        ok: false,
        message: t("errors.sessionNoQueue"),
      };
    }

    const { data: subject, error: subErr } = await supabase
      .from("subjects")
      .select("id, name, short_name, product")
      .eq("id", session.subject_id as string)
      .maybeSingle();

    if (subErr || !subject) {
      return { ok: false, message: t("errors.subjectNotFound") };
    }

    const includeSourceMeta = isSourceFilterUiEnabled(subject.product as string);
    const ordered = await loadQuestionsByIdsOrdered(supabase, ids, undefined, {
      includeSourceMeta,
    });
    let questions: SessionQuestion[] = mapRowsToSessionQuestions(ordered);
    const reserveIds = (session.reserve_question_ids as string[] | null) ?? [];
    let reserveQuestions: SessionQuestion[] | undefined;

    if (session.mode === "nauka") {
      const meta = await fetchSessionQuestionMeta(supabase, user.id, [
        ...ids,
        ...reserveIds,
      ]);
      questions = attachAntaresMetaToQuestions(questions, meta);

      if (reserveIds.length > 0) {
        const orderedReserve = await loadQuestionsByIdsOrdered(
          supabase,
          reserveIds,
          undefined,
          { includeSourceMeta },
        );
        if (orderedReserve.length > 0) {
          reserveQuestions = attachAntaresMetaToQuestions(
            mapRowsToSessionQuestions(orderedReserve),
            meta,
          );
        }
      }
    }

    return {
      ok: true,
      sessionId: session.id,
      subject: {
        id: subject.id as string,
        name: subject.name as string,
        short_name: subject.short_name as string,
      },
      mode: session.mode as string,
      questions,
      reserveQuestions,
      product: (subject.product as string | null) ?? null,
    };
  } catch (e) {
    console.error("[loadSessionQuestions]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
