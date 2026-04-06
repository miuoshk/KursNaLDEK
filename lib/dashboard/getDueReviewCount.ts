import type { SupabaseClient } from "@supabase/supabase-js";

/** Pytania z zaplanowanym powtórką (next_review <= teraz). */
export async function getDueReviewCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("user_question_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("next_review", "is", null)
    .lte("next_review", new Date().toISOString());

  if (error) {
    console.error("[getDueReviewCount]", error.message);
    return 0;
  }
  return count ?? 0;
}
