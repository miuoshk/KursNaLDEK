#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const args = new Map();
let apply = false;
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (value === "--apply") {
    apply = true;
    continue;
  }
  if (value?.startsWith("--")) {
    args.set(value.slice(2), process.argv[index + 1]);
    index += 1;
  }
}

const experimentKey = args.get("experiment");
const targetPercent = Number(args.get("percent"));
const reportPath = args.get("report");
const actor = args.get("actor") ?? process.env.USER ?? "rollout-script";
const allowedExperiments = new Set([
  "memory-v2-rollout",
  "adaptive-feedback-v1",
  "daily-plan-v1",
]);

if (
  !experimentKey ||
  !allowedExperiments.has(experimentKey) ||
  ![0, 5, 25, 100].includes(targetPercent)
) {
  console.error(
    "Użycie: node scripts/set-learning-experiment-rollout.mjs " +
      "--experiment memory-v2-rollout|adaptive-feedback-v1|daily-plan-v1 " +
      "--percent 0|5|25|100 [--report guardrails.json] [--actor nazwa] --apply",
  );
  process.exit(1);
}

let report = {};
if (targetPercent > 0) {
  if (!reportPath) {
    throw new Error("Zwiększenie rolloutu wymaga --report guardrails.json");
  }
  report = JSON.parse(await readFile(reportPath, "utf8"));
  if (
    report.experimentKey !== experimentKey ||
    report.decision !== "pass" ||
    !Array.isArray(report.violations) ||
    report.violations.length > 0 ||
    !Number.isFinite(new Date(report.evaluatedAt).getTime()) ||
    new Date(report.evaluatedAt).getTime() < Date.now() - 72 * 3_600_000 ||
    (targetPercent === 5 && report.stage !== "preflight") ||
    (targetPercent > 5 && report.stage !== "cohort") ||
    (experimentKey === "memory-v2-rollout" &&
      !/^[a-f0-9]{64}$/.test(report.parameterFingerprint ?? ""))
  ) {
    throw new Error("Raport guardraili nie zezwala na rollout.");
  }
}

if (!apply) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        experimentKey,
        targetPercent,
        actor,
        report,
      },
      null,
      2,
    ),
  );
  console.log("Dodaj --apply, aby zmienić konfigurację.");
  process.exit(0);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    "Brak SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error } = await supabase.rpc("set_learning_experiment_rollout", {
  p_experiment_key: experimentKey,
  p_to_percent: targetPercent,
  p_report: report,
  p_applied_by: actor,
});
if (error) throw error;

console.log(
  `${experimentKey}: ustawiono rollout ${targetPercent}% (aktor: ${actor}).`,
);
