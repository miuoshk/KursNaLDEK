import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addSourceSlices,
  sourceSliceAccuracy,
  type SourceAccuracySlice,
} from "./sourceAccuracy";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("sourceSliceAccuracy", () => {
  it("zwraca null gdy nikt jeszcze nie odpowiadał", () => {
    assert.equal(
      sourceSliceAccuracy({ total: 96, seen: 0, correct: 0 }),
      null,
    );
  });

  it("liczy correct/seen bez przekraczania 100%", () => {
    assert.equal(
      sourceSliceAccuracy({ total: 96, seen: 25, correct: 18 }),
      18 / 25,
    );
    assert.equal(
      sourceSliceAccuracy({ total: 96, seen: 25, correct: 40 }),
      1,
    );
  });

  it("nie miesza dwóch wycinków w jedną liczbę", () => {
    const cem: SourceAccuracySlice = { total: 96, seen: 25, correct: 18 };
    const own: SourceAccuracySlice = { total: 241, seen: 241, correct: 154 };
    const cemPct = sourceSliceAccuracy(cem);
    const ownPct = sourceSliceAccuracy(own);
    assert.equal(cemPct, 18 / 25);
    assert.equal(ownPct, 154 / 241);
    assert.notEqual(cemPct, ownPct);
    assert.notEqual(
      cemPct,
      ((cem.correct + own.correct) / (cem.seen + own.seen)),
    );
  });
});

describe("addSourceSlices", () => {
  it("sumuje liczniki, nie procenty", () => {
    const a: SourceAccuracySlice = { total: 50, seen: 10, correct: 8 };
    const b: SourceAccuracySlice = { total: 46, seen: 15, correct: 10 };
    assert.deepEqual(addSourceSlices(a, b), {
      total: 96,
      seen: 25,
      correct: 18,
    });
  });
});

describe("SourceAccuracyCard", () => {
  const src = readFileSync(
    join(root, "features/shared/components/SourceAccuracyCard.tsx"),
    "utf8",
  );

  it("używa REFERENCE_LABEL i nie składa procentów w jedną liczbę", () => {
    assert.match(src, /REFERENCE_LABEL/);
    assert.match(src, /isSourceFilterUiEnabled/);
    assert.match(src, /sourceSliceAccuracy\(data\.reference\)/);
    assert.match(src, /sourceSliceAccuracy\(data\.own\)/);
    assert.doesNotMatch(src, /refPct\s*\+|ownPct\s*\+|combined|średnia|srednia/);
  });
});
