/**
 * Łamie inline listy w treści pytania i wyjaśnieniu (wzorce z kolokwiów / zaliczeń).
 * 1. … 2. … | 1) … 2) … | a) … b) … | I) … II) …
 *
 * Nie dotyka options JSONB. Wymaga min. 2 punktów tego samego typu w polu.
 */

const PAREN_ENUM = /\([\da-zA-Z]+[-–][\da-zA-Z]*$/;
const MATH_PLACEHOLDER = "\uE000";

function maskInlineMath(text: string): { masked: string; segments: string[] } {
  const segments: string[] = [];
  const masked = text.replace(/\$[^$\n]+\$/g, (match) => {
    const id = segments.length;
    segments.push(match);
    return `${MATH_PLACEHOLDER}${id}${MATH_PLACEHOLDER}`;
  });
  return { masked, segments };
}

function unmaskInlineMath(text: string, segments: string[]): string {
  return text.replace(
    new RegExp(`${MATH_PLACEHOLDER}(\\d+)${MATH_PLACEHOLDER}`, "g"),
    (_, id) => segments[Number(id)] ?? "",
  );
}

function isParenRangeBefore(text: string, index: number): boolean {
  const slice = text.slice(Math.max(0, index - 12), index);
  return PAREN_ENUM.test(slice);
}

function isInsideParentheses(text: string, index: number): boolean {
  let depth = 0;
  for (let i = 0; i < index; i += 1) {
    const ch = text[i]!;
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
  }
  return depth > 0;
}

/** np. f(c), (c), ( s) — nie punkt listy a) b) */
function isFunctionArgumentContext(text: string, index: number): boolean {
  let i = index - 1;
  while (i >= 0 && text[i] === " ") i -= 1;
  if (i >= 0 && text[i] === "(") return true;
  if (i >= 0 && /[\/^=]/.test(text[i]!)) return true;
  return false;
}

/** np. W> 0., Q< 0., 6. 2 przemiany, f^ 4. — nie lista 1. 2. */
function isFalseArabicDotList(text: string, index: number): boolean {
  let i = index - 1;
  while (i >= 0 && text[i] === " ") i -= 1;
  if (i >= 0 && /[<>=^]/.test(text[i]!)) return true;
  const tail = text.slice(index);
  // CT 2. generacji / niż 1. generacja — numer w zdaniu, nie lista
  if (
    i >= 0 &&
    /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text[i]!) &&
    !/^\d{1,2}\.\s+(\*\*|\d)/.test(tail)
  ) {
    return true;
  }
  if (/^\d{1,2}\.\s+\d{1,2}(?:\s|[a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ(])/.test(tail)) {
    return true;
  }
  return false;
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
    if (isFunctionArgumentContext(text, m.index)) continue;
    if (re.source.includes("([a-z])") && isInsideParentheses(text, m.index)) continue;
    if (re.source.includes("\\d{1,2}") && re.source.includes("\\.")) {
      if (isFalseArabicDotList(text, m.index)) continue;
    }
    const prev = m.index > 0 ? text[m.index - 1] : "";
    // **(1) …** — nie łamać numeracji w nawiasie tuż po boldzie
    if (prev === "*" || prev === "_") continue;
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
  const hits = [...text.matchAll(/(?<![a-zA-Z=(])([a-z])\)\s+/gi)].filter(
    (m) => m.index !== undefined && !isFunctionArgumentContext(text, m.index),
  );
  if (hits.length < 2) return text;
  return text.replace(letterParen, ";\n$1) ");
}

/** Po dwukropku przed pierwszym punktem serii */
function breakAfterColonIntro(text: string): string {
  let s = text;
  const hasArabicDot = (s.match(/(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g) ?? []).length >= 2;
  const hasArabicParen = (s.match(/(?<!\d)(\d{1,2})\)\s+/g) ?? []).length >= 2;
  const hasLetter =
    [...s.matchAll(/(?<![a-zA-Z=(])([a-z])\)\s+/gi)].filter(
      (m) => m.index !== undefined && !isFunctionArgumentContext(s, m.index),
    ).length >= 2;
  const hasRoman = (s.match(/\b([IVX]{1,4})\)\s+/g) ?? []).length >= 2;
  const hasRomanDot = (s.match(/\b([IVX]{1,4})\.\s+/g) ?? []).length >= 2;

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
    s = s.replace(/:\s+(?=[IVX]{1,4}\)\s)/g, ":\n");
  }
  if (hasRomanDot) {
    s = s.replace(/:\s+(?=[IVX]{1,4}\.\s)/g, ":\n");
  }
  return s;
}

/** Po ostatnim punkcie listy — enter przed dalszym tekstem (np. „Grupy:”, „Prawidłowe”). */
function breakAfterListBlock(text: string): string {
  return text.replace(
    /([.!?;])([ \t]+)(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu,
    (match, punct, _sp, offset, whole) => {
      const lineStart = whole.lastIndexOf("\n", offset - 1) + 1;
      const segment = whole.slice(lineStart, offset);
      const tail = segment.split(";").pop()?.trim() ?? segment.trim();
      // Tylko gdy ostatnia klauzula zaczyna się od markera listy (nie np. „…(c).”).
      if (!/^(\d{1,2}[.)]|[a-z]\)|[IVX]{1,4}[.)])/i.test(tail)) {
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
  const { masked, segments } = maskInlineMath(s);
  s = masked;

  s = breakSemicolonLetterItems(s);
  s = breakAfterColonIntro(s);
  s = breakLabeledSublist(s);

  // Kolejność: rzymskie → 1) → a) → 1. (arabskie z kropką najbardziej podatne na fałszywe trafienia)
  s = breakSeries(s, /\b([IVX]{1,4})\)\s+/g, 2);
  s = breakSeries(s, /\b([IVX]{1,4})\.\s+/g, 2);
  s = breakSeries(s, /(?<!\d)(\d{1,2})\)\s+/g, 2);
  s = breakSeries(s, /(?<![a-zA-Z=(])([a-z])\)\s+/gi, 2);
  s = breakSeries(s, /(?<!\d)(?<![\d.])(\d{1,2})\.\s+/g, 2);

  s = breakAfterListBlock(s);

  s = unmaskInlineMath(s, segments);
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/** Tylko `text` — legacy helper. */
export function normalizeQuestionTextField(text: string): {
  text: string;
  changed: boolean;
} {
  const normalized = normalizeQuestionListText(text);
  return { text: normalized, changed: normalized !== text };
}

/**
 * Odwrotność normalizeQuestionListText — skleja listy z powrotem w jedną linię.
 * Używać tylko do cofania masowej migracji na explanation.
 */
export function denormalizeQuestionListText(text: string): string {
  if (!text?.trim()) return text;

  let s = text.replace(/\r\n/g, "\n");

  s = s.replace(
    /\n\n(Grupy|Prawidłowe|Temperatury|Opcje|Wskazówki):/gi,
    ". $1:",
  );
  s = s.replace(/;\n([a-z])\)\s*/gi, "; $1) ");
  s = s.replace(
    /:\n+(?=\d{1,2}\.\s|\d{1,2}\)\s|[a-z]\)\s|[IVX]{1,4}\)\s)/gi,
    ": ",
  );
  s = s.replace(
    /([.!?])\n\n(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu,
    "$1 ",
  );
  s = s.replace(/\n+(?=\b[IVX]{1,4}\)\s+)/gi, " ");
  s = s.replace(/\n+(?=(?<!\d)\d{1,2}\)\s+)/g, " ");
  s = s.replace(/\n+(?=(?<![a-zA-Z])[a-z]\)\s+)/gi, " ");
  s = s.replace(/\n+(?=(?<!\d)(?<![\d.])\d{1,2}\.\s+)/g, " ");

  return s.replace(/  +/g, " ").replace(/\n +/g, "\n").trim();
}

/**
 * Naprawia uszkodzenia explanation po błędnej masowej normalizacji list
 * (np. **(\n1) → **(1), **\n2. → **2., rozbite warianty A-E po średniku).
 */
export function repairExplanationListDamage(text: string): string {
  if (!text?.trim()) return text;

  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/\*\*\(\s*\n\s*(\d{1,2})\)/g, "**($1)");
  s = s.replace(/\*\*\(\s*\n\s*([A-E])\)/g, "**($1)");
  s = s.replace(/\*\*\(\s*\n\s*(\d{1,2})\./g, "**$1.");
  s = s.replace(/\*\*\s*\n\s*(\d{1,2})\.\s+/g, "**$1. ");
  s = s.replace(/\*\*\s*\n\s*(\d{1,2})\)\s+/g, "**$1) ");
  s = s.replace(/;\s*\n\s*\n\s*([A-E])\s*—/g, "; $1 —");
  return s;
}

/** Czy explanation wygląda na przetworzone przez normalize — bezpieczny revert. */
export function canRevertExplanationListFormat(explanation: string): boolean {
  const reverted = denormalizeQuestionListText(explanation);
  if (reverted === explanation) return false;
  return normalizeQuestionListText(reverted) === explanation;
}
