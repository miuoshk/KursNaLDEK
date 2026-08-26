#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value != null) args.set(key.slice(2), value);
}

const experimentKey = args.get("experiment");
const days = Math.max(1, Number(args.get("days") ?? 14));
const minUsers = Math.max(1, Number(args.get("min-users") ?? 20));
const requireCem = args.get("require-cem") === "true";
const outputPath = resolve(
  args.get("output") ??
    `exports/${experimentKey ?? "learning"}-guardrails.json`,
);
const allowedExperiments = new Set([
  "memory-v2-rollout",
  "adaptive-feedback-v1",
  "daily-plan-v1",
]);
if (!experimentKey || !allowedExperiments.has(experimentKey)) {
  throw new Error(
    "Podaj --experiment memory-v2-rollout|adaptive-feedback-v1|daily-plan-v1",
  );
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
const { data: experimentConfig, error: configError } = await supabase
  .from("learning_experiment_configs")
  .select("rollout_percent, updated_at")
  .eq("experiment_key", experimentKey)
  .single();
if (configError) throw configError;
const { data: latestRollout, error: rolloutError } = await supabase
  .from("learning_experiment_rollouts")
  .select("to_percent, applied_at")
  .eq("experiment_key", experimentKey)
  .order("applied_at", { ascending: false })
  .limit(1)
  .maybeSingle();
if (rolloutError) throw rolloutError;
const stageStartedAt = new Date(
  latestRollout?.applied_at ?? experimentConfig.updated_at,
);
if (Number.isNaN(stageStartedAt.getTime())) {
  throw new Error("Brak poprawnej daty rozpoczęcia etapu rolloutu.");
}
const requestedSince = Date.now() - days * 86_400_000;
const since = new Date(
  Math.max(requestedSince, stageStartedAt.getTime()),
).toISOString();
const stageAgeDays = (Date.now() - stageStartedAt.getTime()) / 86_400_000;
const rolloutPercent = Number(experimentConfig.rollout_percent ?? 0);
const { data, error } = await supabase.rpc(
  "learning_experiment_metric_snapshot",
  {
    p_experiment_key: experimentKey,
    p_since: since,
  },
);
if (error) throw error;

const rows = Array.isArray(data) ? data : [];
const control = rows.find((row) => row.variant === "control");
const treatment = rows.find((row) => row.variant === "treatment");
let parameterFingerprint = null;
if (experimentKey === "memory-v2-rollout") {
  const { data: parameterSet, error: parameterError } = await supabase
    .from("fsrs_parameter_sets")
    .select("metadata")
    .eq("scheduler_version", "memory-v2/ts-fsrs-5.4.1")
    .eq("scope", "global")
    .eq("active", true)
    .maybeSingle();
  if (parameterError) throw parameterError;
  parameterFingerprint = parameterSet?.metadata?.parameterFingerprint ?? null;
}
const violations = [];
const notes = [];
function metricValue(row, metric) {
  const raw = row?.[metric];
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
if (
  rolloutPercent > 0 &&
  (!Number.isFinite(stageAgeDays) || stageAgeDays < days)
) {
  violations.push(
    `Bieżący etap ${rolloutPercent}% trwa ${stageAgeDays.toFixed(1)} dnia; wymagane pełne ${days} dni.`,
  );
}

if (!control || !treatment) {
  violations.push("Brak obu wariantów w oknie pomiarowym.");
} else {
  if (
    experimentKey === "memory-v2-rollout" &&
    !/^[a-f0-9]{64}$/.test(parameterFingerprint ?? "")
  ) {
    violations.push("Brak odcisku aktywnego globalnego zestawu parametrów.");
  }
  if (Number(control.users) < minUsers || Number(treatment.users) < minUsers) {
    violations.push(
      `Każdy wariant wymaga co najmniej ${minUsers} użytkowników.`,
    );
  }

  function relativeIncrease(metric, limitPct, label) {
    const baseline = metricValue(control, metric);
    const candidate = metricValue(treatment, metric);
    if (baseline == null || candidate == null) {
      violations.push(`Brak wystarczających danych: ${label}.`);
      return;
    }
    if (baseline === 0) {
      if (candidate > 0) {
        violations.push(
          `${label}: wariant kontrolny 0, treatment ${candidate}.`,
        );
      }
      return;
    }
    const changePct = ((candidate - baseline) / baseline) * 100;
    if (changePct > limitPct) {
      violations.push(
        `${label}: wzrost ${changePct.toFixed(1)}% przekracza ${limitPct}%.`,
      );
    }
  }

  function absoluteDrop(metric, limitPoints, label) {
    const baseline = metricValue(control, metric);
    const candidate = metricValue(treatment, metric);
    if (baseline == null || candidate == null) {
      violations.push(`Brak wystarczających danych: ${label}.`);
      return;
    }
    const dropPoints = (baseline - candidate) * 100;
    if (dropPoints > limitPoints) {
      violations.push(
        `${label}: spadek ${dropPoints.toFixed(1)} p.p. przekracza ${limitPoints} p.p.`,
      );
    }
  }

  function relativeDrop(metric, limitPct, label) {
    const baseline = metricValue(control, metric);
    const candidate = metricValue(treatment, metric);
    if (baseline == null || candidate == null || baseline === 0) {
      violations.push(`Brak wystarczających danych: ${label}.`);
      return;
    }
    const dropPct = ((baseline - candidate) / baseline) * 100;
    if (dropPct > limitPct) {
      violations.push(
        `${label}: spadek ${dropPct.toFixed(1)}% przekracza ${limitPct}%.`,
      );
    }
  }

  relativeIncrease("average_time_seconds", 10, "Czas na pytanie");
  relativeIncrease("average_due_backlog", 10, "Backlog");
  relativeIncrease(
    "error_reports_per_1000_answers",
    20,
    "Zgłoszenia błędów treści",
  );
  relativeIncrease("brier_score", 2, "Brier score");
  relativeIncrease("log_loss", 2, "Log loss");
  if (experimentKey === "memory-v2-rollout") {
    const fallbackRate = metricValue(treatment, "memory_fallback_rate");
    if (fallbackRate == null) {
      violations.push("Brak pomiaru fallbacku pamięci v2.");
    } else if (fallbackRate > 0.01) {
      violations.push(
        `Fallback pamięci v2: ${(fallbackRate * 100).toFixed(1)}% przekracza 1%.`,
      );
    }
  }
  absoluteDrop("completion_rate", 5, "Ukończenie sesji");
  relativeDrop("active_days_per_user", 10, "Aktywne dni");

  if (
    Number(control.delayed_attempts) >= 100 &&
    Number(treatment.delayed_attempts) >= 100
  ) {
    absoluteDrop("delayed_accuracy", 2, "Odroczona poprawność 7–30 dni");
  } else {
    violations.push(
      "Za mało odroczonych prób 7–30 dni (minimum 100 na wariant).",
    );
  }
  const controlCemAttempts =
    metricValue(control, "protected_cem_attempts") ?? 0;
  const treatmentCemAttempts =
    metricValue(treatment, "protected_cem_attempts") ?? 0;
  if (
    controlCemAttempts >= 100 &&
    treatmentCemAttempts >= 100 &&
    (metricValue(control, "protected_cem_correct_per_minute") ?? 0) > 0 &&
    metricValue(treatment, "protected_cem_correct_per_minute") != null
  ) {
    relativeDrop("protected_cem_correct_per_minute", 5, "Wynik CEM na minutę");
  } else {
    const message =
      "Za mało diagnostyki chronionej rezerwy CEM " +
      `(minimum 100 prób na wariant; control=${controlCemAttempts}, ` +
      `treatment=${treatmentCemAttempts}).`;
    if (requireCem) violations.push(message);
    else notes.push(message);
  }
}

const result = {
  experimentKey,
  evaluatedAt: new Date().toISOString(),
  stage: "cohort",
  rolloutPercent,
  stageStartedAt: stageStartedAt.toISOString(),
  since,
  days,
  minUsers,
  requireCem,
  parameterFingerprint,
  decision: violations.length === 0 ? "pass" : "hold",
  violations,
  notes,
  metrics: { control: control ?? null, treatment: treatment ?? null },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`Zapisano raport: ${outputPath}`);
console.log(`Decyzja: ${result.decision}`);
if (violations.length > 0) {
  for (const violation of violations) console.log(`- ${violation}`);
  process.exitCode = 2;
}
