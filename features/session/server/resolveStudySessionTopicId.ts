import type { SupabaseClient } from "@supabase/supabase-js";
import { isVirtualThemeTopicId } from "@/lib/content/virtualThemeTopics";

/**
 * `study_sessions.topic_id` ma FK do `topics(id)`.
 * Wirtualne kafelki rocznikowe (np. biofizyka-THEME-2025) mają cień w `topics`;
 * gdy brak wiersza — zapisujemy NULL, żeby sesja wystartowała.
 */
export async function resolveStudySessionTopicId(
  supabase: SupabaseClient,
  topicId: string | undefined,
): Promise<string | null> {
  if (!topicId) return null;

  const { data, error } = await supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .maybeSingle();

  if (error) {
    console.error("[resolveStudySessionTopicId]", error.message);
    return isVirtualThemeTopicId(topicId) ? null : topicId;
  }

  if (data?.id) return topicId;

  if (isVirtualThemeTopicId(topicId)) {
    console.warn(
      `[resolveStudySessionTopicId] missing shadow topic row for ${topicId}`,
    );
    return null;
  }

  return topicId;
}
