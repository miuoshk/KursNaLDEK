import { normalizeQuestionListText } from "@/lib/content/normalizeQuestionListText";
import { parseDualColumnListQuestion } from "@/lib/content/parseDualColumnListQuestion";

export type StemBlock =
  | { kind: "para"; text: string }
  | { kind: "item"; marker: string; text: string };

const LIST_LINE =
  /^(?:(\d{1,2})([.)])\s+|([IVX]{1,4})([.)])\s+|([a-z])(\))\s+)(.*)$/i;

function parseItem(line: string): { marker: string; text: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const dashArabic = trimmed.match(/^(\d{1,2})\s*-\s+(.+)$/);
  if (dashArabic) {
    return { marker: `${dashArabic[1]}.`, text: (dashArabic[2] ?? "").trim() };
  }
  const dashRoman = trimmed.match(/^([IVX]{1,4})\s*-\s+(.+)$/i);
  if (dashRoman) {
    return { marker: `${dashRoman[1]}.`, text: (dashRoman[2] ?? "").trim() };
  }

  const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bullet) {
    return { marker: "•", text: (bullet[1] ?? "").trim() };
  }

  const match = trimmed.match(LIST_LINE);
  if (!match) return null;
  if (match[1]) return { marker: `${match[1]}${match[2]}`, text: (match[7] ?? "").trim() };
  if (match[3]) return { marker: `${match[3]}${match[4]}`, text: (match[7] ?? "").trim() };
  return { marker: `${match[5]}${match[6]}`, text: (match[7] ?? "").trim() };
}

const NEXT_ITEM = /(?<=\s)(\d{1,2}[.)]|[IVX]{1,4}[.)]|[a-z]\))\s+/gi;

function markerFamily(marker: string): "arabic" | "roman" | "letter" | "other" {
  if (/^\d{1,2}[.)]$/.test(marker)) return "arabic";
  if (/^[IVX]{1,4}[.)]$/i.test(marker)) return "roman";
  if (/^[a-z]\)$/i.test(marker)) return "letter";
  return "other";
}

function isSequentialMarker(prev: string, next: string): boolean {
  const a = prev.match(/^(\d{1,2})[.)]$/);
  const b = next.match(/^(\d{1,2})[.)]$/);
  if (a && b) return Number(b[1]) === Number(a[1]) + 1;
  const la = prev.match(/^([a-z])\)$/i);
  const lb = next.match(/^([a-z])\)$/i);
  if (la && lb) return lb[1]!.toLowerCase().charCodeAt(0) === la[1]!.toLowerCase().charCodeAt(0) + 1;
  return markerFamily(prev) === markerFamily(next) && markerFamily(prev) !== "other";
}

/** Druga fala: „1. foo 2. bar 3. baz” w jednej linii → osobne punkty. */
function explodeItem(item: { marker: string; text: string }): StemBlock[] {
  const hits = [...item.text.matchAll(NEXT_ITEM)].filter((m) => m.index !== undefined);
  if (hits.length === 0) {
    return [{ kind: "item", marker: item.marker, text: item.text }];
  }

  const shouldSplit =
    hits.length >= 2 ||
    hits.some((hit) => isSequentialMarker(item.marker, hit[1] ?? ""));
  if (!shouldSplit) {
    return [{ kind: "item", marker: item.marker, text: item.text }];
  }

  const out: StemBlock[] = [];
  let last = 0;
  let marker = item.marker;
  for (const hit of hits) {
    const start = hit.index ?? 0;
    const body = item.text.slice(last, start).trim();
    if (body || out.length === 0) {
      out.push({ kind: "item", marker, text: body });
    }
    marker = hit[1] ?? marker;
    last = start + hit[0].length;
  }
  const tail = item.text.slice(last).trim();
  out.push({ kind: "item", marker, text: tail });
  return out.filter((block) => block.kind !== "item" || block.text.length > 0);
}

function flushPara(buffer: string[], out: StemBlock[]) {
  const text = buffer.join("\n").trim();
  if (text) out.push({ kind: "para", text });
  buffer.length = 0;
}

function blocksFromLines(text: string): StemBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: StemBlock[] = [];
  const para: string[] = [];

  for (const raw of lines) {
    if (!raw.trim()) {
      flushPara(para, out);
      continue;
    }
    const item = parseItem(raw);
    if (item) {
      flushPara(para, out);
      out.push(...explodeItem(item));
      continue;
    }
    para.push(raw.trim());
  }
  flushPara(para, out);
  return out;
}

/** Dzieli treść na wstęp i punkty — enter przed pierwszą listą, każdy punkt osobno. */
export function splitQuestionStem(text: string): StemBlock[] {
  const source = (text ?? "").trim();
  if (!source) return [];

  const normalized = normalizeQuestionListText(source);
  const dual = parseDualColumnListQuestion(normalized);
  if (dual.kind === "dual-column") {
    const out: StemBlock[] = [];
    if (dual.intro) out.push({ kind: "para", text: dual.intro });
    for (const item of dual.left) {
      out.push(...explodeItem({ marker: item.marker, text: item.body }));
    }
    for (const item of dual.right) {
      out.push(...explodeItem({ marker: item.marker, text: item.body }));
    }
    if (dual.footer) out.push({ kind: "para", text: dual.footer });
    return out.length > 0 ? out : [{ kind: "para", text: source }];
  }

  const blocks = blocksFromLines(normalized);
  return blocks.length > 0 ? blocks : [{ kind: "para", text: source }];
}

export function stemHasList(blocks: StemBlock[]): boolean {
  return blocks.some((block) => block.kind === "item");
}
