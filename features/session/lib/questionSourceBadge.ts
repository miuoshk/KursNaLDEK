import type { SessionQuestion } from "@/features/session/types";

export function formatCemBadgeLabel(
  sessionLabel: string | null | undefined,
  questionNumber: number | null | undefined,
): string {
  const parts = ["CEM"];
  const label = sessionLabel?.trim();
  if (label) parts.push(label);
  if (
    typeof questionNumber === "number" &&
    Number.isFinite(questionNumber) &&
    questionNumber > 0
  ) {
    parts.push(`nr ${questionNumber}`);
  }
  return parts.join(" · ");
}

export function formatRepeatBadge(repeatCount: number | null | undefined): string | null {
  if (repeatCount == null || repeatCount <= 1) return null;
  return `Powtarzało się ${repeatCount}×`;
}

export type QuestionSourceBadgeModel =
  | { kind: "own" }
  | { kind: "uczelnia"; label: string }
  | { kind: "cem"; label: string; repeatCount: number };

export function questionSourceBadgeModel(
  question: Pick<
    SessionQuestion,
    | "source"
    | "sourceExam"
    | "cemSessionLabel"
    | "cemQuestionNumber"
    | "repeatCount"
  >,
): QuestionSourceBadgeModel | null {
  if (question.source === "own") return { kind: "own" };
  if (question.source === "uczelnia") {
    const label = question.sourceExam?.trim();
    if (!label) return { kind: "uczelnia", label: "Uczelnia" };
    return { kind: "uczelnia", label };
  }
  if (question.source === "cem") {
    return {
      kind: "cem",
      label: formatCemBadgeLabel(
        question.cemSessionLabel,
        question.cemQuestionNumber,
      ),
      repeatCount: question.repeatCount ?? 0,
    };
  }
  return null;
}

export const THIN_CEM_MAX = 4;

export function isThinCemPool(cemCount: number): boolean {
  return cemCount > 0 && cemCount <= THIN_CEM_MAX;
}

export function sessionMixCounts(
  requested: number,
  cemCount: number,
  ownCount: number,
  fillOwn: boolean,
): { cem: number; own: number; pool: number } {
  const safeRequested = Math.max(0, requested);
  if (!fillOwn) {
    const cem = Math.min(safeRequested, Math.max(0, cemCount));
    return { cem, own: 0, pool: Math.max(0, cemCount) };
  }
  const cem = Math.min(safeRequested, Math.max(0, cemCount));
  const own = Math.min(Math.max(0, safeRequested - cem), Math.max(0, ownCount));
  return { cem, own, pool: Math.max(0, cemCount) + Math.max(0, ownCount) };
}
