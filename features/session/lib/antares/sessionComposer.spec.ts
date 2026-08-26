import assert from "node:assert/strict";
import test from "node:test";
import {
  composeSession,
  type RankedQuestion,
} from "@/features/session/lib/antares/sessionComposer";

function ranked(
  prefix: string,
  count: number,
  isLeech = false,
): RankedQuestion[] {
  return Array.from({ length: count }, (_, index) => ({
    questionId: `${prefix}-${index}`,
    topicId: `topic-${index % 3}`,
    score: count - index,
    isLeech,
  }));
}

test("plan dnia respektuje docelowy miks, gdy pule są wystarczające", () => {
  const result = composeSession({
    userId: "user",
    count: 8,
    dueQuestions: ranked("due", 6),
    unseenQuestions: ranked("new", 6),
    leechQuestions: ranked("leech", 3, true),
    topicMastery: new Map(),
    accuracyLast20: 0.7,
    dailyGoal: 20,
    questionsToday: 0,
    examDate: null,
    protectCemPool: false,
    targetMix: { due: 3, new: 3, remediation: 2 },
  });

  assert.equal(result.questionIds.length, 8);
  assert.deepEqual(result.composition, {
    dueReviews: 5,
    newQuestions: 3,
    leeches: 2,
  });
});

test("plan dnia bierze remediację z puli zapisanych, gdy nie ma pijawek", () => {
  const result = composeSession({
    userId: "user",
    count: 8,
    dueQuestions: ranked("due", 6),
    unseenQuestions: ranked("new", 6),
    leechQuestions: ranked("saved", 4, false),
    topicMastery: new Map(),
    accuracyLast20: 0.7,
    dailyGoal: 20,
    questionsToday: 0,
    examDate: null,
    protectCemPool: false,
    targetMix: { due: 3, new: 3, remediation: 2 },
  });

  assert.equal(result.questionIds.length, 8);
  assert.equal(
    result.questionIds.filter((id) => id.startsWith("saved-")).length,
    2,
  );
});
