import type { SupabaseClient } from "@supabase/supabase-js";

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchSubjectQuestionIds(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<string[]> {
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);

  if (te) {
    console.error("[fetchSubjectQuestionIds] topics", te.message);
    return [];
  }

  const topicIds = (topicRows ?? []).map((t) => t.id);
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);

  if (error) {
    console.error("[fetchSubjectQuestionIds] questions", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}

export async function fetchTopicQuestionIds(
  supabase: SupabaseClient,
  topicId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_active", true);

  if (error) {
    console.error("[fetchTopicQuestionIds]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id as string);
}
