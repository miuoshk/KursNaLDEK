// Anatomia jest jednym przedmiotem dla obu kierunków studiów —
// pytania siedzą w dwóch subjectach (`stoma-anatomia` i `lek-anatomia`),
// a tematy w parach `ANA-XXX` ↔ `LEK-ANA-XXX`. Helpery poniżej domykają
// te dwie reprezentacje w jeden wspólny pool, niezależnie od track usera.

const SHARED_ANATOMY_SUBJECT_IDS = ["stoma-anatomia", "lek-anatomia"] as const;
type SharedAnatomySubjectId = (typeof SHARED_ANATOMY_SUBJECT_IDS)[number];

function isSharedAnatomySubject(subjectId: string): subjectId is SharedAnatomySubjectId {
  return (SHARED_ANATOMY_SUBJECT_IDS as readonly string[]).includes(subjectId);
}

export function getSubjectScopeIds(subjectId: string): string[] {
  if (isSharedAnatomySubject(subjectId)) {
    return [...SHARED_ANATOMY_SUBJECT_IDS];
  }
  return [subjectId];
}

export function hasSharedScope(subjectId: string): boolean {
  return isSharedAnatomySubject(subjectId);
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

// Klucz "rodziny" tematu — jednakowy dla `ANA-CZA` i `LEK-ANA-CZA`,
// żeby można było po nim grupować topiki z obu subjectów.
export function getTopicFamilyKey(topicId: string): string {
  if (topicId.startsWith("LEK-ANA-")) return topicId.slice("LEK-".length);
  return topicId;
}
