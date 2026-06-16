#!/usr/bin/env node
import fs from 'fs';

const sqlPath = process.argv[2] || '/Users/miuoshk/Downloads/anatsto_batch_e2024_1.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');
const tupleRe =
  /\((\d+),\s*'(ANA-[A-Z]+)',\s*\n\s*'((?:''|[^'])*)',[\s\S]*?'ANATSTO-(\d+)'\)/g;
const rows = [];
let m;
while ((m = tupleRe.exec(sql)) !== null) {
  rows.push({
    seq: +m[1],
    topic: m[2],
    text: m[3].replace(/''/g, "'"),
    srccode: `ANATSTO-${m[4]}`,
  });
}

const byText = new Map();
for (const r of rows) {
  if (!byText.has(r.text)) byText.set(r.text, []);
  byText.get(r.text).push(r);
}
const internalCut = [];
for (const arr of byText.values()) {
  if (arr.length > 1) {
    for (let k = 1; k < arr.length; k++) internalCut.push(arr[k].srccode);
  }
}

const esc = (s) => s.replace(/'/g, "''");
const values = rows.map((r) => `('${esc(r.text)}','${r.srccode}')`).join(',\n');

fs.writeFileSync(
  '/Users/miuoshk/Documents/Cursor/kursnaldek/exports/anatsto-e2024-1-audit-data.json',
  JSON.stringify({ rows, internalCut, rowCount: rows.length }, null, 2),
);

console.log(JSON.stringify({ rowCount: rows.length, internalCut }));
