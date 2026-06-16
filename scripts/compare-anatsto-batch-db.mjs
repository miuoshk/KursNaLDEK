#!/usr/bin/env node
/**
 * Porównanie batcha ANATSTO z aktywną anatomią w Supabase.
 * node scripts/compare-anatsto-batch-db.mjs /path/to/batch.sql
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const SOURCE_CODE_RE = /'(ANAT(?:LEK|STO)-\d+)'/;

function parseBatch(sql) {
  const tupleRe =
    /\((\d+),\s*'(ANA-[A-Z]+)',\s*\n\s*'((?:''|[^'])*)',\s*\n\s*'(\[[\s\S]*?\])'::jsonb,\s*\n\s*'([a-e])',[\s\S]*?'ANAT(?:LEK|STO)-(\d+)'\)/g;
  const prefix = sql.includes("ANATLEK-") ? "ANATLEK" : "ANATSTO";
  const rows = [];
  let m;
  while ((m = tupleRe.exec(sql)) !== null) {
    rows.push({
      seq: +m[1],
      topic: m[2],
      text: m[3].replace(/''/g, "'"),
      correct: m[5],
      srccode: `${prefix}-${m[6]}`,
    });
  }
  if (rows.length === 0) {
    throw new Error("parseBatch: nie znaleziono krotek VALUES");
  }
  return rows;
}

function normStem(s) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.:]+$/, "");
}

function stemSimilar(a, b) {
  const na = normStem(a);
  const nb = normStem(b);
  if (na === nb) return "exact_norm";
  if (na.length >= 12 && nb.length >= 12) {
    if (na.includes(nb) || nb.includes(na)) return "substring";
    const wa = na.split(" ").filter((w) => w.length > 3);
    const wb = new Set(nb.split(" ").filter((w) => w.length > 3));
    const overlap = wa.filter((w) => wb.has(w)).length;
    const ratio = overlap / Math.min(wa.length, wb.size || 1);
    if (ratio >= 0.85 && Math.abs(na.length - nb.length) < 25) return "fuzzy";
  }
  return null;
}

async function fetchAllAna(supabase) {
  const all = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, topic_id, text, correct_option_id, source_code, batch_label")
      .like("topic_id", "ANA-%")
      .eq("is_active", true)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return all;
}

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sqlPath = process.argv[2] || "/Users/miuoshk/Downloads/anatsto_batch_e2024_1.sql";
const outJsonArg = process.argv[3];
const sql = readFileSync(sqlPath, "utf8");
const batchLabelMatch = sql.match(/BATCH:\s*(e_anat(?:_sto)?_\d+\/\d+)/);
const batch = parseBatch(sql);
const supabase = createClient(url, key);
const db = await fetchAllAna(supabase);

const byText = new Map();
const byNorm = new Map();
for (const q of db) {
  byText.set(q.text, byText.get(q.text) || []);
  byText.get(q.text).push(q);
  const n = normStem(q.text);
  if (!byNorm.has(n)) byNorm.set(n, []);
  byNorm.get(n).push(q);
}

const internalCut = [];
const batchByText = new Map();
for (const r of batch) {
  if (!batchByText.has(r.text)) batchByText.set(r.text, []);
  batchByText.get(r.text).push(r);
}
for (const arr of batchByText.values()) {
  if (arr.length > 1) {
    for (let k = 1; k < arr.length; k++) internalCut.push(arr[k].srccode);
  }
}

const exactDb = [];
const nearDb = [];
const keyConflict = [];
const fresh = [];

for (const r of batch) {
  if (internalCut.includes(r.srccode)) continue;

  const hits = byText.get(r.text);
  if (hits?.length) {
    exactDb.push({
      srccode: r.srccode,
      topic: r.topic,
      text: r.text,
      correct: r.correct,
      matches: hits.map((h) => ({
        id: h.id,
        topic_id: h.topic_id,
        correct: h.correct_option_id,
        source_code: h.source_code,
      })),
    });
    const wrongKey = hits.some((h) => h.correct_option_id !== r.correct);
    if (wrongKey) {
      keyConflict.push({
        srccode: r.srccode,
        batchCorrect: r.correct,
        db: hits.map((h) => ({ id: h.id, correct: h.correct_option_id })),
      });
    }
    continue;
  }

  let bestNear = null;
  for (const q of db) {
    const sim = stemSimilar(r.text, q.text);
    if (sim) {
      if (!bestNear || sim === "exact_norm") {
        bestNear = { sim, q };
      }
    }
  }
  if (bestNear) {
    nearDb.push({
      srccode: r.srccode,
      topic: r.topic,
      text: r.text,
      correct: r.correct,
      sim: bestNear.sim,
      match: {
        id: bestNear.q.id,
        topic_id: bestNear.q.topic_id,
        text: bestNear.q.text,
        correct: bestNear.q.correct_option_id,
      },
    });
    if (bestNear.q.correct_option_id !== r.correct) {
      keyConflict.push({
        srccode: r.srccode,
        batchCorrect: r.correct,
        db: [{ id: bestNear.q.id, correct: bestNear.q.correct_option_id }],
        near: true,
      });
    }
    continue;
  }

  fresh.push(r);
}

const sourcePrefix = batch[0]?.srccode?.startsWith("ANATLEK") ? "ANATLEK" : "ANATSTO";
const sameSourceInDb = db.filter((q) => q.source_code?.startsWith(`${sourcePrefix}-`));

const out = {
  batchLabel: batchLabelMatch?.[1] ?? "unknown",
  sourceFile: sqlPath,
  sourcePrefix,
  batchCount: batch.length,
  dbAnaActive: db.length,
  sameSourceAlreadyInDb: sameSourceInDb.length,
  internalCut,
  exactDbCount: exactDb.length,
  nearDbCount: nearDb.length,
  keyConflictCount: keyConflict.length,
  freshCount: fresh.length,
  recommendedCut: [
    ...internalCut,
    ...exactDb.map((x) => x.srccode),
    ...nearDb.map((x) => x.srccode),
  ],
  exactDb,
  nearDb,
  keyConflict,
  fresh: fresh.map((r) => ({
    srccode: r.srccode,
    topic: r.topic,
    text: r.text,
  })),
};

const defaultOut = `exports/anat-${(batchLabelMatch?.[1] ?? "batch").replace(/\//g, "-")}-db-compare.json`;
const outPath = resolve(process.cwd(), outJsonArg || defaultOut);
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(
  JSON.stringify({
    batch: batch.length,
    internalCut: internalCut.length,
    exactDb: exactDb.length,
    nearDb: nearDb.length,
    keyConflict: keyConflict.length,
    fresh: fresh.length,
    recommendedCut: out.recommendedCut.length,
    sameSourceInDb: sameSourceInDb.length,
  }),
);
