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

const days = Math.max(1, Number(args.get("days") ?? 7));
const minAnswers = Math.max(100, Number(args.get("min-answers") ?? 1000));
const outputPath = resolve(
  args.get("output") ?? "exports/memory-v2-shadow.json",
);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    "Brak SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const since = new Date(Date.now() - days * 86_400_000).toISOString();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase.rpc("memory_v2_shadow_snapshot", {
  p_since: since,
});
if (error) throw error;

const metrics = Array.isArray(data) ? (data[0] ?? null) : data;
const violations = [];
const parameterFingerprint = metrics?.parameter_fingerprint ?? null;
const parameterActivatedAt = new Date(
  metrics?.parameter_activated_at ?? Number.NaN,
).getTime();
function metricValue(field) {
  const raw = metrics?.[field];
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
if (!metrics || Number(metrics.answers) < minAnswers) {
  violations.push(`Shadow wymaga co najmniej ${minAnswers} odpowiedzi.`);
}
if (!/^[a-f0-9]{64}$/.test(parameterFingerprint ?? "")) {
  violations.push("Shadow nie jest spięty z aktywnym zestawem parametrów.");
}
if (
  !Number.isFinite(parameterActivatedAt) ||
  Date.now() - parameterActivatedAt < days * 86_400_000
) {
  violations.push(
    `Aktywny zestaw parametrów musi zbierać shadow przez pełne ${days} dni.`,
  );
}
if (Number(metrics?.projection_coverage ?? 0) < 0.99) {
  violations.push("Pokrycie projekcji shadow jest niższe niż 99%.");
}
if (Number(metrics?.scored_answers ?? 0) < 100) {
  violations.push("Shadow wymaga co najmniej 100 prób z predykcją obu modeli.");
}
if (Number(metrics?.backfill_coverage ?? 0) < 0.99) {
  violations.push(
    "Pokrycie historycznych kart stanem memory v2 jest niższe niż 99%.",
  );
}
for (const [controlField, shadowField, label] of [
  ["control_brier_score", "shadow_brier_score", "Brier score"],
  ["control_log_loss", "shadow_log_loss", "Log loss"],
]) {
  const controlMetric = metricValue(controlField);
  const shadowMetric = metricValue(shadowField);
  if (controlMetric == null || shadowMetric == null) {
    violations.push(`Brak wystarczających predykcji: ${label}.`);
  } else if (shadowMetric > controlMetric * 1.02) {
    violations.push(`${label} shadow pogorszył się o więcej niż 2%.`);
  }
}
if (Number(metrics?.memory_cards ?? 0) === 0) {
  violations.push("Brak odbudowanych lub zapisanych kart pamięci v2.");
}

const report = {
  experimentKey: "memory-v2-rollout",
  evaluatedAt: new Date().toISOString(),
  stage: "shadow",
  parameterFingerprint,
  since,
  days,
  minAnswers,
  decision: violations.length === 0 ? "pass" : "hold",
  violations,
  notes: [],
  metrics,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Zapisano raport shadow: ${outputPath}`);
console.log(`Decyzja: ${report.decision}`);
if (violations.length > 0) process.exitCode = 2;
