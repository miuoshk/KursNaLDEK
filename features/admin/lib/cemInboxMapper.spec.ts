import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("mapowanie poczekalni CEM", () => {
  it("assign i undo wołają refresh_topic_counts na nowym temacie i poczekalni", () => {
    const src = readFileSync(
      join(root, "features/admin/server/cemInboxActions.ts"),
      "utf8",
    );
    assert.match(
      src,
      /syncTopicQuestionCounts\(admin, \[parsed\.data\.topicId, inboxId\]\)/,
    );
    const refreshCalls = src.match(
      /syncTopicQuestionCounts\(admin, \[parsed\.data\.topicId, inboxId\]\)/g,
    );
    assert.equal(refreshCalls?.length, 2);
  });

  it("dropdown tematów filtruje is_inbox = false", () => {
    const src = readFileSync(
      join(root, "features/admin/server/loadCemInbox.ts"),
      "utf8",
    );
    assert.match(src, /\.eq\("is_inbox", false\)/);
    assert.match(src, /INBOX--/);
  });

  it("podpowiedzi SQL używają ts_rank na questions.text, bez wektorów", () => {
    const sql = readFileSync(
      join(root, "scripts/2026-08-21-cem-inbox-suggestions.sql"),
      "utf8",
    );
    assert.match(sql, /ts_rank/);
    assert.match(sql, /to_tsvector\('simple', q\."text"\)/);
    assert.match(sql, /t\.is_inbox = false/);
    assert.doesNotMatch(sql, /pgvector|::vector/i);
  });

  it("mapper łapie 1-9, Enter, S i Backspace", () => {
    const src = readFileSync(
      join(root, "features/admin/components/CemInboxMapper.tsx"),
      "utf8",
    );
    assert.match(src, /event\.key >= "1" && event\.key <= "9"/);
    assert.match(src, /event\.key === "Enter"/);
    assert.match(src, /event\.key === "s" \|\| event\.key === "S"/);
    assert.match(src, /event\.key === "Backspace"/);
  });
});
