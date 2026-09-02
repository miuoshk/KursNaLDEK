import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  countForSource,
  parseSourceFilter,
  questionMatchesSource,
  resolveEngineSourceFilter,
  sourceCountsFromTotals,
  topicAnsweredForSource,
} from "@/features/session/lib/sourceFilter";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("filtr źródła", () => {
  it("own to zawsze source=own, nie dopełnienie referencyjnych", () => {
    assert.equal(questionMatchesSource("own", "own", "ldew"), true);
    assert.equal(questionMatchesSource("cem", "own", "ldew"), false);
    assert.equal(questionMatchesSource("uczelnia", "own", "ldew"), false);
    assert.equal(questionMatchesSource("uczelnia", "reference", "ldew"), false);
    assert.equal(questionMatchesSource("cem", "reference", "ldew"), true);
    assert.equal(questionMatchesSource("uczelnia", "reference", "knnp"), true);
  });

  it("liczniki z kolumn: own = total - ref, bez liczenia na froncie listy", () => {
    const counts = sourceCountsFromTotals(424, 41);
    assert.deepEqual(counts, { all: 424, reference: 41, own: 383 });
    assert.equal(countForSource(counts, "all"), 424);
    assert.equal(countForSource(counts, "reference"), 41);
    assert.equal(countForSource(counts, "own"), 383);
  });

  it("kafel i karty statystyk biorą answered z tego samego źródła co licznik", () => {
    const topic = {
      answered_count: 40,
      answered_count_ref: 3,
      answered_count_own: 37,
    };
    assert.equal(topicAnsweredForSource(topic, "all", true), 40);
    assert.equal(topicAnsweredForSource(topic, "reference", true), 3);
    assert.equal(topicAnsweredForSource(topic, "own", true), 37);
    assert.equal(topicAnsweredForSource(topic, "reference", false), 40);
  });

  it("parseSourceFilter odrzuca stare 'cem'", () => {
    assert.equal(parseSourceFilter("cem"), null);
    assert.equal(parseSourceFilter("reference"), "reference");
  });

  it("produkt bez źródeł referencyjnych z ?src=reference zostaje all, nie pustą pulą", () => {
    assert.equal(resolveEngineSourceFilter("reference", "unknown"), "all");
    assert.equal(resolveEngineSourceFilter("own", "unknown"), "all");
    assert.equal(resolveEngineSourceFilter("reference", "knnp"), "reference");
    assert.equal(resolveEngineSourceFilter("own", "ldew"), "own");
    assert.equal(resolveEngineSourceFilter("reference", null), "all");
    const src = readFileSync(
      join(root, "features/session/lib/sourceFilter.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /__no_reference_sources__/);
  });

  it("startSession dokłada source do schematu Zod, nie do KnnpSessionMode", () => {
    const start = readFileSync(
      join(root, "features/session/api/startSession.ts"),
      "utf8",
    );
    const types = readFileSync(join(root, "features/session/types.ts"), "utf8");
    assert.match(start, /source: z\.enum\(\["all", "reference", "own"\]\)/);
    assert.match(
      types,
      /export type KnnpSessionMode = "inteligentna" \| "przeglad" \| "katalog"/,
    );
    assert.doesNotMatch(types, /KnnpSessionMode = .*reference/);
    assert.match(start, /source_filter: retrySource/);
    assert.match(start, /source_filter: source/);
    const catalogReturn = start.slice(
      start.lastIndexOf('if (mode === "katalog")'),
      start.indexOf("let insertSubjectId"),
    );
    assert.match(catalogReturn, /sessionId: `katalog-/);
    assert.doesNotMatch(catalogReturn, /\.insert\(/);
    assert.doesNotMatch(catalogReturn, /source_filter/);
  });

  it("KNNP nie pobiera question_count_ref gdy flaga jest wyłączona", () => {
    const src = readFileSync(
      join(root, "features/subjects/server/loadSubjectDashboard.ts"),
      "utf8",
    );
    assert.match(src, /if \(!FEATURES\.cemSource\)|FEATURES\.cemSource/);
    assert.match(src, /question_count_ref/);
    assert.match(src, /isSourceFilterLive/);
    assert.match(src, /statsBySource/);
    assert.match(src, /includeSource: true/);
  });

  it("nie ma czwartej karty trybu nauki", () => {
    const dialog = readFileSync(
      join(root, "features/subjects/components/TopicSessionConfigDialog.tsx"),
      "utf8",
    );
    const cta = readFileSync(
      join(root, "features/subjects/components/SmartSessionCTA.tsx"),
      "utf8",
    );
    assert.match(dialog, /smartSession/);
    assert.match(dialog, /classicLearning/);
    assert.match(dialog, /questionCatalog/);
    assert.doesNotMatch(dialog, /sourceSession|tryb źródła|SourceMode/);
    assert.match(cta, /SourceFilter|srcParam|source/);
  });
});

describe("ścieżki KNNP bez extra SELECT question_count_ref", () => {
  it("knnpCatalogCache nie selectuje question_count_ref", () => {
    const src = readFileSync(
      join(root, "features/shared/server/knnpCatalogCache.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /question_count_ref/);
  });

  it("fetchActiveQuestionsForTopics nie dodaje kolumny source na default path", () => {
    const src = readFileSync(
      join(root, "lib/content/fetchActiveQuestionsForTopics.ts"),
      "utf8",
    );
    assert.match(src, /options\?\.includeSource/);
    assert.match(src, /selectCols\.push\("source"\)/);
    assert.doesNotMatch(src, /question_count_ref/);
    const knnpCallers = [
      "features/session/server/questionSelection.ts",
      "features/session/server/sessionQuestionMix.ts",
    ];
    for (const file of knnpCallers) {
      const caller = readFileSync(join(root, file), "utf8");
      assert.doesNotMatch(caller, /includeSource:\s*true/);
    }
  });

  it("recalculateTopicMastery dolicza ref_* z includeSource, bez zmiany mastery", () => {
    const src = readFileSync(
      join(root, "features/session/lib/antares/recalculateTopicMastery.ts"),
      "utf8",
    );
    assert.match(src, /includeSource:\s*true/);
    assert.match(src, /ref_total/);
    assert.match(src, /ref_seen/);
    assert.match(src, /ref_correct/);
    assert.match(src, /referenceSources/);
    assert.match(src, /coverage \* 0\.3 \+ accuracy \* 0\.3 \+ avgRetrievability \* 0\.4/);
  });
});
