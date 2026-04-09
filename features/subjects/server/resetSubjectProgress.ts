"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  subjectId: z.string().uuid(),
});

export type ResetSubjectProgressResult =
  | { ok: true }
  | { ok: false; message: string };

export async function resetSubjectProgress(
  input: z.infer<typeof schema>,
): Promise<ResetSubjectProgressResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Brak sesji logowania." };
    }

    const { subjectId } = parsed.data;

    // Get all topic IDs for this subject
    const { data: topicRows, error: topicErr } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId);

    if (topicErr) {
      console.error("[resetSubjectProgress] topics", topicErr.message);
      return { ok: false, message: "Nie udało się pobrać tematów." };
    }

    const topicIds = (topicRows ?? []).map((t) => t.id as string);
    if (topicIds.length === 0) {
      return { ok: true };
    }

    // Get all question IDs for these topics
    const { data: qRows, error: qErr } = await supabase
      .from("questions")
      .select("id")
      .in("topic_id", topicIds);

    if (qErr) {
      console.error("[resetSubjectProgress] questions", qErr.message);
      return { ok: false, message: "Nie udało się pobrać pytań." };
    }

    const questionIds = (qRows ?? []).map((q) => q.id as string);

    // Get all session IDs for this subject
    const { data: sessionRows } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", subjectId);

    const sessionIds = (sessionRows ?? []).map((s) => s.id as string);

    // Delete in parallel: session_answers, user_question_progress, topic_mastery_cache, learning_events, study_sessions
    const ops: Promise<unknown>[] = [];

    if (sessionIds.length > 0) {
      ops.push(
        supabase
          .from("session_answers")
          .delete()
          .eq("user_id", user.id)
          .in("session_id", sessionIds),
      );
    }

    if (questionIds.length > 0) {
      ops.push(
        supabase
          .from("user_question_progress")
          .delete()
          .eq("user_id", user.id)
          .in("question_id", questionIds),
      );
    }

    ops.push(
      supabase
        .from("topic_mastery_cache")
        .delete()
        .eq("user_id", user.id)
        .in("topic_id", topicIds),
    );

    if (sessionIds.length > 0) {
      ops.push(
        supabase
          .from("study_sessions")
          .delete()
          .eq("user_id", user.id)
          .eq("subject_id", subjectId),
      );
    }

    await Promise.all(ops);

    revalidatePath("/", "layout");

    return { ok: true };
  } catch (e) {
    console.error("[resetSubjectProgress]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
