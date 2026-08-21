import type { SupabaseClient } from "@supabase/supabase-js";

/** Przelicza `topics.question_count` i `question_count_cem` przez RPC `refresh_topic_counts`. */
export async function syncTopicQuestionCount(
  supabase: SupabaseClient,
  topicId: string,
): Promise<void> {
  await syncTopicQuestionCounts(supabase, [topicId]);
}

export async function syncTopicQuestionCounts(
  supabase: SupabaseClient,
  topicIds: string[],
): Promise<void> {
  const unique = [...new Set(topicIds.filter(Boolean))];
  if (unique.length === 0) return;

  const { error } = await supabase.rpc("refresh_topic_counts", {
    p_topic_ids: unique,
  });

  if (error) {
    console.error("[syncTopicQuestionCounts] rpc", error.message);
  }
}
