"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  totalQuestions: z.number().int().min(1),
});

export type CreateOsceTopicSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; message: string };

export async function createOsceTopicSession(
  raw: z.infer<typeof schema>,
): Promise<CreateOsceTopicSessionResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane sesji." };
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

    const { data: inserted, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject_id: parsed.data.subjectId,
        mode: "osce_topic",
        total_questions: parsed.data.totalQuestions,
      })
      .select("id")
      .single();

    if (error || !inserted?.id) {
      console.error("[createOsceTopicSession]", error?.message);
      return { ok: false, message: "Nie udało się utworzyć sesji." };
    }

    return { ok: true, sessionId: inserted.id as string };
  } catch (e) {
    console.error("[createOsceTopicSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
