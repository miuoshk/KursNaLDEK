import assert from "node:assert/strict";
import test from "node:test";
import { SESSION_CONTRAST } from "@/features/session/lib/optionContrast";

test("kontrast kafelków i secondary w panelu ≥ 4,5:1", () => {
  for (const [name, ratio] of Object.entries(SESSION_CONTRAST)) {
    assert.ok(ratio >= 4.5, `${name} = ${ratio.toFixed(2)}`);
  }
});
