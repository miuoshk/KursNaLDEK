"use server";

import { createClient } from "@/lib/supabase/server";

export async function isQuestionSaved(questionId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("saved_questions")
    .select("id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  return Boolean(data);
}
