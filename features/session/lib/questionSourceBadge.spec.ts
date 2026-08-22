import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCemBadgeLabel,
  isThinCemPool,
  questionSourceBadgeModel,
  sessionMixCounts,
} from "@/features/session/lib/questionSourceBadge";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("QuestionSourceBadge — etykiety", () => {
  it("CEM: sesja + numer, bez zgadywania numeru gdy NULL", () => {
    assert.equal(
      formatCemBadgeLabel("Jesień 2021", 87),
      "CEM · Jesień 2021 · nr 87",
    );
    assert.equal(formatCemBadgeLabel("Jesień 2021", null), "CEM · Jesień 2021");
    assert.equal(formatCemBadgeLabel("Jesień 2021", undefined), "CEM · Jesień 2021");
    assert.equal(formatCemBadgeLabel(null, 87), "CEM · nr 87");
    assert.equal(formatCemBadgeLabel(null, null), "CEM");
  });

  it("nie bierze numeru z source_code", () => {
    const model = questionSourceBadgeModel({
      source: "cem",
      sourceExam: "nie z tego pola",
      cemSessionLabel: "LDEK 2024 sesja 2",
      cemQuestionNumber: null,
      repeatCount: 3,
    });
    assert.deepEqual(model, {
      kind: "cem",
      label: "CEM · LDEK 2024 sesja 2",
      repeatCount: 3,
    });
  });

  it("uczelnia używa source_exam, own jest miętowy", () => {
    assert.deepEqual(
      questionSourceBadgeModel({
        source: "uczelnia",
        sourceExam: "Egzamin Anatomia, Termin II 24/25",
      }),
      { kind: "uczelnia", label: "Egzamin Anatomia, Termin II 24/25" },
    );
    assert.deepEqual(questionSourceBadgeModel({ source: "own" }), { kind: "own" });
  });
});

describe("stany chude", () => {
  it("CEM < 5 to pula chuda, 0 i 5+ nie", () => {
    assert.equal(isThinCemPool(0), false);
    assert.equal(isThinCemPool(2), true);
    assert.equal(isThinCemPool(4), true);
    assert.equal(isThinCemPool(5), false);
  });

  it("uzupełnienie autorskimi: 2 CEM + 8 own przy 10", () => {
    assert.deepEqual(sessionMixCounts(10, 2, 383, true), {
      cem: 2,
      own: 8,
      pool: 385,
    });
    assert.deepEqual(sessionMixCounts(10, 2, 383, false), {
      cem: 2,
      own: 0,
      pool: 2,
    });
  });

  it("startSession ma fillOwn, badge jest za bramką", () => {
    const start = readFileSync(
      join(root, "features/session/api/startSession.ts"),
      "utf8",
    );
    const badge = readFileSync(
      join(root, "features/shared/components/QuestionSourceBadge.tsx"),
      "utf8",
    );
    assert.match(start, /fillOwn: z\.boolean\(\)\.optional\(\)/);
    assert.match(badge, /FEATURES\.cemSource && isSourceFilterLive/);
  });
});
