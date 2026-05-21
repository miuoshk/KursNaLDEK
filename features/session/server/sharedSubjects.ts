// Przedmioty współdzielone między kierunkami studiów.
//
// Model kanoniczny: jeden `canonicalId` trzyma całą treść (topics + questions),
// a track-specific ID (`stoma-*`, `lek-*`) to powłoka UI / entitlement.
//
// Legacy anatomia: treść w dwóch subjectach (`stoma-anatomia`, `lek-anatomia`)
// z parami tematów `ANA-XXX` ↔ `LEK-ANA-XXX` — migracja do `anatomia` w toku.

type CanonicalSharedSubject = {
  canonicalId: string;
  trackSubjectIds: readonly string[];
};

const CANONICAL_SHARED_SUBJECTS: CanonicalSharedSubject[] = [
  {
    canonicalId: "histologia",
    trackSubjectIds: ["stoma-histologia", "lek-histologia"],
  },
  {
    canonicalId: "biofizyka",
    trackSubjectIds: ["stoma-biofizyka", "lek-biofizyka"],
  },
];

const SHARED_ANATOMY_SUBJECT_IDS = ["stoma-anatomia", "lek-anatomia"] as const;
type SharedAnatomySubjectId = (typeof SHARED_ANATOMY_SUBJECT_IDS)[number];

function isSharedAnatomySubject(subjectId: string): subjectId is SharedAnatomySubjectId {
  return (SHARED_ANATOMY_SUBJECT_IDS as readonly string[]).includes(subjectId);
}

function findCanonicalShared(subjectId: string): CanonicalSharedSubject | null {
  return (
    CANONICAL_SHARED_SUBJECTS.find(
      (cfg) =>
        cfg.canonicalId === subjectId ||
        cfg.trackSubjectIds.includes(subjectId),
    ) ?? null
  );
}

export function getSubjectScopeIds(subjectId: string): string[] {
  const canonical = findCanonicalShared(subjectId);
  if (canonical) {
    return [
      canonical.canonicalId,
      ...canonical.trackSubjectIds.filter((id) => id !== canonical.canonicalId),
    ];
  }
  if (isSharedAnatomySubject(subjectId)) {
    return [...SHARED_ANATOMY_SUBJECT_IDS];
  }
  return [subjectId];
}

/** Rozszerza listę subjectów z katalogu o kanoniczne repozytoria treści (np. `histologia`). */
export function expandTopicSubjectIdsForCatalog(trackSubjectIds: string[]): string[] {
  const expanded = new Set<string>();
  for (const sid of trackSubjectIds) {
    for (const scopeId of getSubjectScopeIds(sid)) {
      expanded.add(scopeId);
    }
  }
  return [...expanded];
}

/** Z którego subject_id wczytywać listę działów w UI danego przedmiotu. */
export function getTopicDisplaySubjectIds(subjectId: string): string[] {
  const canonical = findCanonicalShared(subjectId);
  if (canonical && canonical.trackSubjectIds.includes(subjectId)) {
    return [canonical.canonicalId];
  }
  return [subjectId];
}

export function hasSharedScope(subjectId: string): boolean {
  return findCanonicalShared(subjectId) !== null || isSharedAnatomySubject(subjectId);
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
