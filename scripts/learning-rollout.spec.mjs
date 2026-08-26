import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("replay porównawczy jest deterministyczny i przechodzi na równych modelach", async () => {
  const directory = await mkdtemp(join(tmpdir(), "learning-replay-"));
  try {
    const input = join(directory, "history.jsonl");
    const output = join(directory, "report.json");
    const baselineOutput = join(directory, "baseline.md");
    const rows = [];
    for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
      for (let attempt = 0; attempt < 45; attempt += 1) {
        rows.push({
          user_id: `user-${cardIndex}`,
          question_id: `question-${cardIndex}`,
          answered_at: new Date(
            Date.UTC(2025, 0, 1 + attempt * 3),
          ).toISOString(),
          is_correct: attempt % 7 !== 0,
          confidence: attempt % 5 === 0 ? "troche" : "na_pewno",
          session_kind: "intelligent",
          rating_source: "explicit",
        });
      }
    }
    await writeFile(
      input,
      `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
      "utf8",
    );

    const run = spawnSync(
      process.execPath,
      [
        resolve("scripts/compare-fsrs-replay.mjs"),
        "--input",
        input,
        "--after",
        "2025-01-02T00:00:00.000Z",
        "--output",
        output,
      ],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stderr || run.stdout);

    const report = JSON.parse(await readFile(output, "utf8"));
    assert.equal(report.decision, "pass");
    assert.equal(report.attempts, 135);
    assert.equal(report.scoredAttempts, 132);
    assert.equal(report.control.predictedAttempts, 132);
    assert.equal(
      report.control.brierScore,
      report.treatment.brierScore,
      "domyślne wagi muszą dawać identyczną kalibrację",
    );

    const baselineRun = spawnSync(
      process.execPath,
      [
        resolve("scripts/replay-learning-history.mjs"),
        "--input",
        input,
        "--output",
        baselineOutput,
      ],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.equal(
      baselineRun.status,
      0,
      baselineRun.stderr || baselineRun.stdout,
    );
    const baseline = await readFile(baselineOutput, "utf8");
    assert.match(baseline, /Próby: 135/);
    assert.match(baseline, /Próby z predykcją FSRS: 132/);
    assert.match(baseline, /Backlog na końcu eksportu:/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("optimizer zapisuje wersjonowane parametry na wiarygodnym holdoucie", async () => {
  const directory = await mkdtemp(join(tmpdir(), "learning-optimize-"));
  try {
    const input = join(directory, "history.jsonl");
    const output = join(directory, "params.json");
    const comparisonOutput = join(directory, "comparison.json");
    const rebuildOutput = join(directory, "rebuild.jsonl");
    const rows = [];
    for (let cardIndex = 0; cardIndex < 100; cardIndex += 1) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        rows.push({
          user_id: "00000000-0000-4000-8000-000000000010",
          question_id: `question-${String(cardIndex).padStart(2, "0")}`,
          answered_at: new Date(
            Date.UTC(2025, 0, 1 + attempt * 3),
          ).toISOString(),
          is_correct: attempt % 6 !== 0,
          confidence: attempt % 4 === 0 ? "troche" : "na_pewno",
          session_kind: "intelligent",
          rating_source: "explicit",
        });
      }
    }
    await writeFile(
      input,
      `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`,
      "utf8",
    );

    const run = spawnSync(
      process.execPath,
      [
        resolve("scripts/optimize-fsrs-parameters.mjs"),
        "--input",
        input,
        "--output",
        output,
        "--scope",
        "user",
        "--scope-key",
        "00000000-0000-4000-8000-000000000010",
        "--before",
        "2025-01-22T00:00:00.000Z",
      ],
      { cwd: resolve("."), encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(run.status, 0, run.stderr || run.stdout);

    const parameters = JSON.parse(await readFile(output, "utf8"));
    assert.equal(parameters.schedulerVersion, "memory-v2/ts-fsrs-5.4.1");
    assert.equal(parameters.scope, "user");
    assert.equal(parameters.sampleSize, 600);
    assert.equal(parameters.cardCount, 100);
    assert.equal(parameters.trainingItemCount, 600);
    assert.equal(parameters.weights.length, 21);
    assert.equal(parameters.trainingBefore, "2025-01-22T00:00:00.000Z");
    assert.match(parameters.parameterFingerprint, /^[a-f0-9]{64}$/);

    const comparisonRun = spawnSync(
      process.execPath,
      [
        resolve("scripts/compare-fsrs-replay.mjs"),
        "--input",
        input,
        "--v2-config",
        output,
        "--after",
        "2025-01-22T00:00:00.000Z",
        "--output",
        comparisonOutput,
      ],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.ok(
      [0, 2].includes(comparisonRun.status),
      comparisonRun.stderr || comparisonRun.stdout,
    );
    const comparison = JSON.parse(await readFile(comparisonOutput, "utf8"));
    assert.equal(comparison.stage, "offline-replay");
    assert.equal(comparison.v2Config, output);
    assert.equal(
      comparison.parameterFingerprint,
      parameters.parameterFingerprint,
    );
    assert.ok(comparison.treatment.predictedAttempts >= 100);

    const activationRun = spawnSync(
      process.execPath,
      [resolve("scripts/activate-fsrs-parameters.mjs"), output],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.equal(
      activationRun.status,
      0,
      activationRun.stderr || activationRun.stdout,
    );

    const rebuildRun = spawnSync(
      process.execPath,
      [
        resolve("scripts/rebuild-fsrs-memory-v2.mjs"),
        "--input",
        input,
        "--parameters",
        output,
        "--parameter-set-id",
        "00000000-0000-4000-8000-000000000001",
        "--output",
        rebuildOutput,
      ],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.equal(rebuildRun.status, 0, rebuildRun.stderr || rebuildRun.stdout);
    const rebuiltRows = (await readFile(rebuildOutput, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.equal(rebuiltRows.length, 100);
    assert.equal(rebuiltRows[0].scheduler_version, "memory-v2/ts-fsrs-5.4.1");
    assert.equal(rebuiltRows[0].source, "replay");

    const importRun = spawnSync(
      process.execPath,
      [resolve("scripts/import-fsrs-memory-v2.mjs"), rebuildOutput],
      { cwd: resolve("."), encoding: "utf8" },
    );
    assert.equal(importRun.status, 0, importRun.stderr || importRun.stdout);
    assert.match(importRun.stdout, /Dry-run: zweryfikowano 100 kart/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("narzędzie rolloutu domyślnie wykonuje tylko dry-run", () => {
  const run = spawnSync(
    process.execPath,
    [
      resolve("scripts/set-learning-experiment-rollout.mjs"),
      "--experiment",
      "memory-v2-rollout",
      "--percent",
      "0",
    ],
    { cwd: resolve("."), encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const result = JSON.parse(run.stdout.split("\nDodaj --apply")[0]);
  assert.equal(result.dryRun, true);
  assert.equal(result.targetPercent, 0);
});

test("canary pamięci wymaga świeżego preflightu spiętego z parametrami", async () => {
  const directory = await mkdtemp(join(tmpdir(), "learning-rollout-gate-"));
  try {
    const report = join(directory, "preflight.json");
    await writeFile(
      report,
      JSON.stringify({
        experimentKey: "memory-v2-rollout",
        evaluatedAt: new Date().toISOString(),
        stage: "preflight",
        decision: "pass",
        violations: [],
        parameterFingerprint: "a".repeat(64),
      }),
      "utf8",
    );
    const run = spawnSync(
      process.execPath,
      [
        resolve("scripts/set-learning-experiment-rollout.mjs"),
        "--experiment",
        "memory-v2-rollout",
        "--percent",
        "5",
        "--report",
        report,
      ],
      { cwd: resolve("."), encoding: "utf8" },
    );

    assert.equal(run.status, 0, run.stderr || run.stdout);
    assert.match(run.stdout, /"targetPercent": 5/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
