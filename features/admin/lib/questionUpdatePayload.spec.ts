import assert from "node:assert/strict";
import test from "node:test";
import { buildQuestionUpdatePayload } from "@/features/admin/lib/questionUpdatePayload";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";

const base = {
  text: "Treść",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  correctOptionId: "b",
  explanation: "Proza",
  isActive: true,
  sourceExam: null,
  sourceCode: null,
  imageUrl: null,
  topicId: "t-1",
  themeLabel: null,
  subthemeLabel: null,
  batchLabel: null,
  learningOutcome: null,
  disableOptionShuffle: false,
};

test("payload bez explanationBlocks nie zawiera explanation_blocks", () => {
  const payload = buildQuestionUpdatePayload(base);
  assert.equal("explanation_blocks" in payload, false);
  assert.equal(payload.explanation, "Proza");
});

test("payload z explanationBlocks: null ustawia kolumnę na null", () => {
  const payload = buildQuestionUpdatePayload({
    ...base,
    explanationBlocks: null,
  });
  assert.equal("explanation_blocks" in payload, true);
  assert.equal(payload.explanation_blocks, null);
});

test("payload z blokami zapisuje explanation_blocks", () => {
  const blocks: ExplanationBlocksV2 = {
    version: 2,
    correctReason: "Mechanizm.",
  };
  const payload = buildQuestionUpdatePayload({
    ...base,
    explanationBlocks: blocks,
  });
  assert.deepEqual(payload.explanation_blocks, blocks);
});
