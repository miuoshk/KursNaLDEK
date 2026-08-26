#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key?.startsWith("--") && value != null) args.set(key.slice(2), value);
}

const experimentKey = args.get("experiment");
const replayPath = args.get("replay") ?? null;
const shadowPath = args.get("shadow") ?? null;
const outputPath = resolve(
  args.get("output") ?? `exports/${experimentKey ?? "learning"}-preflight.json`,
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
if (experimentKey === "memory-v2-rollout" && (!replayPath || !shadowPath)) {
  throw new Error(
    "Pierwszy rollout pamięci v2 wymaga --replay comparison.json " +
      "oraz --shadow shadow.json.",
  );
}

function runCheck(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: resolve("."),
    encoding: "utf8",
    env: process.env,
  });
  return {
    ok: result.status === 0,
    exitCode: result.status,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`
      .trim()
      .slice(-4000),
  };
}

const typecheck = runCheck("npx", ["tsc", "--noEmit"]);
const tests = runCheck("npm", ["test"]);
const migrations = runCheck("npm", ["run", "learning:migrations:test"]);
const violations = [];
if (!typecheck.ok) violations.push("Type-check nie przeszedł.");
if (!tests.ok) violations.push("Testy nie przeszły.");
if (!migrations.ok) violations.push("Walidacja migracji nie przeszła.");

let replay = null;
if (replayPath) {
  replay = JSON.parse(await readFile(resolve(replayPath), "utf8"));
  const replayEvaluatedAt = new Date(replay.evaluatedAt).getTime();
  if (
    replay.decision !== "pass" ||
    !Array.isArray(replay.violations) ||
    replay.violations.length > 0
  ) {
    violations.push("Replay offline nie zezwala na rollout.");
  }
  if (
    experimentKey === "memory-v2-rollout" &&
    (replay.experimentKey !== experimentKey ||
      replay.stage !== "offline-replay" ||
      !replay.holdoutAfter ||
      replay.v2Config === "default" ||
      !/^[a-f0-9]{64}$/.test(replay.parameterFingerprint ?? "") ||
      !Number.isFinite(replayEvaluatedAt) ||
      replayEvaluatedAt < Date.now() - 72 * 3_600_000)
  ) {
    violations.push(
      "Replay pamięci v2 musi używać wersjonowanych parametrów i holdoutu.",
    );
  }
}

let shadow = null;
if (shadowPath) {
  shadow = JSON.parse(await readFile(resolve(shadowPath), "utf8"));
  const evaluatedAt = new Date(shadow.evaluatedAt).getTime();
  if (
    shadow.experimentKey !== "memory-v2-rollout" ||
    shadow.stage !== "shadow" ||
    shadow.parameterFingerprint !== replay?.parameterFingerprint ||
    shadow.decision !== "pass" ||
    !Array.isArray(shadow.violations) ||
    shadow.violations.length > 0 ||
    !Number.isFinite(evaluatedAt) ||
    evaluatedAt < Date.now() - 72 * 3_600_000
  ) {
    violations.push("Shadow pamięci v2 nie zezwala na rollout.");
  }
}

const report = {
  experimentKey,
  evaluatedAt: new Date().toISOString(),
  stage: "preflight",
  parameterFingerprint: replay?.parameterFingerprint ?? null,
  decision: violations.length === 0 ? "pass" : "hold",
  violations,
  notes: [
    "Raport preflight zezwala wyłącznie na pierwszy canary 0% → 5%.",
    "Kolejne etapy wymagają raportu metryk kohortowych.",
  ],
  metrics: {
    typecheck,
    tests,
    migrations,
    replay,
    shadow,
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Zapisano preflight: ${outputPath}`);
console.log(`Decyzja: ${report.decision}`);
if (violations.length > 0) process.exitCode = 2;
