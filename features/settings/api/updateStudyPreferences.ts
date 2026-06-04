"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  daily_goal: z.coerce.number().int().min(5).max(100),
  default_session_mode: z.enum(["inteligentna", "przeglad", "katalog"]),
  default_question_count: z.union([z.literal(10), z.literal(25), z.literal(50)]),
  show_session_timer: z.boolean().optional(),
  show_session_topics: z.boolean().optional(),
});

function roundGoal(n: number): number {
  return Math.round(n / 5) * 5;
}

export type UpdateStudyPrefsResult = { ok: true } | { ok: false; message: string };

export async function updateStudyPreferences(
  input: z.infer<typeof schema>,
): Promise<UpdateStudyPrefsResult> {
  const goal = Math.min(100, Math.max(5, roundGoal(input.daily_goal)));
  const parsed = schema.safeParse({ ...input, daily_goal: goal });
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Brak sesji." };

  const patch: Record<string, unknown> = {
    daily_goal: parsed.data.daily_goal,
    default_session_mode: parsed.data.default_session_mode,
    default_question_count: parsed.data.default_question_count,
    last_session_question_count: parsed.data.default_question_count,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.show_session_timer !== undefined) {
    patch.show_session_timer = parsed.data.show_session_timer;
  }
  if (parsed.data.show_session_topics !== undefined) {
    patch.show_session_topics = parsed.data.show_session_topics;
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Nie udało się zapisać preferencji." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
