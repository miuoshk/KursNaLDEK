/** Wiersz cache opanowania tematu (kształt wewnętrzny aplikacji). */
export type TopicMasteryCacheRow = {
  topic_id: string;
  total_questions: number;
  seen: number;
  coverage: number;
  total_answered: number;
  total_correct: number;
  accuracy: number;
  avg_retrievability: number;
  mastery_score: number;
  weakness_rank: number | null;
  trend: string;
  accuracy_last_7d: number | null;
  questions_last_7d: number;
  leech_count: number;
};

/** Kolumny tabeli `topic_mastery_cache` w produkcji. */
export const TOPIC_MASTERY_CACHE_SELECT =
  "topic_id, total_questions, seen_questions, coverage_ratio, total_answers, correct_answers, accuracy, avg_retrievability, mastery_score, weakness_rank, trend, accuracy_last_7d, questions_last_7d, leech_count";

export function normalizeTopicMasteryRow(
  raw: Record<string, unknown>,
): TopicMasteryCacheRow {
  const total = Number(raw.total_questions ?? 0);
  const seen = Number(raw.seen_questions ?? raw.seen ?? 0);
  const coverageRaw = raw.coverage_ratio ?? raw.coverage;
  const coverage =
    coverageRaw != null
      ? Number(coverageRaw)
      : total > 0
        ? seen / total
        : 0;

  return {
    topic_id: String(raw.topic_id),
    total_questions: total,
    seen,
    coverage: Math.min(1, Math.max(0, coverage)),
    total_answered: Number(raw.total_answers ?? raw.total_answered ?? 0),
    total_correct: Number(raw.correct_answers ?? raw.total_correct ?? 0),
    accuracy: Number(raw.accuracy ?? 0),
    avg_retrievability: Number(raw.avg_retrievability ?? 0),
    mastery_score: Number(raw.mastery_score ?? 0),
    weakness_rank:
      raw.weakness_rank != null ? Number(raw.weakness_rank) : null,
    trend: String(raw.trend ?? "stable"),
    accuracy_last_7d:
      raw.accuracy_last_7d != null ? Number(raw.accuracy_last_7d) : null,
    questions_last_7d: Number(raw.questions_last_7d ?? 0),
    leech_count: Number(raw.leech_count ?? 0),
  };
}

export function toTopicMasteryUpsert(
  userId: string,
  topicId: string,
  row: Omit<TopicMasteryCacheRow, "topic_id">,
): Record<string, unknown> {
  return {
    user_id: userId,
    topic_id: topicId,
    total_questions: row.total_questions,
    seen_questions: row.seen,
    coverage_ratio: row.coverage,
    total_answers: row.total_answered,
    correct_answers: row.total_correct,
    accuracy: row.accuracy,
    avg_retrievability: row.avg_retrievability,
    mastery_score: row.mastery_score,
    trend: row.trend,
    accuracy_last_7d: row.accuracy_last_7d,
    questions_last_7d: row.questions_last_7d,
    leech_count: row.leech_count,
    calculated_at: new Date().toISOString(),
  };
}
