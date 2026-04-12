import type { SupabaseClient } from "@supabase/supabase-js";

export type WeakPoint = {
  topicId: string;
  topicName: string;
  subjectName: string;
  subjectId: string;
  masteryScore: number;
};

export async function loadWeakPoints(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeakPoint[]> {
  const { data: rows } = await supabase
    .from("topic_mastery_cache")
    .select(
      "mastery_score, topic_id, topics!inner(name, subject_id, subjects!inner(name))",
    )
    .eq("user_id", userId)
    .lt("mastery_score", 0.8)
    .order("mastery_score", { ascending: true })
    .limit(5);

  return (rows ?? []).map((row: Record<string, unknown>) => {
    const topic = row.topics as {
      name: string;
      subject_id: string;
      subjects: { name: string } | { name: string }[];
    };
    const subObj = Array.isArray(topic.subjects)
      ? topic.subjects[0]
      : topic.subjects;

    return {
      topicId: row.topic_id as string,
      topicName: topic.name,
      subjectName: subObj?.name ?? "Przedmiot",
      subjectId: topic.subject_id,
      masteryScore: Math.round(Number(row.mastery_score ?? 0) * 100),
    };
  });
}
