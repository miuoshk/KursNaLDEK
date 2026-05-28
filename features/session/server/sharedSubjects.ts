// Przedmioty współdzielone między kierunkami studiów.
//
// Model kanoniczny: jeden `canonicalId` trzyma całą treść (topics + questions),
// a track-specific ID (`stoma-*`, `lek-*`) to powłoka UI / entitlement.

type CanonicalSharedSubject = {
  canonicalId: string;
  trackSubjectIds: readonly string[];
};

const CANONICAL_SHARED_SUBJECTS: CanonicalSharedSubject[] = [
  {
    canonicalId: "anatomia",
    trackSubjectIds: ["stoma-anatomia", "lek-anatomia"],
  },
  {
    canonicalId: "histologia",
    trackSubjectIds: ["stoma-histologia", "lek-histologia"],
  },
  {
    canonicalId: "biofizyka",
    trackSubjectIds: ["stoma-biofizyka", "lek-biofizyka"],
  },
  {
    canonicalId: "fizjologia",
    trackSubjectIds: ["stoma-fizjologia", "lek-fizjologia"],
  },
  {
    canonicalId: "mikrobiologia",
    trackSubjectIds: ["stoma-mikrobio", "lek-mikrobio"],
  },
  {
    canonicalId: "farmakologia",
    trackSubjectIds: ["stoma-farmakologia", "lek-farmakologia"],
  },
];

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
  return findCanonicalShared(subjectId) !== null;
}

export function isSubjectInScope(subjectId: string, candidateSubjectId: string): boolean {
  return getSubjectScopeIds(subjectId).includes(candidateSubjectId);
}

/** Powłoki UI (stoma-*, lek-*) dla treści trzymanego pod subjectem kanonicznym. */
export function getTrackShellsForContentSubject(contentSubjectId: string): string[] {
  const canonical = findCanonicalShared(contentSubjectId);
  if (canonical) return [...canonical.trackSubjectIds];
  return [contentSubjectId];
}
