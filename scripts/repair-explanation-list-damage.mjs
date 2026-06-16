#!/usr/bin/env node
/**
 * Naprawia explanation uszkodzone przez masową normalizację list
 * (np. **(\n1) zamiast **(1)).
 *
 *   node scripts/repair-explanation-list-damage.mjs --dry-run
 *   node scripts/repair-explanation-list-damage.mjs --apply
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

function repairExplanationListDamage(text) {
  if (!text?.trim()) return text;
  let s = text.replace(/\r\n/g, "\n");
  s = s.replace(/\*\*\(\s*\n\s*(\d{1,2})\)/g, "**($1)");
  s = s.replace(/\*\*\(\s*\n\s*([A-E])\)/g, "**($1)");
  s = s.replace(/\*\*\(\s*\n\s*(\d{1,2})\./g, "**$1.");
  s = s.replace(/\*\*\s*\n\s*(\d{1,2})\.\s+/g, "**$1. ");
  s = s.replace(/\*\*\s*\n\s*(\d{1,2})\)\s+/g, "**$1) ");
  s = s.replace(/;\s*\n\s*\n\s*([A-E])\s*—/g, "; $1 —");
  return s;
}

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const apply = process.argv.includes("--apply");
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const rows = [];
const page = 500;
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, explanation")
    .range(from, from + page - 1);
  if (error) throw error;
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < page) break;
  from += page;
}

const changes = [];
for (const row of rows) {
  const before = row.explanation ?? "";
  const after = repairExplanationListDamage(before);
  if (after !== before) changes.push({ id: row.id, explanation: after });
}

console.log(`Przeskanowano: ${rows.length}, do naprawy: ${changes.length}`);

if (changes.length > 0) {
  console.log("\nPrzykłady (max 3):");
  for (const c of changes.slice(0, 3)) {
    const before = rows.find((r) => r.id === c.id)?.explanation ?? "";
    console.log(`\n--- ${c.id} ---`);
    console.log("PRZED:", before.slice(0, 200).replace(/\n/g, " ↵ "));
    console.log("PO:   ", c.explanation.slice(0, 200).replace(/\n/g, " ↵ "));
  }
}

if (!apply) {
  console.log("\nDry-run. Uruchom z --apply aby zapisać.");
  process.exit(0);
}

let ok = 0;
for (const c of changes) {
  const { error } = await supabase
    .from("questions")
    .update({ explanation: c.explanation })
    .eq("id", c.id);
  if (error) console.error(c.id, error.message);
  else ok += 1;
}

console.log(`\nNaprawiono explanation: ${ok}`);
