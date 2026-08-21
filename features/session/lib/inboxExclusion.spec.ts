import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatAdminTopicName } from "../../admin/lib/formatAdminTopicName";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("poczekalnia CEM wykluczona ze ścieżek studenckich", () => {
  it("due_review_question_ids JOIN-uje topics z is_inbox = false, bez zmiany sygnatury", () => {
    const sql = readRepo("scripts/2026-08-21-due-review-exclude-inbox.sql");
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.due_review_question_ids\(/);
    assert.match(sql, /p_user_id uuid/);
    assert.match(sql, /p_topic_ids text\[\]/);
    assert.match(sql, /p_track text/);
    assert.match(sql, /p_limit int/);
    assert.match(
      sql,
      /JOIN topics t ON t\.id = q\.topic_id AND t\.is_inbox = false/,
    );
  });

  it("ANTARES meta i pula pytań filtrują topics.is_inbox", () => {
    const antares = readRepo(
      "features/session/server/buildAntaresInteligentnaSession.ts",
    );
    const pool = readRepo("lib/content/fetchActiveQuestionsForTopics.ts");
    const topics = readRepo("features/session/server/questionSelection.ts");
    assert.match(antares, /topics!inner\(is_inbox\)/);
    assert.match(antares, /topics\.is_inbox/);
    assert.match(pool, /topics!inner\(is_inbox\)/);
    assert.match(pool, /topics\.is_inbox/);
    assert.match(topics, /eq\("is_inbox", false\)/);
  });
});

describe("formatAdminTopicName", () => {
  it("oznacza poczekalnię, zwykły temat zostawia", () => {
    assert.equal(formatAdminTopicName("Endodoncja", false), "Endodoncja");
    assert.equal(
      formatAdminTopicName("Do przypisania (CEM)", true),
      "Do przypisania (CEM) (poczekalnia CEM)",
    );
  });
});
