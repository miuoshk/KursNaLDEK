import type { SupabaseClient } from "@supabase/supabase-js";

/** Przelicza `topics.question_count` z aktywnych pytań (`is_active = true`). */
export async function syncTopicQuestionCount(
  supabase: SupabaseClient,
  topicId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("is_active", true);

  if (countError) {
    console.error("[syncTopicQuestionCount] count", countError.message);
    return;
  }

  const { error: updateError } = await supabase
    .from("topics")
    .update({ question_count: count ?? 0 })
    .eq("id", topicId);

  if (updateError) {
    console.error("[syncTopicQuestionCount] update", updateError.message);
  }
}

export async function syncTopicQuestionCounts(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<void> {
  const unique = [...new Set(topicIds.filter(Boolean))];
  await Promise.all(unique.map((id) => syncTopicQuestionCount(supabase, id)));
}
