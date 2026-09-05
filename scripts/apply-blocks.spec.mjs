import assert from "node:assert/strict";
import test from "node:test";
import {
  BATCH_LIMIT,
  chunkItems,
  formatApplyReport,
  idsFromReport,
  parseApplyReport,
  parseIdsFile,
  parseJsonl,
} from "./lib/applyBlocksLib.mjs";

test("tnie batch na kawałki po 50", () => {
  const items = Array.from({ length: 51 }, (_, index) => ({ id: `q-${index}` }));
  const chunks = chunkItems(items);
  assert.equal(BATCH_LIMIT, 50);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 50);
  assert.equal(chunks[1].length, 1);
  assert.deepEqual(chunkItems([], 50), []);
  assert.equal(chunkItems(items, 50)[0][0].id, "q-0");
});

test("parseJsonl pomija puste linie i komentarze", () => {
  const items = parseJsonl(
    `# nagłówek\n\n{"id":"a","source":"parser","blocks":{"version":2},"refs":[]}\n{"id":"b","source":"parser","blocks":{"version":2},"refs":[]}\n`,
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ["a", "b"],
  );
});

test("parseJsonl zgłasza numer linii", () => {
  assert.throws(() => parseJsonl("{\"id\":\"ok\"}\n{złe}\n"), /linia 2/);
});

test("raport: format i parse są odwrotne", () => {
  const results = [
    { id: "chs-01-001", status: "preview", reason: null, render_length: 120 },
    { id: "chs-01-002", status: "applied", reason: null, render_length: 98 },
    { id: "chs-01-003", status: "rejected", reason: "invalid_blocks" },
  ];
  const markdown = formatApplyReport({
    generatedAt: "2026-09-05T19:40:00.000Z",
    source: "parser",
    dryRun: true,
    file: "scripts/fixtures/ufo-krok4-sample.jsonl",
    results,
    chunkCount: 1,
  });
  assert.match(markdown, /dry_run: true/);
  assert.match(markdown, /rejected: 1/);
  assert.deepEqual(parseApplyReport(markdown), [
    {
      id: "chs-01-001",
      status: "preview",
      reason: null,
      render_length: 120,
    },
    {
      id: "chs-01-002",
      status: "applied",
      reason: null,
      render_length: 98,
    },
    {
      id: "chs-01-003",
      status: "rejected",
      reason: "invalid_blocks",
      render_length: null,
    },
  ]);
  assert.deepEqual(idsFromReport(markdown), ["chs-01-002"]);
  assert.deepEqual(idsFromReport(markdown, ["preview", "applied"]), [
    "chs-01-001",
    "chs-01-002",
  ]);
});

test("ids.txt: jedna linia, komentarze wylatują", () => {
  assert.deepEqual(parseIdsFile("# skip\nchs-01-001\n\nchs-01-002\n"), [
    "chs-01-001",
    "chs-01-002",
  ]);
});
