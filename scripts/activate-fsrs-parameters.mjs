#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertFsrsParameterFingerprint } from "./lib/fsrs-parameter-fingerprint.mjs";

const apply = process.argv.includes("--apply");
const fileArg = process.argv.slice(2).find((value) => !value.startsWith("--"));
if (!fileArg) {
  console.error(
    "Użycie: node scripts/activate-fsrs-parameters.mjs <parameters.json> [--apply]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (apply && (!url || !serviceRole)) {
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const input = JSON.parse(await readFile(resolve(fileArg), "utf8"));
const minimum = { global: 10_000, cohort: 5_000, user: 300 };
if (
  input.schedulerVersion !== "memory-v2/ts-fsrs-5.4.1" ||
  input.optimizerVersion !== "@open-spaced-repetition/binding@0.5.0"
) {
  throw new Error(
    "Wersja schedulera lub optimizera nie jest zgodna z runtime.",
  );
}
if (!minimum[input.scope] || input.sampleSize < minimum[input.scope]) {
  throw new Error("Parametry nie spełniają minimalnej liczebności próby.");
}
if (
  !Array.isArray(input.weights) ||
  input.weights.length !== 21 ||
  input.weights.some((value) => !Number.isFinite(value))
) {
  throw new Error("Nieprawidłowa tablica wag FSRS.");
}
const parameterFingerprint = assertFsrsParameterFingerprint(input);

const scopeKey = typeof input.scopeKey === "string" ? input.scopeKey : "";
const [product, track] =
  input.scope === "cohort" ? scopeKey.split(":", 2) : [null, null];
const userId = input.scope === "user" ? scopeKey : null;
if (input.scope !== "global" && !scopeKey) {
  throw new Error("Dla scope cohort/user wymagany jest scopeKey.");
}

if (!apply) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        schedulerVersion: input.schedulerVersion,
        scope: input.scope,
        scopeKey: input.scopeKey,
        sampleSize: input.sampleSize,
        logLoss: input.logLoss,
        rmseBins: input.rmseBins,
      },
      null,
      2,
    ),
  );
  console.log("Dodaj --apply, aby aktywować zestaw parametrów.");
  process.exit(0);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.rpc("activate_fsrs_parameter_set", {
  p_scheduler_version: input.schedulerVersion,
  p_scope: input.scope,
  p_product: product,
  p_track: track || null,
  p_user_id: userId,
  p_weights: input.weights,
  p_request_retention: input.requestRetention,
  p_maximum_interval: input.maximumInterval,
  p_sample_size: input.sampleSize,
  p_log_loss: input.logLoss,
  p_rmse_bins: input.rmseBins,
  p_optimized_at: input.optimizedAt,
  p_metadata: {
    optimizerVersion: input.optimizerVersion,
    cardCount: input.cardCount,
    seed: input.seed,
    durationSeconds: input.durationSeconds,
    parameterFingerprint,
  },
});
if (error) throw error;

console.log(`Aktywowano zestaw parametrów ${data}`);
