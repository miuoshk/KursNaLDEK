import { contrastToGfm } from "../../features/shared/lib/explanationBlocks";
import type { ExplanationBlocksV2 } from "../../features/shared/lib/explanationBlocks";

type Option = { id: string; text: string };

/**
 * Port of `public.render_explanation_blocks` for the KROK 6 invariant test only.
 * Do not use this in the app or in apply/rollback.
 */
export function renderExplanationBlocksTs(
  blocks: ExplanationBlocksV2,
  options: readonly Option[],
  correctOptionId: string,
): string {
  const sections: string[] = [];
  const verdict = options.find((option) => option.id === correctOptionId)?.text
    ?.trim();
  if (verdict) sections.push(`**Poprawna odpowiedź:** ${verdict}`);

  const reason = blocks.correctReason.trim();
  if (reason) sections.push(reason);

  const distractorLines: string[] = [];
  for (const option of options) {
    if (option.id === correctOptionId) continue;
    const optText = option.text.trim();
    const dist = blocks.distractors?.[option.id]?.trim();
    if (!optText || !dist) continue;
    distractorLines.push(`- *${optText}* — ${dist}`);
  }
  if (distractorLines.length > 0) {
    sections.push(
      `**Dlaczego nie pozostałe?**\n\n${distractorLines.join("\n")}`,
    );
  }

  if (blocks.contrast && blocks.contrast.length > 0) {
    sections.push(contrastToGfm(blocks.contrast));
  }

  const trap = blocks.trap?.trim();
  if (trap) sections.push(`> **Pułapka:** ${trap}`);

  const takeaway = blocks.takeaway?.trim();
  if (takeaway) sections.push(`> **Zasada:** ${takeaway}`);

  const joined = sections.join("\n\n");
  return joined
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

export function stripEmojiForInvariant(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    if (
      (cp >= 0x2600 && cp <= 0x27bf) ||
      (cp >= 0x1f300 && cp <= 0x1faff)
    ) {
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizeInvariantText(text: string): string {
  let value = text.replace(/\r\n/g, "\n").replace(/Haczyk/g, "Zasada");
  value = stripEmojiForInvariant(value);
  const lines = value.split("\n").map((line) => {
    const trimmed = line.replace(/[ \t]+/g, " ").trim();
    if (/^\|[-: |]+$/.test(trimmed.replace(/\s+/g, ""))) {
      return "|---|";
    }
    return trimmed.replace(/\s*\|\s*/g, "|").replace(/^\|/, "|").replace(/\|$/, "|");
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function charDiffRatio(left: string, right: string): number {
  const maxLen = Math.max(left.length, right.length, 1);
  return levenshteinLocal(left, right) / maxLen;
}

function levenshteinLocal(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const next = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    next[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = next[j];
  }
  return prev[b.length];
}
