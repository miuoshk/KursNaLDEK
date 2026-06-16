/**
 * For uk/ru locales: replace any string that still equals pl (untranslated)
 * with the en translation when available.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "messages");

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function syncFromEn(plNode, enNode, targetNode, pathParts, stats) {
  if (!isPlainObject(plNode)) return;

  for (const key of Object.keys(plNode)) {
    const plVal = plNode[key];
    const enVal = enNode?.[key];
    const cur = targetNode[key];

    if (isPlainObject(plVal)) {
      if (!isPlainObject(targetNode[key])) targetNode[key] = {};
      syncFromEn(plVal, enVal, targetNode[key], [...pathParts, key], stats);
      continue;
    }

    if (typeof plVal !== "string") continue;

    if (cur === plVal && typeof enVal === "string" && enVal !== plVal) {
      targetNode[key] = enVal;
      stats.replaced += 1;
      stats.samples.push([...pathParts, key].join("."));
    } else if (cur === undefined && typeof enVal === "string") {
      targetNode[key] = enVal;
      stats.filled += 1;
    }
  }
}

const pl = JSON.parse(fs.readFileSync(path.join(root, "pl.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "en.json"), "utf8"));

for (const locale of ["uk", "ru"]) {
  const file = path.join(root, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const stats = { replaced: 0, filled: 0, samples: [] };
  syncFromEn(pl, en, data, [], stats);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(locale, stats);
}
