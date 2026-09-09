import { contrastToGfm } from "@/features/shared/lib/explanationBlocks";
import {
  isStatementSetBlocks,
  type ExplanationBlocksV2,
} from "@/features/shared/lib/explanationBlocks";
import { statementDisplayNumber } from "@/features/shared/lib/statementSet";

type Option = { id: string; text: string };

/**
 * Port of `public.render_explanation_blocks`.
 * SBA: werdykt, mechanizm, dystraktory A–E, kontrast, pułapka, zasada.
 * Zestawienie: werdykt, zasada, stwierdzenia z oceną i uzasadnieniem.
 * Bez akapitów kombinacji A–E.
 */
export function renderExplanationBlocks(
  blocks: ExplanationBlocksV2,
  options: readonly Option[],
  correctOptionId: string,
): string {
  const sections: string[] = [];
  const verdict = options.find((option) => option.id === correctOptionId)?.text
    ?.trim();
  if (verdict) sections.push(`**Poprawna odpowiedź:** ${verdict}`);

  if (isStatementSetBlocks(blocks)) {
    const takeaway = blocks.takeaway?.trim();
    if (takeaway) sections.push(`> **Zasada:** ${takeaway}`);

    const reason = blocks.correctReason?.trim();
    if (reason) sections.push(reason);

    const statementLines = blocks.statements.map((statement, index) => {
      const number = statementDisplayNumber(blocks.statements, statement.id) ??
        index + 1;
      const verdictLabel = statement.isTrue ? "Prawda" : "Fałsz";
      const lines = [
        `${number}. ${statement.text.trim()} — ${verdictLabel}`,
        statement.rationale.trim(),
      ];
      const correction = statement.correction?.trim();
      if (correction) lines.push(correction);
      return lines.join("\n");
    });
    if (statementLines.length > 0) {
      sections.push(`**Stwierdzenia**\n\n${statementLines.join("\n\n")}`);
    }

    if (blocks.contrast && blocks.contrast.length > 0) {
      sections.push(contrastToGfm(blocks.contrast));
    }

    const trap = blocks.trap?.trim();
    if (trap) sections.push(`> **Pułapka:** ${trap}`);

    return finalizeRender(sections.join("\n\n"));
  }

  const reason = blocks.correctReason?.trim();
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

  return finalizeRender(sections.join("\n\n"));
}

function finalizeRender(joined: string): string {
  return joined
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}
