#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { createEmptyCard, fsrs, Rating, State } from "ts-fsrs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value != null) args.set(key.slice(2), value);
}
const positionalInput =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? process.argv[2]
    : undefined;
const positionalOutput =
  positionalInput && process.argv[3] && !process.argv[3].startsWith("--")
    ? process.argv[3]
    : undefined;
const inputArg = args.get("input") ?? positionalInput;
const outputArg =
  args.get("output") ??
  positionalOutput ??
  "exports/learning-replay-baseline.md";

if (!inputArg) {
  console.error(
    "Użycie: node scripts/replay-learning-history.mjs " +
      "--input sorted.jsonl [--output raport.md]",
  );
  process.exit(1);
}

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: false,
});

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);
const DAY_MS = 86_400_000;
const EPSILON = 1e-6;

const totals = {
  attempts: 0,
  cards: 0,
  predictedAttempts: 0,
  brierSum: 0,
  logLossSum: 0,
  delayedAttempts: 0,
  delayedCorrect: 0,
  totalTimeSeconds: 0,
};

const modes = new Map();
const confidence = new Map();

function modeBucket(mode) {
  const key = mode || "unknown";
  if (!modes.has(key)) {
    modes.set(key, { attempts: 0, correct: 0, totalTimeSeconds: 0 });
  }
  return modes.get(key);
}

function confidenceBucket(value) {
  const key = value || "brak";
  if (!confidence.has(key)) {
    confidence.set(key, { attempts: 0, correct: 0 });
  }
  return confidence.get(key);
}

function gradeFor(row) {
  if (!row.is_correct) return Rating.Again;
  if (row.session_kind === "classic" || row.rating_source === "observed") {
    return Rating.Good;
  }
  switch (row.confidence) {
    case "nie_wiedzialem":
      return Rating.Hard;
    case "na_pewno":
      return Rating.Easy;
    case "troche":
    default:
      return Rating.Good;
  }
}

function probability(card, now) {
  if (card.state === State.New || !card.last_review) return null;
  const value = scheduler.get_retrievability(card, now, false);
  return Number.isFinite(value)
    ? Math.min(1 - EPSILON, Math.max(EPSILON, value))
    : null;
}

function percentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

let activeKey = null;
let card = null;
let previousReview = null;
let lineNumber = 0;
let datasetEndMs = Number.NEGATIVE_INFINITY;
const finalDueTimes = [];

const input = createInterface({
  input: createReadStream(inputPath, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const rawLine of input) {
  lineNumber += 1;
  const line = rawLine.trim();
  if (!line) continue;

  let row;
  try {
    row = JSON.parse(line);
  } catch (error) {
    throw new Error(`Nieprawidłowy JSON w linii ${lineNumber}`, {
      cause: error,
    });
  }

  const key = `${row.user_id}\u0000${row.question_id}`;
  const reviewedAt = new Date(row.answered_at);
  if (!row.user_id || !row.question_id || Number.isNaN(reviewedAt.getTime())) {
    throw new Error(`Brak wymaganych pól w linii ${lineNumber}`);
  }

  if (activeKey != null && key < activeKey) {
    throw new Error(
      `Wejście nie jest posortowane po użytkowniku i pytaniu (linia ${lineNumber}).`,
    );
  }
  if (key !== activeKey) {
    if (card?.due) finalDueTimes.push(new Date(card.due).getTime());
    activeKey = key;
    card = createEmptyCard(reviewedAt);
    previousReview = null;
    totals.cards += 1;
  } else if (previousReview && reviewedAt < previousReview) {
    throw new Error(`Próby karty nie są chronologiczne w linii ${lineNumber}.`);
  }

  const isCorrect = Boolean(row.is_correct);
  datasetEndMs = Math.max(datasetEndMs, reviewedAt.getTime());
  const predicted = probability(card, reviewedAt);
  if (predicted != null) {
    const outcome = isCorrect ? 1 : 0;
    totals.predictedAttempts += 1;
    totals.brierSum += (predicted - outcome) ** 2;
    totals.logLossSum += -(
      outcome * Math.log(predicted) +
      (1 - outcome) * Math.log(1 - predicted)
    );
  }

  if (previousReview) {
    const gapDays = (reviewedAt.getTime() - previousReview.getTime()) / DAY_MS;
    if (gapDays >= 7 && gapDays <= 30) {
      totals.delayedAttempts += 1;
      if (isCorrect) totals.delayedCorrect += 1;
    }
  }

  const timeSeconds = Math.max(0, Number(row.time_spent_seconds) || 0);
  totals.attempts += 1;
  totals.totalTimeSeconds += timeSeconds;

  const byMode = modeBucket(row.session_kind);
  byMode.attempts += 1;
  byMode.correct += isCorrect ? 1 : 0;
  byMode.totalTimeSeconds += timeSeconds;

  const byConfidence = confidenceBucket(row.confidence);
  byConfidence.attempts += 1;
  byConfidence.correct += isCorrect ? 1 : 0;

  card = scheduler.next(card, reviewedAt, gradeFor(row)).card;
  previousReview = reviewedAt;
}
if (card?.due) finalDueTimes.push(new Date(card.due).getTime());

const delayedAccuracy =
  totals.delayedAttempts > 0
    ? totals.delayedCorrect / totals.delayedAttempts
    : Number.NaN;
const avgSeconds =
  totals.attempts > 0 ? totals.totalTimeSeconds / totals.attempts : Number.NaN;
const brier =
  totals.predictedAttempts > 0
    ? totals.brierSum / totals.predictedAttempts
    : Number.NaN;
const logLoss =
  totals.predictedAttempts > 0
    ? totals.logLossSum / totals.predictedAttempts
    : Number.NaN;
const dueBacklog = Number.isFinite(datasetEndMs)
  ? finalDueTimes.filter(
      (dueAt) => Number.isFinite(dueAt) && dueAt <= datasetEndMs,
    ).length
  : 0;

const report = [
  "# Replay historii nauki — baseline",
  "",
  `Źródło: \`${inputPath}\`  `,
  `Wygenerowano: ${new Date().toISOString()}`,
  "",
  "## Główne metryki",
  "",
  `- Próby: ${totals.attempts.toLocaleString("pl-PL")}`,
  `- Karty: ${totals.cards.toLocaleString("pl-PL")}`,
  `- Próby z predykcją FSRS: ${totals.predictedAttempts.toLocaleString("pl-PL")}`,
  `- Brier score: ${number(brier, 4)}`,
  `- Log loss: ${number(logLoss, 4)}`,
  `- Odroczona poprawność 7–30 dni: ${
    Number.isFinite(delayedAccuracy) ? percentage(delayedAccuracy) : "—"
  } (n=${totals.delayedAttempts.toLocaleString("pl-PL")})`,
  `- Średni czas odpowiedzi: ${number(avgSeconds, 1)} s`,
  `- Backlog na końcu eksportu: ${dueBacklog.toLocaleString("pl-PL")} kart`,
  "",
  "## Tryby sesji",
  "",
  ...[...modes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mode, value]) => {
      const accuracy =
        value.attempts > 0 ? value.correct / value.attempts : Number.NaN;
      const time =
        value.attempts > 0
          ? value.totalTimeSeconds / value.attempts
          : Number.NaN;
      return `- ${mode}: n=${value.attempts.toLocaleString("pl-PL")}, poprawność=${percentage(
        accuracy,
      )}, czas=${number(time, 1)} s`;
    }),
  "",
  "## Kalibracja deklarowanej pewności",
  "",
  ...[...confidence.entries()].map(([value, bucket]) => {
    const accuracy =
      bucket.attempts > 0 ? bucket.correct / bucket.attempts : Number.NaN;
    return `- ${value}: n=${bucket.attempts.toLocaleString(
      "pl-PL",
    )}, poprawność=${percentage(accuracy)}`;
  }),
  "",
  "## Reguły replayu",
  "",
  "- Wejście musi być posortowane po `user_id`, `question_id`, `answered_at`.",
  "- Klasyczna nauka nie korzysta z historycznej automatycznej pewności: poprawna odpowiedź = Good, błąd = Again.",
  "- Brier i log loss liczone są tylko od drugiej próby karty, gdy istnieje predykcja przypomnienia.",
  "- Fuzz jest wyłączony, dzięki czemu replay jest deterministyczny.",
  "",
].join("\n");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, report, "utf8");
console.log(`Zapisano raport: ${outputPath}`);
