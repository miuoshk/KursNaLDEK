/**
 * Łamie inline listy w treści pytania/wyjaśnienia (wzorce z kolokwiów / zaliczeń):
 * 1. … 2. … | 1) … 2) … | a) … b) … | I) … II) …
 *
 * Nie dotyka options JSONB. Wymaga min. 2 punktów tego samego typu w polu.
 */

const PAREN_ENUM = /\([\da-zA-Z]+[-–][\da-zA-Z]*$/;

function isParenRangeBefore(text: string, index: number): boolean {
  const slice = text.slice(Math.max(0, index - 12), index);
  return PAREN_ENUM.test(slice);
}

function insertBreaksBeforeIndices(text: string, indices: number[]): string {
  const unique = [...new Set(indices)].sort((a, b) => b - a);
  let out = text;
  for (const idx of unique) {
    if (idx <= 0) continue;
    let start = idx;
    while (start > 0 && /[\s;]/.test(out[start - 1]!)) start -= 1;
    if (start > 0 && out[start - 1] === "\n") continue;
    let end = idx;
    while (end < out.length && out[end] === " ") end += 1;
    out = `${out.slice(0, start)}\n${out.slice(end)}`;
  }
  return out;
}

function collectMatchIndices(text: string, re: RegExp): number[] {
  const indices: number[] = [];
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  for (const m of text.matchAll(global)) {
    if (m.index === undefined) continue;
    if (isParenRangeBefore(text, m.index)) continue;
    indices.push(m.index);
  }
  return indices;
}

function breakSeries(text: string, re: RegExp, minCount: number): string {
  const indices = collectMatchIndices(text, re);
  if (indices.length < minCount) return text;
  return insertBreaksBeforeIndices(text, indices);
}

/** `; b)` → `;\nb)` gdy w tekście jest seria literowa */
function breakSemicolonLetterItems(text: string): string {
  const letterParen = /;\s*([a-z])\)\s*/gi;
  const hits = [...text.matchAll(/(?<![a-zA-Z])([a-z])\)\s*/gi)];
  if (hits.length < 2) return text;
  return text.replace(letterParen, ";\n$1) ");
}

/** Po dwukropku przed pierwszym punktem serii */
function breakAfterColonIntro(text: string): string {
  let s = text;
  const hasArabicDot = (s.match(/(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g) ?? []).length >= 2;
  const hasArabicParen = (s.match(/(?<!\d)(\d{1,2})\)\s+/g) ?? []).length >= 2;
  const hasLetter = (s.match(/(?<![a-zA-Z])([a-z])\)\s+/gi) ?? []).length >= 2;
  const hasRoman = (s.match(/\b([IVX]{1,4})\)\s+/gi) ?? []).length >= 2;

  if (hasArabicDot) {
    s = s.replace(/:\s+(?=\d{1,2}\.\s)/g, ":\n");
  }
  if (hasArabicParen) {
    s = s.replace(/:\s+(?=\d{1,2}\)\s)/g, ":\n");
  }
  if (hasLetter) {
    s = s.replace(/:\s+(?=[a-z]\)\s)/gi, ":\n");
  }
  if (hasRoman) {
    s = s.replace(/:\s+(?=[IVX]{1,4}\)\s)/gi, ":\n");
  }
  return s;
}

const LIST_MARKER_IN_SEGMENT =
  /\b[IVX]{1,4}\)|(?<!\d)(\d{1,2})[.)]|(?<![a-zA-Z])([a-z])\)/i;

/** Po ostatnim punkcie listy — enter przed dalszym tekstem (np. „Grupy:”, „Prawidłowe”). */
function breakAfterListBlock(text: string): string {
  return text.replace(
    /([.!?;])([ \t]+)(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu,
    (match, punct, sp, offset, whole) => {
      const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
      const segment = whole.slice(lineStart, offset);
      if (!LIST_MARKER_IN_SEGMENT.test(segment)) {
        return match;
      }
      return `${punct}\n\n`;
    },
  );
}

/** Nagłówki typu „Temperatury:”, „Grupy:” przed kolejną serią a) b) … */
function breakLabeledSublist(text: string): string {
  let s = text.replace(
    /([.!?]\s*|\n\n|^)([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\s]{1,30}):\s*(?=[a-z]\)\s)/gi,
    "$1$2:\n",
  );
  // Krótkie etykiety po kropce: „mitis. Grupy:”
  s = s.replace(
    /([.!?])\s+(Grupy|Prawidłowe|Temperatury|Opcje|Wskazówki):/gi,
    "$1\n\n$2:",
  );
  return s;
}

export function normalizeQuestionListText(text: string): string {
  if (!text?.trim() || text.length < 25) return text;

  let s = text.replace(/\r\n/g, "\n");

  s = breakSemicolonLetterItems(s);
  s = breakAfterColonIntro(s);
  s = breakLabeledSublist(s);

  // Kolejność: rzymskie → 1) → a) → 1. (arabskie z kropką najbardziej podatne na fałszywe trafienia)
  s = breakSeries(s, /\b([IVX]{1,4})\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(\d{1,2})\)\s+/g, 2);
  s = breakSeries(s, /(?<![a-zA-Z])([a-z])\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g, 2);

  s = breakAfterListBlock(s);

  return s.replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeQuestionListFields(row: {
  text: string;
  explanation: string;
}): { text: string; explanation: string; changed: boolean } {
  const text = normalizeQuestionListText(row.text);
  const explanation = normalizeQuestionListText(row.explanation);
  return {
    text,
    explanation,
    changed: text !== row.text || explanation !== row.explanation,
  };
}
