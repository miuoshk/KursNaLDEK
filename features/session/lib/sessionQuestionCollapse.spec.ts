import assert from "node:assert/strict";
import test from "node:test";
import { isLongSessionQuestion } from "@/features/session/lib/sessionQuestionCollapse";

test("krótkie pytanie bez obrazka nie oferuje zwinięcia", () => {
  assert.equal(
    isLongSessionQuestion({
      text: "Krótki trzon.",
      options: [
        { text: "A" },
        { text: "B" },
        { text: "C" },
        { text: "D" },
      ],
    }),
    false,
  );
});

test("długi trzon albo długa opcja kwalifikuje pytanie", () => {
  assert.equal(
    isLongSessionQuestion({
      text: "x".repeat(220),
      options: [{ text: "A" }],
    }),
    true,
  );
  assert.equal(
    isLongSessionQuestion({
      text: "Krótki trzon.",
      options: [{ text: "y".repeat(140) }],
    }),
    true,
  );
});
