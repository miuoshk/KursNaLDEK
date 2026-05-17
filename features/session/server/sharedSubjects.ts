const SHARED_ANATOMY_SUBJECT_IDS = ["stoma-anatomia", "lek-anatomia"] as const;

export function getSubjectScopeIds(subjectId: string): string[] {
  if (SHARED_ANATOMY_SUBJECT_IDS.includes(subjectId as (typeof SHARED_ANATOMY_SUBJECT_IDS)[number])) {
    return [...SHARED_ANATOMY_SUBJECT_IDS];
  }
  return [subjectId];
}

export function isSubjectInScope(subjectId: string, candidateSubjectId: string): boolean {
  return getSubjectScopeIds(subjectId).includes(candidateSubjectId);
}

export function getAnatomyPeerTopicId(topicId: string): string | null {
  if (topicId.startsWith("LEK-ANA-")) {
    return topicId.replace(/^LEK-ANA-/, "ANA-");
  }
  if (topicId.startsWith("ANA-")) {
    return `LEK-${topicId}`;
  }
  return null;
}
