import type { SessionQuestion } from "@/features/session/types";

export type ConceptTransferResult = {
  tail: SessionQuestion[];
  reserve: SessionQuestion[];
  scheduledQuestionId: string | null;
};

function sharesConcept(
  source: SessionQuestion,
  candidate: SessionQuestion,
): boolean {
  const concepts = new Set(source.conceptIds ?? []);
  return (
    concepts.size > 0 &&
    (candidate.conceptIds ?? []).some((conceptId) => concepts.has(conceptId))
  );
}

/**
 * Po błędzie planuje pytanie siostrzane po dwóch innych pozycjach. Nie
 * powtarza tego samego MCQ i nie dodaje kliknięcia do bieżącego feedbacku.
 */
export function scheduleConceptTransfer(
  current: SessionQuestion,
  tail: SessionQuestion[],
  reserve: SessionQuestion[],
  shouldSchedule: boolean,
): ConceptTransferResult {
  if (!shouldSchedule || (current.conceptIds?.length ?? 0) === 0) {
    return { tail, reserve, scheduledQuestionId: null };
  }

  const insertionIndex = Math.min(2, Math.max(0, tail.length - 1));
  const tailIndex = tail.findIndex(
    (candidate) =>
      candidate.id !== current.id && sharesConcept(current, candidate),
  );
  if (tailIndex >= 0) {
    const nextTail = [...tail];
    const [candidate] = nextTail.splice(tailIndex, 1);
    nextTail.splice(Math.min(insertionIndex, nextTail.length), 0, candidate);
    return {
      tail: nextTail,
      reserve,
      scheduledQuestionId: candidate.id,
    };
  }

  const reserveIndex = reserve.findIndex(
    (candidate) =>
      candidate.id !== current.id && sharesConcept(current, candidate),
  );
  if (reserveIndex < 0 || tail.length === 0) {
    return { tail, reserve, scheduledQuestionId: null };
  }

  const nextTail = [...tail];
  const nextReserve = [...reserve];
  const [candidate] = nextReserve.splice(reserveIndex, 1);
  const displaced = nextTail[insertionIndex];
  nextTail[insertionIndex] = candidate;
  if (displaced) nextReserve.push(displaced);

  return {
    tail: nextTail,
    reserve: nextReserve,
    scheduledQuestionId: candidate.id,
  };
}
