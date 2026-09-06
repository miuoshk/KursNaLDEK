import assert from "node:assert/strict";
import test from "node:test";
import { parseCompleteSessionPayload } from "@/features/session/lib/parseCompleteSessionPayload";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

test("przyjmuje sesję bez eventów", () => {
  const parsed = parseCompleteSessionPayload({ sessionId: SESSION_ID });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.data.sessionId, SESSION_ID);
  assert.deepEqual(parsed.data.feedbackEvents, []);
});

test("przyjmuje poprawne feedbackEvents", () => {
  const parsed = parseCompleteSessionPayload({
    sessionId: SESSION_ID,
    feedbackEvents: [
      {
        eventType: "feedback_shown",
        questionId: "q1",
        payload: {
          variant: "standard",
          hasBlocks: false,
          hypercorrection: false,
          elements: ["verdict"],
        },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.data.feedbackEvents.length, 1);
});

test("złe feedbackEvents nie blokują zamknięcia sesji", () => {
  const parsed = parseCompleteSessionPayload({
    sessionId: SESSION_ID,
    durationSecondsFallback: 12,
    feedbackEvents: [{ eventType: "feedback_shown", questionId: "q1" }],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.data.durationSecondsFallback, 12);
  assert.deepEqual(parsed.data.feedbackEvents, []);
});

test("odrzuca nie-UUID", () => {
  const parsed = parseCompleteSessionPayload({ sessionId: "nie-uuid" });
  assert.equal(parsed.ok, false);
});
