export type RichSpan = {
  text: string;
  bold?: boolean;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/** Zostawia **pogrubienie**, resztę markdown/HTML zdejmuje. */
export function cleanRichText(input: string): string {
  let text = input.replace(/\r\n/g, "\n");
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/<\/?(br|p|div|li|ul|ol)\b[^>]*>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/_{2}([^_]+)_{2}/g, "**$1**");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2");
  text = text.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1$2");
  text = decodeEntities(text);
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export function stripToPlain(input: string): string {
  return cleanRichText(input)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRichSpans(input: string): RichSpan[] {
  const cleaned = cleanRichText(input);
  if (!cleaned) return [];
  const spans: RichSpan[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned))) {
    if (match.index > last) {
      spans.push({ text: cleaned.slice(last, match.index) });
    }
    spans.push({ text: match[1] ?? "", bold: true });
    last = match.index + match[0].length;
  }
  if (last < cleaned.length) {
    spans.push({ text: cleaned.slice(last) });
  }
  return spans.filter((span) => span.text.length > 0);
}
