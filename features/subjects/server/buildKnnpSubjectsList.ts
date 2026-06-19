import type { SubjectWithProgress } from "@/features/subjects/types";
import type { KnnpCatalogRows } from "@/features/shared/server/knnpCatalogCache";
import { getTopicDisplaySubjectIds } from "@/features/session/server/sharedSubjects";

const EXCLUDED_SHORT_NAMES = new Set(["OSCE"]);

export function buildKnnpSubjectsList(
  catalog: KnnpCatalogRows,
  answeredPerSubject?: Map<string, number>,
  lastStudiedPerSubject?: Map<string, string>,
  dueReviewsPerSubject?: Map<string, number>,
): {
  subjects: SubjectWithProgress[];
  totalQuestionCount: number;
} {
  const { subjectRows, topicRows } = catalog;
  // Per-subject agregaty: liczba topiców i suma pytań (po cached `question_count`).
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
    // Liczba pytań i działów: wyłącznie kanoniczne repozytorium treści (np. farmakologia).
    let questionCount = 0;
    let topicCount = 0;
    for (const displayId of getTopicDisplaySubjectIds(row.id)) {
      const bucket = agg.get(displayId);
      questionCount += bucket?.questionSum ?? 0;
      topicCount += bucket?.topicCount ?? 0;
    }
    const answeredUnique = answeredPerSubject?.get(row.id) ?? 0;
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
        ? Math.round((answeredUnique / questionCount) * 100)
        : 0,
      last_studied_at: lastStudiedPerSubject?.get(row.id) ?? null,
      due_reviews: dueReviewsPerSubject?.get(row.id) ?? 0,
    };
  });

  return { subjects, totalQuestionCount };
}
