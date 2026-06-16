#!/usr/bin/env node
/**
 * Audyt biasu długości opcji w PHUM-*-GEN (lokalny JSON albo live z Supabase).
 *
 *   node scripts/phum-gen-audit-length.mjs --from exports/prof-humanizm-gen-backup-2026-06-13.json
 *   node scripts/phum-gen-audit-length.mjs --live
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PHUM_GEN_TOPICS = ["PHUM-PSY-GEN", "PHUM-SOC-GEN", "PHUM-PRO-GEN"];

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function analyzeQuestion(q) {
  const options = q.options ?? [];
  const lens = Object.fromEntries(options.map((o) => [o.id, (o.text ?? "").trim().length]));
  const sorted = Object.entries(lens).sort((a, b) => b[1] - a[1]);
  const maxLen = sorted[0][1];
  const longestIds = sorted.filter(([, l]) => l === maxLen).map(([id]) => id);
  const correctId = q.correct_option_id ?? q.correctOptionId;
  const rank = sorted.findIndex(([id]) => id === correctId) + 1;
  const onlyLongest = longestIds.length === 1 && longestIds[0] === correctId;
  const distLens = options.filter((o) => o.id !== correctId).map((o) => lens[o.id]);
  const avgDist = distLens.reduce((a, b) => a + b, 0) / distLens.length;
  const ratio = lens[correctId] / avgDist;
  return { id: q.id, topic_id: q.topic_id, rank, onlyLongest, ratio, correctId };
}

function summarize(rows) {
  const n = rows.length;
  const onlyLongest = rows.filter((r) => analyzeQuestion(r).onlyLongest).length;
  const rank1 = rows.filter((r) => analyzeQuestion(r).rank === 1).length;
  const rankSum = rows.reduce((s, r) => s + analyzeQuestion(r).rank, 0);
  return {
    n,
    onlyLongest,
    onlyLongestPct: ((100 * onlyLongest) / n).toFixed(1) + "%",
    rank1,
    rank1Pct: ((100 * rank1) / n).toFixed(1) + "%",
    avgRank: (rankSum / n).toFixed(2),
  };
}

function parseArgs(argv) {
  const args = { from: null, live: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--from" && argv[i + 1]) args.from = argv[++i];
    else if (argv[i] === "--live") args.live = true;
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.from && !args.live)) {
    console.log(`Użycie:
  node scripts/phum-gen-audit-length.mjs --from <backup.json>
  node scripts/phum-gen-audit-length.mjs --live
`);
    process.exit(args.help ? 0 : 1);
  }

  let rows;
  if (args.live) {
    loadEnvLocal();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Brak env Supabase");
      process.exit(1);
    }
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("questions")
      .select("id, topic_id, options, correct_option_id")
      .in("topic_id", PHUM_GEN_TOPICS)
      .eq("is_active", true)
      .order("id");
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    rows = data ?? [];
  } else {
    const backup = JSON.parse(readFileSync(resolve(args.from), "utf8"));
    rows = backup.questions ?? [];
  }

  const overall = summarize(rows);
  console.log("=== AUDYT DŁUGOŚCI (poprawna = jedyna najdłuższa) ===");
  console.log(overall);

  for (const topicId of PHUM_GEN_TOPICS) {
    const subset = rows.filter((r) => r.topic_id === topicId);
    if (subset.length === 0) continue;
    console.log(topicId + ":", summarize(subset));
  }

  const bad = rows
    .map((r) => analyzeQuestion(r))
    .filter((a) => a.onlyLongest)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10);
  if (bad.length) {
    console.log("\nTop 10 (poprawna jedyna najdłuższa):");
    for (const b of bad) console.log(`  ${b.id} rank=${b.rank} ratio=${b.ratio.toFixed(2)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
