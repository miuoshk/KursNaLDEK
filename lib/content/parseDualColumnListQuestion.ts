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
    .trim();
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

  const lines = text.replace(/\r\n/g, "\n").split("\n");
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
