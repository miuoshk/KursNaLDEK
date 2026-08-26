import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeTopicMasteryRow,
  TOPIC_MASTERY_CACHE_SELECT,
} from "@/features/session/lib/antares/topicMasteryCacheDb";
import type { StatisticsPayload } from "@/features/statistics/types";

type TopicJoin = {
  name?: string;
  subject_id?: string;
  subjects?: { name?: string } | { name?: string }[] | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Jedno źródło prawdy dla słabych obszarów w statystykach, pulpicie i ANTARES.
 * Cache łączy pokrycie, trafność, retrievability i leechy; nie sprowadza
 * opanowania do historycznej średniej poprawnych odpowiedzi.
 */
export async function masteryFromCache(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  subjectMastery: StatisticsPayload["subjectMastery"];
  weakTopics: StatisticsPayload["weakTopics"];
  predictedReadiness: number | null;
}> {
  const { data, error } = await supabase
    .from("topic_mastery_cache")
    .select(
      `${TOPIC_MASTERY_CACHE_SELECT}, topics!inner(name, subject_id, is_inbox, subjects!inner(name))`,
    )
    .eq("user_id", userId)
    .eq("topics.is_inbox", false);

  if (error) {
    console.error("[masteryFromCache]", error.message);
    return { subjectMastery: [], weakTopics: [], predictedReadiness: null };
  }

  const subjects = new Map<
    string,
    { name: string; weightedMastery: number; weight: number }
  >();
  const topics: Array<{
    topicId: string;
    topicName: string;
    subjectId: string;
    accuracy: number;
    answers: number;
    mastery: number;
    weaknessRank: number | null;
  }> = [];

  for (const raw of data ?? []) {
    const normalized = normalizeTopicMasteryRow(raw as Record<string, unknown>);
    const topic = firstJoin(
      (raw as { topics?: TopicJoin | TopicJoin[] }).topics,
    );
    const subject = firstJoin(topic?.subjects);
    const subjectId = topic?.subject_id ?? "";
    if (!subjectId) continue;

    const weight = Math.max(1, normalized.total_answered);
    const current = subjects.get(subjectId) ?? {
      name: subject?.name ?? subjectId,
      weightedMastery: 0,
      weight: 0,
    };
    current.weightedMastery += normalized.mastery_score * weight;
    current.weight += weight;
    subjects.set(subjectId, current);

    topics.push({
      topicId: normalized.topic_id,
      topicName: topic?.name ?? normalized.topic_id,
      subjectId,
      accuracy: normalized.accuracy,
      answers: normalized.total_answered,
      mastery: normalized.mastery_score,
      weaknessRank: normalized.weakness_rank,
    });
  }

  const subjectMastery = [...subjects.entries()].map(([subjectId, value]) => ({
    subjectId,
    subjectName: value.name,
    mastery: value.weight > 0 ? value.weightedMastery / value.weight : 0,
  }));

  const weakTopics = topics
    .filter((topic) => topic.answers >= 3)
    .sort((a, b) => {
      const rankA = a.weaknessRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.weaknessRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || a.mastery - b.mastery;
    })
    .slice(0, 5)
    .map(({ topicId, topicName, subjectId, accuracy, answers }) => ({
      topicId,
      topicName,
      subjectId,
      accuracy,
      answers,
    }));

  const readinessWeight = subjectMastery.reduce(
    (sum, item) => sum + (subjects.get(item.subjectId)?.weight ?? 0),
    0,
  );
  const predictedReadiness =
    readinessWeight > 0
      ? subjectMastery.reduce(
          (sum, item) =>
            sum + item.mastery * (subjects.get(item.subjectId)?.weight ?? 0),
          0,
        ) / readinessWeight
      : null;

  return { subjectMastery, weakTopics, predictedReadiness };
}
