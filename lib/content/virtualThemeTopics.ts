/**
 * Wirtualne „działy” rocznikowe — pytania zostają przy swoim `topic_id`,
 * a widok rocznika filtruje pulę po `questions.theme_label`.
 *
 * Kolejne roczniki: dopisz definicję z nowym `themeLabel` (np. „2024”).
 */

export type VirtualThemeTopicDefinition = {
  /** Kanoniczny subject treści (np. biofizyka). */
  contentSubjectId: string;
  /** Wartość `questions.theme_label` (np. „2025”). */
  themeLabel: string;
  /** Etykieta na kafelku tematu. */
  displayName: string;
  /** Kolejność na liście — wyższa wartość = niżej (po działach merytorycznych). */
  displayOrder: number;
};

export const VIRTUAL_THEME_TOPIC_DEFINITIONS: VirtualThemeTopicDefinition[] = [
  {
    contentSubjectId: "biofizyka",
    themeLabel: "2025",
    displayName: "2025",
    displayOrder: 100,
  },
];

export function buildVirtualThemeTopicId(
  contentSubjectId: string,
  themeLabel: string,
): string {
  return `${contentSubjectId}-THEME-${themeLabel}`;
}

export function parseVirtualThemeTopicId(
  topicId: string,
): VirtualThemeTopicDefinition | null {
  return (
    VIRTUAL_THEME_TOPIC_DEFINITIONS.find(
      (def) =>
        buildVirtualThemeTopicId(def.contentSubjectId, def.themeLabel) ===
        topicId,
    ) ?? null
  );
}

export function isVirtualThemeTopicId(topicId: string): boolean {
  return parseVirtualThemeTopicId(topicId) != null;
}

export function getVirtualThemeTopicsForContentSubject(
  contentSubjectId: string,
): VirtualThemeTopicDefinition[] {
  return VIRTUAL_THEME_TOPIC_DEFINITIONS.filter(
    (def) => def.contentSubjectId === contentSubjectId,
  );
}
