import type { AdminQuestionOption } from "@/features/admin/server/loadAdminQuestionDetail";

export type QuestionCopyInput = {
  subjectName: string;
  topicName: string;
  text: string;
  options: AdminQuestionOption[];
  correctOptionId: string;
  explanation: string;
  questionType?: string | null;
};

function optionLabel(id: string): string {
  if (/^[a-z]$/i.test(id)) return id.toUpperCase();
  return id;
}

function formatOptions(options: AdminQuestionOption[]): string {
  if (options.length === 0) return "—";
  return options.map((o) => `${optionLabel(o.id)}) ${o.text}`).join("\n");
}

function formatCorrectAnswer(
  options: AdminQuestionOption[],
  correctOptionId: string,
): string {
  if (!correctOptionId) return "—";
  const match = options.find((o) => o.id === correctOptionId);
  if (match) return `${optionLabel(match.id)}) ${match.text}`;
  return correctOptionId;
}

/** Tekst pytania do schowka (zgłoszenia błędów, edycja offline). */
export function formatQuestionCopyText(input: QuestionCopyInput): string {
  const typeNote =
    input.questionType && input.questionType !== "single_choice"
      ? ` (typ: ${input.questionType})`
      : "";

  return [
    `Przedmiot: ${input.subjectName || "—"}`,
    `Temat: ${input.topicName || "—"}`,
    `Treść Pytania: ${input.text || "—"}`,
    `Warianty odpowiedzi:${typeNote}\n${formatOptions(input.options)}`,
    `Poprawna odpowiedź: ${formatCorrectAnswer(input.options, input.correctOptionId)}`,
    `Wyjaśnienie: ${input.explanation || "—"}`,
  ].join("\n\n");
}
