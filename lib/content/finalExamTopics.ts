/** Worek zaliczenia (np. ANA-ZAL) — kafelek z własnymi wierszami + pytaniami z kafelków rocznikowych, bez kopiowania rekordów. */

const FINAL_EXAM_TOPIC_IDS = new Set(["ANA-ZAL"]);

export function isFinalExamTopicId(topicId: string): boolean {
  return FINAL_EXAM_TOPIC_IDS.has(topicId);
}

/** Kanoniczny subject treści dla worka zaliczenia. */
export function getFinalExamContentSubjectId(topicId: string): string | null {
  if (topicId === "ANA-ZAL") return "anatomia";
  return null;
}
