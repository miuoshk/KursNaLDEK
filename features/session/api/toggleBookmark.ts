"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type ToggleBookmarkResult =
  | { ok: true; saved: boolean }
  | { ok: false; message: string };

export async function toggleBookmark(
  questionId: string,
): Promise<ToggleBookmarkResult> {
  const t = await getTranslations("session");
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, message: t("errors.mustLogin") };
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_questions")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    // Remove bookmark
    const { error } = await supabase
      .from("saved_questions")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, message: t("errors.removeBookmarkFailed") };
    return { ok: true, saved: false };
  }

  // Add bookmark
  const { error } = await supabase
    .from("saved_questions")
    .insert({ user_id: user.id, question_id: questionId });
  if (error) return { ok: false, message: t("errors.saveBookmarkFailed") };
  return { ok: true, saved: true };
}
