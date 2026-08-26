#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { createEmptyCard, fsrs, Rating, State } from "ts-fsrs";
import { assertFsrsParameterFingerprint } from "./lib/fsrs-parameter-fingerprint.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value != null) args.set(key.slice(2), value);
}

const inputArg = args.get("input");
const configArg = args.get("v2-config");
const afterArg = args.get("after") ?? null;
const after = afterArg ? new Date(afterArg) : null;
const outputArg =
  args.get("output") ?? "exports/fsrs-v1-v2-replay-comparison.json";
if (!inputArg || (after && Number.isNaN(after.getTime()))) {
  throw new Error(
    "Użycie: node scripts/compare-fsrs-replay.mjs --input history.jsonl " +
      "[--v2-config params.json] [--after 2026-07-01T00:00:00Z] " +
      "[--output report.json]",
  );
}

const v2Config = configArg
  ? JSON.parse(await readFile(resolve(configArg), "utf8"))
  : {};
if (
  configArg &&
  (v2Config.schedulerVersion !== "memory-v2/ts-fsrs-5.4.1" ||
    v2Config.optimizerVersion !== "@open-spaced-repetition/binding@0.5.0" ||
    !Array.isArray(v2Config.weights) ||
    v2Config.weights.length !== 21 ||
    v2Config.weights.some((value) => !Number.isFinite(value)))
) {
  throw new Error("Plik parametrów nie jest zgodny z runtime pamięci v2.");
}
if (configArg) {
  assertFsrsParameterFingerprint(v2Config);
  const trainingBefore = new Date(v2Config.trainingBefore);
  if (
    !after ||
    Number.isNaN(trainingBefore.getTime()) ||
    after.getTime() < trainingBefore.getTime()
  ) {
    throw new Error(
      "Replay kandydata wymaga --after nie wcześniejszego niż trainingBefore.",
    );
  }
}
const controlScheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: false,
});
const treatmentScheduler = fsrs({
  request_retention: Number(v2Config.requestRetention ?? 0.9),
  maximum_interval: Number(v2Config.maximumInterval ?? 3650),
  enable_fuzz: false,
  ...(Array.isArray(v2Config.weights) ? { w: v2Config.weights } : {}),
});
const schedulers = {
  control: controlScheduler,
  treatment: treatmentScheduler,
};
const metrics = {
  control: {
    predicted: 0,
    brier: 0,
    logLoss: 0,
    scheduledDays: 0,
    scheduledReviews: 0,
  },
  treatment: {
    predicted: 0,
    brier: 0,
    logLoss: 0,
    scheduledDays: 0,
    scheduledReviews: 0,
  },
};
const cards = { control: null, treatment: null };
const EPSILON = 1e-6;

function gradeFor(row) {
  if (!row.is_correct) return Rating.Again;
  if (row.session_kind === "classic" || row.rating_source === "observed") {
    return Rating.Good;
  }
  if (row.confidence === "nie_wiedzialem") return Rating.Hard;
  if (row.confidence === "na_pewno") return Rating.Easy;
  return Rating.Good;
}

function observe(model, row, reviewedAt, shouldScore) {
  const scheduler = schedulers[model];
  const metric = metrics[model];
  const card = cards[model];
  if (shouldScore && card.state !== State.New && card.last_review) {
    const raw = scheduler.get_retrievability(card, reviewedAt, false);
    const probability = Math.min(1 - EPSILON, Math.max(EPSILON, Number(raw)));
    const outcome = row.is_correct ? 1 : 0;
    metric.predicted += 1;
    metric.brier += (probability - outcome) ** 2;
    metric.logLoss += -(
      outcome * Math.log(probability) +
      (1 - outcome) * Math.log(1 - probability)
    );
  }
  const next = scheduler.next(card, reviewedAt, gradeFor(row)).card;
  if (shouldScore) {
    metric.scheduledDays += Number(next.scheduled_days ?? 0);
    metric.scheduledReviews += 1;
  }
  cards[model] = next;
}

let activeKey = null;
let attempts = 0;
let scoredAttempts = 0;
let lineNumber = 0;
const stream = createInterface({
  input: createReadStream(resolve(inputArg), { encoding: "utf8" }),
  crlfDelay: Infinity,
});
for await (const rawLine of stream) {
  lineNumber += 1;
  const line = rawLine.trim();
  if (!line) continue;
  const row = JSON.parse(line);
  const reviewedAt = new Date(row.answered_at);
  if (!row.user_id || !row.question_id || Number.isNaN(reviewedAt.getTime())) {
    continue;
  }
  const key = `${row.user_id}\u0000${row.question_id}`;
  if (activeKey != null && key < activeKey) {
    throw new Error(
      `Wejście nie jest posortowane po użytkowniku i pytaniu (linia ${lineNumber}).`,
    );
  }
  if (key !== activeKey) {
    activeKey = key;
    cards.control = createEmptyCard(reviewedAt);
    cards.treatment = createEmptyCard(reviewedAt);
  } else if (
    cards.control?.last_review &&
    reviewedAt < cards.control.last_review
  ) {
    throw new Error(`Próby karty nie są chronologiczne w linii ${lineNumber}.`);
  }
  const shouldScore = !after || reviewedAt >= after;
  observe("control", row, reviewedAt, shouldScore);
  observe("treatment", row, reviewedAt, shouldScore);
  attempts += 1;
  if (shouldScore) scoredAttempts += 1;
}

function summarize(metric) {
  return {
    predictedAttempts: metric.predicted,
    brierScore: metric.predicted > 0 ? metric.brier / metric.predicted : null,
    logLoss: metric.predicted > 0 ? metric.logLoss / metric.predicted : null,
    averageScheduledDays:
      metric.scheduledReviews > 0
        ? metric.scheduledDays / metric.scheduledReviews
        : null,
  };
}

const control = summarize(metrics.control);
const treatment = summarize(metrics.treatment);
const violations = [];
for (const [field, label] of [
  ["brierScore", "Brier score"],
  ["logLoss", "Log loss"],
]) {
  if (
    control[field] != null &&
    treatment[field] != null &&
    treatment[field] > control[field] * 1.005
  ) {
    violations.push(`${label} v2 pogorszył się o więcej niż 0,5%.`);
  }
}
if (control.predictedAttempts < 100 || treatment.predictedAttempts < 100) {
  violations.push("Replay wymaga co najmniej 100 prób z predykcją na model.");
}

const report = {
  experimentKey: "memory-v2-rollout",
  evaluatedAt: new Date().toISOString(),
  stage: "offline-replay",
  generatedAt: new Date().toISOString(),
  input: resolve(inputArg),
  v2Config: configArg ? resolve(configArg) : "default",
  parameterFingerprint: configArg ? v2Config.parameterFingerprint : null,
  holdoutAfter: after?.toISOString() ?? null,
  attempts,
  scoredAttempts,
  control,
  treatment,
  decision: violations.length === 0 ? "pass" : "hold",
  violations,
};
const outputPath = resolve(outputArg);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Zapisano porównanie: ${outputPath}`);
console.log(`Decyzja: ${report.decision}`);
if (violations.length > 0) process.exitCode = 2;
