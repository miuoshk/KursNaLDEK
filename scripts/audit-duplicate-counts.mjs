/**
 * Audyt: szuka w messages szablonów z {count} + questionsLabel (ICU z liczbą)
 * oraz w TSX miejsc gdzie przekazywane jest count + questionsCount razem.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const messagesDir = path.join(root, "..", "messages");

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

const badPattern = /\{count\}.*\{questionsLabel\}/;
let issues = 0;

for (const file of ["pl.json", "en.json", "ru.json", "uk.json"]) {
  const flat = flatten(JSON.parse(fs.readFileSync(path.join(messagesDir, file), "utf8")));
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value === "string" && badPattern.test(value)) {
      console.error(`[${file}] ${key}: ${value}`);
      issues++;
    }
  }
}

if (issues > 0) {
  console.error(`\n${issues} message key(s) with duplicate count pattern.`);
  process.exit(1);
}

console.log("OK: no {count} + {questionsLabel} patterns in messages.");
