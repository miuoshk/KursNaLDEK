#!/usr/bin/env node

import { createReadStream, createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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
const outputArg = args.get("output") ?? "exports/fsrs-memory-v2-rebuild.jsonl";
const parametersArg = args.get("parameters");
const parameterSetId = args.get("parameter-set-id") ?? null;

if (!inputArg) {
  console.error(
    "Użycie: node scripts/rebuild-fsrs-memory-v2.mjs --input history.jsonl " +
      "[--parameters params.json] [--parameter-set-id uuid] [--output out.jsonl]",
  );
  process.exit(1);
}

let parameterFile = null;
if (parametersArg) {
  parameterFile = JSON.parse(await readFile(resolve(parametersArg), "utf8"));
}
if (
  parameterFile &&
  (parameterFile.schedulerVersion !== "memory-v2/ts-fsrs-5.4.1" ||
    parameterFile.optimizerVersion !==
      "@open-spaced-repetition/binding@0.5.0" ||
    !Array.isArray(parameterFile.weights) ||
    parameterFile.weights.length !== 21 ||
    parameterFile.weights.some((value) => !Number.isFinite(value)))
) {
  throw new Error("Plik parametrów nie jest zgodny z runtime pamięci v2.");
}
if (parameterFile) assertFsrsParameterFingerprint(parameterFile);
const scope = parameterFile?.scope ?? "global";
const scopeKey = parameterFile?.scopeKey ?? null;
if (!["global", "cohort", "user"].includes(scope)) {
  throw new Error("Nieprawidłowy scope w pliku parametrów.");
}
const scheduler = fsrs({
  request_retention: parameterFile?.requestRetention ?? 0.9,
  maximum_interval: parameterFile?.maximumInterval ?? 3650,
  enable_fuzz: false,
  ...(Array.isArray(parameterFile?.weights)
    ? { w: parameterFile.weights }
    : {}),
});

function grade(row) {
  if (!row.is_correct) return Rating.Again;
  if (row.session_kind === "classic" || row.rating_source === "observed") {
    return Rating.Good;
  }
  if (row.confidence === "nie_wiedzialem") return Rating.Hard;
  if (row.confidence === "na_pewno") return Rating.Easy;
  return Rating.Good;
}

function stateLabel(state) {
  if (state === State.Learning) return "learning";
  if (state === State.Review) return "review";
  if (state === State.Relearning) return "relearning";
  return "new";
}

function belongsToScope(row) {
  if (scope === "global") return true;
  if (scope === "cohort") return row.cohort_key === scopeKey;
  return row.user_id === scopeKey;
}

const output = createWriteStream(resolve(outputArg), { encoding: "utf8" });
let activeKey = null;
let activeUserId = null;
let activeQuestionId = null;
let activeCard = null;
let activeLastRating = null;
let cardCount = 0;
let attemptCount = 0;
let lineNumber = 0;

function flush() {
  if (!activeCard || !activeUserId || !activeQuestionId) return;
  output.write(
    `${JSON.stringify({
      user_id: activeUserId,
      question_id: activeQuestionId,
      scheduler_version: "memory-v2/ts-fsrs-5.4.1",
      parameter_set_id: parameterSetId,
      state: stateLabel(activeCard.state),
      stability: activeCard.stability,
      difficulty: activeCard.difficulty,
      elapsed_days: activeCard.elapsed_days,
      scheduled_days: activeCard.scheduled_days,
      learning_steps: activeCard.learning_steps,
      reps: activeCard.reps,
      lapses: activeCard.lapses,
      next_review: activeCard.due.toISOString(),
      last_answered_at: activeCard.last_review?.toISOString() ?? null,
      last_rating: activeLastRating,
      source: "replay",
      updated_at:
        activeCard.last_review?.toISOString() ?? activeCard.due.toISOString(),
    })}\n`,
  );
  cardCount += 1;
}

const input = createInterface({
  input: createReadStream(resolve(inputArg), { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const rawLine of input) {
  lineNumber += 1;
  const line = rawLine.trim();
  if (!line) continue;
  const row = JSON.parse(line);
  if (!belongsToScope(row)) continue;
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
    flush();
    activeKey = key;
    activeUserId = row.user_id;
    activeQuestionId = row.question_id;
    activeCard = createEmptyCard(reviewedAt);
    activeLastRating = null;
  } else if (activeCard?.last_review && reviewedAt < activeCard.last_review) {
    throw new Error(`Próby karty nie są chronologiczne w linii ${lineNumber}.`);
  }

  activeLastRating = grade(row);
  activeCard = scheduler.next(activeCard, reviewedAt, activeLastRating).card;
  attemptCount += 1;
}
flush();

await new Promise((resolveDone, reject) => {
  output.end(resolveDone);
  output.on("error", reject);
});

console.log(
  `Odbudowano ${cardCount.toLocaleString("pl-PL")} kart z ` +
    `${attemptCount.toLocaleString("pl-PL")} prób.`,
);
