import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildExplanationsDocument,
  buildKeyDocument,
  buildTestDocument,
} from "@/features/admin/lib/testExport/buildDocuments";
import { testExportFileNames } from "@/features/admin/lib/testExport/fileNames";
import { stripToPlain } from "@/features/admin/lib/testExport/stripRichText";
import type { SelectedTestQuestion } from "@/features/admin/lib/testExport/types";

const question: SelectedTestQuestion = {
  id: "per-01-001",
  topicId: "PER-01",
  source: "own",
  firstSeenSession: null,
  number: 1,
  text: "Który **kieszonka** jest fizjologiczna?",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
    { id: "d", text: "D" },
    { id: "e", text: "E" },
  ],
  correctOptionId: "c",
  explanation: "Bo tak wynika z definicji.",
  imageUrl: null,
};

const meta = {
  title: "Test próbny",
  subtitle: "Periodontologia",
  generatedAt: new Date("2026-08-22T12:00:00Z"),
  questionCount: 1,
};

describe("buildDocuments", () => {
  it("generuje niepuste bufory DOCX", async () => {
    const [testDoc, keyDoc, explDoc] = await Promise.all([
      buildTestDocument({
        questions: [question],
        meta,
        includeKeyAtEnd: true,
      }),
      buildKeyDocument({ questions: [question], meta }),
      buildExplanationsDocument({ questions: [question], meta }),
    ]);
    assert.ok(testDoc.length > 1000);
    assert.ok(keyDoc.length > 800);
    assert.ok(explDoc.length > 800);
    assert.equal(testDoc.subarray(0, 2).toString(), "PK");
  });
});

describe("fileNames / stripRichText", () => {
  it("sluguje polski tytuł", () => {
    const names = testExportFileNames("Test próbny — periodontologia", new Date("2026-08-22"));
    assert.match(names.test, /^test-test-probny-periodontologia-2026-08-22\.docx$/);
    assert.equal(names.manifest, "manifest.json");
  });

  it("zdejmuje markdown do plain text", () => {
    assert.equal(stripToPlain("Który **kieszonka** jest [x](http://a)?"), "Który kieszonka jest x?");
  });
});
