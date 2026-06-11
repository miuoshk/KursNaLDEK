/**
 * Wykrywa pytania „połącz w pary” z dwiema listami (np. 1)… + I.…)
 * i zwraca strukturę pod render dwukolumnowy w UI.
 */

export type QuestionListItem = {
  marker: string;
  body: string;
};

export type ParsedQuestionText =
  | { kind: "plain"; text: string }
  | {
      kind: "dual-column";
      intro: string | null;
      left: QuestionListItem[];
      right: QuestionListItem[];
      footer: string | null;
    };

type ListFamily = "arabic" | "roman" | "letter";

type ParsedLine = {
  family: ListFamily;
  marker: string;
  body: string;
};

const LIST_LINE =
  /^(?:(\d{1,2})([.)])\s+|([IVX]{1,4})([.)])\s+|([a-z])(\))\s+)(.*)$/i;

function parseListLine(line: string): ParsedLine | null {
  const trimmed = line.trim();

  const dashArabic = trimmed.match(/^(\d{1,2})\s*-\s+(.+)$/);
  if (dashArabic) {
    return {
      family: "arabic",
      marker: `${dashArabic[1]} -`,
      body: cleanItemBody(dashArabic[2] ?? ""),
    };
  }

  const dashRoman = trimmed.match(/^([IVX]{1,4})\s*-\s+(.+)$/i);
  if (dashRoman) {
    return {
      family: "roman",
      marker: `${dashRoman[1]} -`,
      body: cleanItemBody(dashRoman[2] ?? ""),
    };
  }

  const match = trimmed.match(LIST_LINE);
  if (!match) return null;

  if (match[1]) {
    return {
      family: "arabic",
      marker: `${match[1]}${match[2]}`,
      body: cleanItemBody(match[7] ?? ""),
    };
  }
  if (match[3]) {
    return {
      family: "roman",
      marker: `${match[3]}${match[4]}`,
      body: cleanItemBody(match[7] ?? ""),
    };
  }
  return {
    family: "letter",
    marker: `${match[5]}${match[6]}`,
    body: cleanItemBody(match[7] ?? ""),
  };
}

function cleanItemBody(body: string): string {
  return body
    .replace(/\s+z:\s*$/i, "")
    .replace(/;\s*$/, "")
    .replace(/:\s*$/, "")
    .trim();
}

/** Jednolinijkowe „połącz w pary” ze średnikami → wielolinijkowe listy. */
function expandInlinePairingLists(text: string): string {
  if (!/połącz\s+w\s+par/i.test(text)) return text;

  const compact = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  if (!compact.includes(";")) return text;

  const listLineCount = compact
    .split(/\s*;\s*/)
    .filter((segment) => parseListLine(segment.replace(/^(?:oraz|i)\s*:\s*/i, ""))).length;

  if (listLineCount < 4) return text;

  const INLINE_SEGMENT =
    /^(?:(Połącz[^:;]+?):\s*)?(?:(?:oraz|i)\s*:\s*)?(?:(\d{1,2})|([IVX]{1,4}))\s*-\s*(.+)$/i;

  const lines: string[] = [];

  for (const rawSegment of compact.split(/\s*;\s*/)) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    const match = segment.match(INLINE_SEGMENT);
    if (!match) continue;

    const [, intro, arabic, roman, body] = match;
    if (intro && lines.length === 0) {
      lines.push(intro.trim().endsWith(":") ? intro.trim() : `${intro.trim()}:`);
    }

    const marker = arabic ?? roman;
    if (!marker || !body) continue;
    lines.push(`${marker} - ${body.trim()}`);
  }

  return lines.length >= 4 ? lines.join("\n") : text;
}

function normalizeIntroFooter(lines: string[]): string | null {
  const joined = lines.join("\n").trim();
  return joined.length > 0 ? joined : null;
}

function preferLeftColumn(
  a: { family: ListFamily; items: QuestionListItem[] },
  b: { family: ListFamily; items: QuestionListItem[] },
): { left: QuestionListItem[]; right: QuestionListItem[] } {
  const arabicFirst = (f: ListFamily) => (f === "arabic" ? 0 : f === "letter" ? 1 : 2);
  if (arabicFirst(a.family) <= arabicFirst(b.family)) {
    return { left: a.items, right: b.items };
  }
  return { left: b.items, right: a.items };
}

export function parseDualColumnListQuestion(text: string): ParsedQuestionText {
  if (!text?.trim()) return { kind: "plain", text: text ?? "" };

  const normalizedText = expandInlinePairingLists(text);
  const lines = normalizedText.replace(/\r\n/g, "\n").split("\n");
  const introLines: string[] = [];
  const footerLines: string[] = [];
  const groups: Array<{ family: ListFamily; items: QuestionListItem[] }> = [];

  let phase: "intro" | "list" | "footer" = "intro";
  let currentGroup: { family: ListFamily; items: QuestionListItem[] } | null = null;

  const flushGroup = () => {
    if (currentGroup && currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }
    currentGroup = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (phase === "list" && currentGroup) {
        flushGroup();
      }
      continue;
    }

    const parsed = parseListLine(line);
    if (parsed) {
      if (phase === "intro") {
        phase = "list";
      }
      if (phase === "footer") {
        footerLines.push(rawLine);
        continue;
      }

      if (!currentGroup) {
        currentGroup = {
          family: parsed.family,
          items: [{ marker: parsed.marker, body: parsed.body }],
        };
        continue;
      }

      if (currentGroup.family === parsed.family) {
        currentGroup.items.push({ marker: parsed.marker, body: parsed.body });
      } else {
        flushGroup();
        currentGroup = {
          family: parsed.family,
          items: [{ marker: parsed.marker, body: parsed.body }],
        };
      }
      continue;
    }

    if (phase === "list") {
      flushGroup();
      phase = "footer";
      footerLines.push(rawLine);
    } else if (phase === "intro") {
      introLines.push(rawLine);
    } else {
      footerLines.push(rawLine);
    }
  }

  flushGroup();

  if (groups.length !== 2) {
    return { kind: "plain", text };
  }

  const [a, b] = groups;
  if (a.family === b.family) {
    return { kind: "plain", text };
  }

  const families = new Set([a.family, b.family]);
  const isPairing =
    (families.has("arabic") && families.has("roman")) ||
    (families.has("arabic") && families.has("letter"));
  if (!isPairing || a.items.length < 1 || b.items.length < 1) {
    return { kind: "plain", text };
  }

  const { left, right } = preferLeftColumn(a, b);

  return {
    kind: "dual-column",
    intro: normalizeIntroFooter(introLines),
    left,
    right,
    footer: normalizeIntroFooter(footerLines),
  };
}
