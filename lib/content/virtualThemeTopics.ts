/**
 * Wirtualne „działy” rocznikowe — pytania zostają przy swoim `topic_id`,
 * a widok rocznika filtruje pulę po `questions.theme_label`.
 *
 * Id cienia w `topics`: `{contentSubjectId}-THEME-{themeLabel}`
 * (np. `anatomia-THEME-2026`). Wystarczy wiersz w bazie + `theme_label`
 * na pytaniach; lista poniżej to tylko nadpisania etykiety / kolejności.
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

/** `anatomia-THEME-2026` → subject `anatomia`, etykieta `2026`. */
const VIRTUAL_THEME_TOPIC_ID_RE = /^(.+)-THEME-(.+)$/;

export const VIRTUAL_THEME_TOPIC_DEFINITIONS: VirtualThemeTopicDefinition[] = [
  {
    contentSubjectId: "biofizyka",
    themeLabel: "2025",
    displayName: "2025",
    displayOrder: 100,
  },
  {
    contentSubjectId: "biofizyka",
    themeLabel: "2026",
    displayName: "2026",
    displayOrder: 13,
  },
  {
    contentSubjectId: "anatomia",
    themeLabel: "2026",
    displayName: "2026",
    displayOrder: 12,
  },
  {
    contentSubjectId: "histologia",
    themeLabel: "2026",
    displayName: "2026",
    displayOrder: 23,
  },
  {
    contentSubjectId: "stoma-zakazne",
    themeLabel: "2026",
    displayName: "2026",
    displayOrder: 24,
  },
  {
    contentSubjectId: "farmakologia",
    themeLabel: "2026",
    displayName: "2026",
    displayOrder: 20,
  },
];

export function buildVirtualThemeTopicId(
  contentSubjectId: string,
  themeLabel: string,
): string {
  return `${contentSubjectId}-THEME-${themeLabel}`;
}

export function isVirtualThemeTopicId(topicId: string): boolean {
  return VIRTUAL_THEME_TOPIC_ID_RE.test(topicId);
}

export function parseVirtualThemeTopicId(
  topicId: string,
): VirtualThemeTopicDefinition | null {
  const match = topicId.match(VIRTUAL_THEME_TOPIC_ID_RE);
  if (!match) return null;
  const contentSubjectId = match[1];
  const themeLabel = match[2];
  const override = VIRTUAL_THEME_TOPIC_DEFINITIONS.find(
    (def) =>
      def.contentSubjectId === contentSubjectId && def.themeLabel === themeLabel,
  );
  return (
    override ?? {
      contentSubjectId,
      themeLabel,
      displayName: themeLabel,
      displayOrder: 100,
    }
  );
}

export function getVirtualThemeTopicsForContentSubject(
  contentSubjectId: string,
): VirtualThemeTopicDefinition[] {
  return VIRTUAL_THEME_TOPIC_DEFINITIONS.filter(
    (def) => def.contentSubjectId === contentSubjectId,
  );
}

type TopicShadowRow = {
  id: string;
  name?: string | null;
  display_order?: number | null;
};

/**
 * Definicje z konfiguracji + cienie `*-THEME-*` z `topics`.
 * Cień w bazie wystarczy, żeby kafelek zadziałał (bez dopisywania do listy).
 */
export function mergeVirtualThemeDefinitions(
  contentSubjectId: string,
  topicRows: TopicShadowRow[],
): VirtualThemeTopicDefinition[] {
  const byKey = new Map<string, VirtualThemeTopicDefinition>();
  const keyOf = (def: VirtualThemeTopicDefinition) =>
    `${def.contentSubjectId}\0${def.themeLabel}`;

  for (const def of getVirtualThemeTopicsForContentSubject(contentSubjectId)) {
    byKey.set(keyOf(def), def);
  }

  for (const row of topicRows) {
    const parsed = parseVirtualThemeTopicId(row.id);
    if (!parsed || parsed.contentSubjectId !== contentSubjectId) continue;
    const key = keyOf(parsed);
    const existing = byKey.get(key);
    byKey.set(key, {
      ...(existing ?? parsed),
      displayName: row.name?.trim() || existing?.displayName || parsed.displayName,
      displayOrder: row.display_order ?? existing?.displayOrder ?? parsed.displayOrder,
    });
  }

  return [...byKey.values()];
}
