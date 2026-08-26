import assert from "node:assert/strict";
import test from "node:test";
import { scheduleConceptTransfer } from "@/features/session/lib/antares/conceptTransfer";
import type { SessionQuestion } from "@/features/session/types";

function question(id: string, conceptIds: string[]): SessionQuestion {
  return {
    id,
    text: id,
    options: [],
    correctOptionId: "a",
    explanation: "",
    sourceCode: null,
    topicName: "Temat",
    conceptIds,
  };
}

test("przesuwa pytanie siostrzane za dwie inne pozycje", () => {
  const current = question("q0", ["c1"]);
  const tail = [
    question("q1", ["c2"]),
    question("q2", ["c3"]),
    question("q3", ["c1"]),
    question("q4", ["c4"]),
  ];

  const result = scheduleConceptTransfer(current, tail, [], true);
  assert.equal(result.tail[2]?.id, "q3");
  assert.equal(result.scheduledQuestionId, "q3");
});

test("pobiera pytanie transferowe z rezerwy bez zwiększania sesji", () => {
  const current = question("q0", ["c1"]);
  const tail = [
    question("q1", ["c2"]),
    question("q2", ["c3"]),
    question("q3", ["c4"]),
  ];
  const result = scheduleConceptTransfer(
    current,
    tail,
    [question("qr", ["c1"])],
    true,
  );

  assert.equal(result.tail.length, tail.length);
  assert.equal(result.tail[2]?.id, "qr");
  assert.ok(result.reserve.some((item) => item.id === "q3"));
});

test("nie planuje transferu po stabilnej poprawnej odpowiedzi", () => {
  const tail = [question("q1", ["c1"])];
  const result = scheduleConceptTransfer(
    question("q0", ["c1"]),
    tail,
    [],
    false,
  );
  assert.deepEqual(result.tail, tail);
  assert.equal(result.scheduledQuestionId, null);
});
