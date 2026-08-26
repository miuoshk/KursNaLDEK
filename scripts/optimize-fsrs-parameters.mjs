#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import {
  computeParameters,
  evaluateWithTimeSeriesSplits,
  FSRSBindingItem,
  FSRSBindingReview,
} from "@open-spaced-repetition/binding";
import { fsrsParameterFingerprint } from "./lib/fsrs-parameter-fingerprint.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value != null) args.set(key.slice(2), value);
}

const inputArg = args.get("input");
const outputArg = args.get("output") ?? "exports/fsrs-parameters.json";
const scope = args.get("scope") ?? "global";
const scopeKey = args.get("scope-key") ?? null;
const beforeArg = args.get("before") ?? null;
const before = beforeArg ? new Date(beforeArg) : null;

if (
  !inputArg ||
  !["global", "cohort", "user"].includes(scope) ||
  !before ||
  (before && Number.isNaN(before.getTime()))
) {
  console.error(
    "Użycie: node scripts/optimize-fsrs-parameters.mjs --input history.jsonl " +
      "--output params.json --scope global|cohort|user [--scope-key wartość] " +
      "--before 2026-07-01T00:00:00Z",
  );
  process.exit(1);
}

const MIN_SAMPLE = {
  global: 10_000,
  cohort: 5_000,
  user: 300,
};
const DAY_MS = 86_400_000;

function grade(row) {
  if (!row.is_correct) return 1;
  if (row.session_kind === "classic" || row.rating_source === "observed") {
    return 3;
  }
  if (row.confidence === "nie_wiedzialem") return 2;
  if (row.confidence === "na_pewno") return 4;
  return 3;
}

function belongsToScope(row) {
  if (scope === "global") return true;
  if (scope === "user") return row.user_id === scopeKey;
  return row.cohort_key === scopeKey;
}

const itemEntries = [];
let activeKey = null;
let activeReviews = [];
let activeReviewTimes = [];
let previousReviewAt = null;
let reliableAttempts = 0;
let cardCount = 0;
let holdoutAttempts = 0;

function flushCard() {
  if (activeReviews.length >= 2) {
    cardCount += 1;
    for (let index = 1; index < activeReviews.length; index += 1) {
      itemEntries.push({
        item: new FSRSBindingItem(activeReviews.slice(0, index + 1)),
        targetAt: activeReviewTimes[index].getTime(),
      });
    }
    reliableAttempts += activeReviews.length - 1;
  }
  activeReviews = [];
  activeReviewTimes = [];
  previousReviewAt = null;
}

const inputPath = resolve(inputArg);
const stream = createInterface({
  input: createReadStream(inputPath, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

let lineNumber = 0;
for await (const rawLine of stream) {
  lineNumber += 1;
  const line = rawLine.trim();
  if (!line) continue;
  const row = JSON.parse(line);
  if (!belongsToScope(row)) continue;

  const reviewAt = new Date(row.answered_at);
  if (Number.isNaN(reviewAt.getTime())) continue;
  if (reviewAt >= before) {
    holdoutAttempts += 1;
    continue;
  }
  const key = `${row.user_id}\u0000${row.question_id}`;
  if (key !== activeKey) {
    flushCard();
    activeKey = key;
  } else if (previousReviewAt && reviewAt < previousReviewAt) {
    throw new Error(`Próby karty nie są chronologiczne w linii ${lineNumber}.`);
  }

  const deltaT =
    previousReviewAt == null
      ? 0
      : Math.max(
          0,
          Math.round(
            (reviewAt.getTime() - previousReviewAt.getTime()) / DAY_MS,
          ),
        );
  activeReviews.push(new FSRSBindingReview(grade(row), deltaT));
  activeReviewTimes.push(reviewAt);
  previousReviewAt = reviewAt;
}
flushCard();
if (holdoutAttempts === 0) {
  throw new Error(
    "Brak prób holdout w lub po --before; optymalizacja mogłaby trenować na całej historii.",
  );
}
const items = itemEntries
  .sort((left, right) => left.targetAt - right.targetAt)
  .map((entry) => entry.item);

if (reliableAttempts < MIN_SAMPLE[scope]) {
  throw new Error(
    `Za mało wiarygodnych prób dla ${scope}: ${reliableAttempts}; ` +
      `minimum ${MIN_SAMPLE[scope]}.`,
  );
}

const startedAt = new Date();
const weights = await computeParameters(items, {
  enableShortTerm: true,
  numRelearningSteps: 1,
  timeout: 600,
  trainingConfig: {
    numEpochs: 5,
    batchSize: 512,
    seed: 20260825,
    maxSeqLen: 64,
    learningRate: 0.04,
    gamma: 1,
  },
  progress(current, total) {
    if (
      current === total ||
      current % Math.max(1, Math.floor(total / 20)) === 0
    ) {
      console.log(`Optymalizacja: ${current}/${total}`);
    }
  },
});
const evaluation = await evaluateWithTimeSeriesSplits(items, {
  enableShortTerm: true,
  numRelearningSteps: 1,
  timeout: 600,
});

const outputPath = resolve(outputArg);
const result = {
  schedulerVersion: "memory-v2/ts-fsrs-5.4.1",
  optimizerVersion: "@open-spaced-repetition/binding@0.5.0",
  scope,
  scopeKey,
  trainingBefore: before?.toISOString() ?? null,
  holdoutAttempts,
  weights,
  requestRetention: 0.9,
  maximumInterval: 3650,
  sampleSize: reliableAttempts,
  cardCount,
  trainingItemCount: items.length,
  logLoss: evaluation.logLoss,
  rmseBins: evaluation.rmseBins,
  seed: 20260825,
  optimizedAt: new Date().toISOString(),
  durationSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
};
result.parameterFingerprint = fsrsParameterFingerprint(result);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`Zapisano parametry: ${outputPath}`);
