#!/usr/bin/env node
/**
 * Buduje deduped SQL z batcha — zostawia tylko wskazane ANATSTO.
 * node scripts/build-anatsto-deduped-sql.mjs <src.sql> <keep.json|codes.csv> <out.sql>
 */
import { readFileSync, writeFileSync } from "node:fs";

const srcPath = process.argv[2];
const keepPath = process.argv[3];
const outPath = process.argv[4];
if (!srcPath || !keepPath || !outPath) {
  console.error(
    "Usage: node scripts/build-anatsto-deduped-sql.mjs src.sql keep.json out.sql",
  );
  process.exit(1);
}

const sql = readFileSync(srcPath, "utf8");
const keepRaw = readFileSync(keepPath, "utf8");
let keepCodes;
if (keepPath.endsWith(".json")) {
  const j = JSON.parse(keepRaw);
  keepCodes = new Set(
    (j.fresh || j.keep || j).map((x) =>
      typeof x === "string" ? x : x.srccode,
    ),
  );
} else {
  keepCodes = new Set(
    keepRaw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => /^ANAT(?:LEK|STO)-/.test(s)),
  );
}

const blockRe = /\(\d+,\s*'ANA-[A-Z]+',[\s\S]*?'ANAT(?:LEK|STO)-\d+'\)/g;
const blocks = [];
let m;
while ((m = blockRe.exec(sql)) !== null) {
  const block = m[0];
  const seqM = block.match(/^\((\d+),/);
  const codeM = block.match(/'(ANAT(?:LEK|STO)-\d+)'\s*\)?$/);
  if (!seqM || !codeM) continue;
  blocks.push({
    seq: +seqM[1],
    code: codeM[1],
    block,
  });
}

const kept = blocks
  .filter((b) => keepCodes.has(b.code))
  .sort((a, b) => a.seq - b.seq);

if (kept.length !== keepCodes.size) {
  const missing = [...keepCodes].filter(
    (c) => !kept.some((b) => b.code === c),
  );
  const extra = kept.filter((b) => !keepCodes.has(b.code));
  console.error("Mismatch:", {
    want: keepCodes.size,
    got: kept.length,
    missing,
    extra: extra.map((b) => b.code),
  });
  process.exit(1);
}

const valuesBody = kept
  .map((b, i) => {
    const newSeq = i + 1;
    return b.block.replace(/^\(\d+,/, `(${newSeq},`);
  })
  .join(",\n");

const headerMatch = sql.match(/^[\s\S]*?WITH new_rows[\s\S]*?VALUES\s*\n/);
const footerMatch = sql.match(/\),\s*\nmaxes AS \([\s\S]*$/);
if (!headerMatch || !footerMatch) {
  console.error("Nie znaleziono nagłówka VALUES lub stopki maxes/INSERT");
  process.exit(1);
}

let header = headerMatch[0];
header = header.replace(
  /^-- ============================================================[\s\S]*?^-- ============================================================\n\n/m,
  "",
);
const batchLabel =
  sql.match(/BATCH:\s*(e_anat(?:_sto)?_\d+\/\d+)/)?.[1] ?? "e_anat_????";
const sourceLine =
  sql.match(/^-- Źródło:.*$/m)?.[0]?.replace(/^-- /, "") ??
  "Egzamin anatomia";
const origCount = blocks.length;
const cutCount = origCount - kept.length;
const year = batchLabel.match(/(\d{4})/)?.[1] ?? "????";
const batchN = batchLabel.split("/")[1];
const channel = batchLabel.includes("_sto_") ? "sto" : "lek";
const auditName = `exports/anatomia-batch-${channel}-${year}-${batchN}-dedup-audit.md`;

const customHeader = `-- ============================================================
-- BATCH: ${batchLabel}  ·  subject_id=anatomia  ·  SHARED (oba kierunki, tracks=NULL)
-- ${sourceLine}
-- tracks NULL (anatomia wspólna) · source_code = oryginalne ANATSTO-NNN
-- Self-numbering id per dział = max seq z bazy + 1
--
-- Wersja po dedup (2026-05-28): ${kept.length} pytań — wycięte ${cutCount} duplikaty (batch + baza).
-- Audyt: ${auditName}
-- ============================================================

`;

const out =
  customHeader +
  "WITH new_rows (seq, topic_id, qtext, opts, correct, expl, subtheme, srccode) AS (\n VALUES\n" +
  valuesBody +
  "\n" +
  footerMatch[0].replace(/^\),\s*\n/, "),\n");

writeFileSync(outPath, out);
console.log(JSON.stringify({ out: outPath, kept: kept.length, codes: kept.map((b) => b.code) }));
