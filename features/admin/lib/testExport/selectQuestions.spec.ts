import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { poolSizeForTopic } from "@/features/admin/lib/testExport/poolCount";
import {
  allocateEqual,
  allocateProportional,
  clampQuotaToPool,
  createSeededRng,
  selectQuestions,
} from "@/features/admin/lib/testExport/selectQuestions";
import type { SelectableQuestion } from "@/features/admin/lib/testExport/types";

function q(
  id: string,
  topicId: string,
  source = "own",
  firstSeenSession: string | null = null,
): SelectableQuestion {
  return {
    id,
    topicId,
    source,
    firstSeenSession,
    text: id,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
      { id: "e", text: "E" },
    ],
    correctOptionId: "c",
    explanation: "bo C",
    imageUrl: null,
  };
}

describe("selectQuestions", () => {
  it("nie przekracza puli tematu i zgłasza twardy błąd", () => {
    const result = selectQuestions({
      pool: [q("per-01-001", "PER-01"), q("per-01-002", "PER-01")],
      quotas: [{ topicId: "PER-01", count: 3 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: false,
      seed: 1,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "insufficient_pool");
      if (result.error.code === "insufficient_pool") {
        assert.equal(result.error.available, 2);
        assert.equal(result.error.requested, 3);
      }
    }
  });

  it("suma wybranych zgadza się z blueprintem", () => {
    const pool = [
      q("per-01-001", "PER-01"),
      q("per-01-002", "PER-01"),
      q("per-01-003", "PER-01"),
      q("per-08-001", "PER-08"),
      q("per-08-002", "PER-08"),
    ];
    const result = selectQuestions({
      pool,
      quotas: [
        { topicId: "PER-01", count: 2 },
        { topicId: "PER-08", count: 1 },
      ],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: false,
      seed: 1,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.questions.length, 3);
      assert.deepEqual(
        result.questions.map((row) => row.number),
        [1, 2, 3],
      );
      assert.equal(result.questions.filter((row) => row.topicId === "PER-01").length, 2);
      assert.equal(result.questions.filter((row) => row.topicId === "PER-08").length, 1);
    }
  });

  it("litera klucza to correct_option_id w tej samej kolejności", () => {
    const pool = [
      { ...q("a-1", "T1"), correctOptionId: "a" },
      { ...q("a-2", "T1"), correctOptionId: "e" },
      { ...q("a-3", "T1"), correctOptionId: "b" },
    ];
    const result = selectQuestions({
      pool,
      quotas: [{ topicId: "T1", count: 3 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: false,
      seed: 7,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(
        result.questions.map((row) => `${row.number}.${row.correctOptionId}`),
        ["1.a", "2.e", "3.b"],
      );
    }
  });

  it("ten sam seed daje tę samą kolejność po tasowaniu", () => {
    const pool = Array.from({ length: 10 }, (_, i) =>
      q(`per-01-${String(i + 1).padStart(3, "0")}`, "PER-01"),
    );
    const a = selectQuestions({
      pool,
      quotas: [{ topicId: "PER-01", count: 5 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: true,
      seed: 42,
    });
    const b = selectQuestions({
      pool,
      quotas: [{ topicId: "PER-01", count: 5 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: true,
      seed: 42,
    });
    assert.equal(a.ok && b.ok, true);
    if (a.ok && b.ok) {
      assert.deepEqual(
        a.questions.map((row) => row.id),
        b.questions.map((row) => row.id),
      );
    }
  });

  it("filtr CEM zostawia własne przy źródle all", () => {
    const pool = [
      q("own-1", "PER-01", "own"),
      q("cem-1", "PER-01", "cem", "ldew-2024-1"),
      q("cem-2", "PER-01", "cem", "ldew-2025-1"),
    ];
    const result = selectQuestions({
      pool,
      quotas: [{ topicId: "PER-01", count: 2 }],
      source: "all",
      product: "ldew",
      cemSessionIds: ["ldew-2024-1"],
      shuffle: false,
      seed: 1,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(
        result.questions.map((row) => row.id).sort(),
        ["cem-1", "own-1"],
      );
    }
  });

  it("odrzuca pusty blueprint i nadmiar ponad limit", () => {
    const empty = selectQuestions({
      pool: [q("x", "T")],
      quotas: [{ topicId: "T", count: 0 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: false,
      seed: 1,
    });
    assert.equal(empty.ok, false);
    if (!empty.ok) assert.equal(empty.error.code, "empty_blueprint");

    const over = selectQuestions({
      pool: Array.from({ length: 5 }, (_, i) => q(`id-${i}`, "T")),
      quotas: [{ topicId: "T", count: 3 }],
      source: "all",
      product: "ldew",
      cemSessionIds: [],
      shuffle: false,
      seed: 1,
      maxQuestions: 2,
    });
    assert.equal(over.ok, false);
    if (!over.ok) assert.equal(over.error.code, "over_limit");
  });
});

describe("allocate / clamp", () => {
  it("po równo nie przekracza puli tematu", () => {
    const pool = new Map([
      ["A", 2],
      ["B", 10],
      ["C", 0],
    ]);
    const rows = allocateEqual(["A", "B", "C"], pool, 8);
    const byId = Object.fromEntries(rows.map((r) => [r.topicId, r.count]));
    assert.equal(byId.A, 2);
    assert.equal(byId.B, 6);
    assert.equal(byId.C, 0);
    assert.equal(rows.reduce((s, r) => s + r.count, 0), 8);
  });

  it("proporcjonalnie rozdziela resztę i trzyma sumę", () => {
    const pool = new Map([
      ["A", 10],
      ["B", 30],
    ]);
    const rows = allocateProportional(["A", "B"], pool, 8);
    const sum = rows.reduce((s, r) => s + r.count, 0);
    assert.equal(sum, 8);
    const byId = Object.fromEntries(rows.map((r) => [r.topicId, r.count]));
    assert.equal(byId.A, 2);
    assert.equal(byId.B, 6);
  });

  it("clamp nie wypycha sumy ponad 200", () => {
    assert.equal(clampQuotaToPool(50, 80, 180), 20);
    assert.equal(clampQuotaToPool(5, 3, 0), 3);
    assert.equal(clampQuotaToPool(-1, 10, 0), 0);
  });
});

describe("poolSizeForTopic", () => {
  it("liczy CEM tylko z zaznaczonych sesji", () => {
    const counts = [
      { topicId: "PER-01", source: "own", firstSeenSession: null, count: 4 },
      { topicId: "PER-01", source: "cem", firstSeenSession: "s1", count: 2 },
      { topicId: "PER-01", source: "cem", firstSeenSession: "s2", count: 3 },
    ];
    assert.equal(poolSizeForTopic(counts, "PER-01", "all", "ldew", []), 9);
    assert.equal(poolSizeForTopic(counts, "PER-01", "all", "ldew", ["s1"]), 6);
    assert.equal(poolSizeForTopic(counts, "PER-01", "reference", "ldew", ["s2"]), 3);
    assert.equal(poolSizeForTopic(counts, "PER-01", "own", "ldew", ["s1"]), 4);
  });
});

describe("createSeededRng", () => {
  it("jest deterministyczny", () => {
    const a = createSeededRng(9);
    const b = createSeededRng(9);
    assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  });
});
