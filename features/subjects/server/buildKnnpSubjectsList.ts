import type { SubjectWithProgress } from "@/features/subjects/types";
import type { KnnpCatalogRows } from "@/features/shared/server/knnpCatalogCache";

const EXCLUDED_SHORT_NAMES = new Set(["OSCE"]);

export function buildKnnpSubjectsList(
  catalog: KnnpCatalogRows,
  answeredPerSubject?: Map<string, Set<string>>,
  lastStudiedPerSubject?: Map<string, string>,
): {
  subjects: SubjectWithProgress[];
  totalQuestionCount: number;
} {
  const { subjectRows, topicRows } = catalog;
  const agg = new Map<string, { topicCount: number; questionSum: number }>();
  for (const row of topicRows ?? []) {
    const sid = row.subject_id as string;
    const cur = agg.get(sid) ?? { topicCount: 0, questionSum: 0 };
    cur.topicCount += 1;
    cur.questionSum += Number(row.question_count ?? 0);
    agg.set(sid, cur);
  }

  const knnpRows = subjectRows.filter(
    (row) => !EXCLUDED_SHORT_NAMES.has(row.short_name),
  );

  let totalQuestionCount = 0;
  const subjects: SubjectWithProgress[] = knnpRows.map((row) => {
    const a = agg.get(row.id);
    const questionCount = a?.questionSum ?? 0;
    const topicCount = a?.topicCount ?? 0;
    totalQuestionCount += questionCount;

    return {
      id: row.id,
      name: row.name,
      short_name: row.short_name,
      icon_name: row.icon_name ?? "book-open",
      year: row.year,
      track: row.track,
      product: row.product,
      display_order: row.display_order ?? 0,
      question_count: questionCount,
      topic_count: topicCount,
      mastery_percentage: questionCount > 0
        ? Math.round((answeredPerSubject?.get(row.id)?.size ?? 0) / questionCount * 100)
        : 0,
      last_studied_at: lastStudiedPerSubject?.get(row.id) ?? null,
      due_reviews: 0,
    };
  });

  return { subjects, totalQuestionCount };
}
