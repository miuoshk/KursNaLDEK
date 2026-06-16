/**
 * Apply messages/overrides/*.patch.json to ru.json and uk.json.
 * Removes duplicate pulpit keys and reports remaining English placeholders.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

const DUP_PULPIT_KEYS = [
  "cardDailyGoal",
  "cardDailyGoalReached",
  "cardStreak",
  "cardStreakStart",
  "cardReviews",
  "cardRank",
  "quickStartTitle",
  "activityTitle",
  "progressTitle",
  "weakPointsTitle",
  "historyTitle",
];

const PATCH_NAMESPACES = [
  "pulpit",
  "subjects",
  "session",
  "osce",
  "saved",
  "access",
  "checkout",
  "notifications",
  "gamification",
  "statistics",
  "settings",
  "auth",
  "common",
];

function deepMerge(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      deepMerge(target[key], val);
    } else {
      target[key] = val;
    }
  }
  return target;
}

function removeDupPulpitKeys(data) {
  if (!data.pulpit) return;
  for (const key of DUP_PULPIT_KEYS) {
    delete data.pulpit[key];
  }
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function countEnglishMatches(en, locale) {
  const enFlat = flatten(en);
  const localeFlat = flatten(locale);
  const dupPulpit = new Set(DUP_PULPIT_KEYS);
  let count = 0;
  const remaining = [];

  for (const ns of PATCH_NAMESPACES) {
    if (!en[ns]) continue;
    const enNsFlat = flatten(en[ns], ns);
    for (const [key, val] of Object.entries(enNsFlat)) {
      if (typeof val !== "string") continue;
      const shortKey = key.split(".").pop();
      if (ns === "pulpit" && dupPulpit.has(shortKey)) continue;
      if (localeFlat[key] === val) {
        count++;
        remaining.push(key);
      }
    }
  }
  return { count, remaining };
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

for (const locale of ["ru", "uk"]) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const patchPath = path.join(messagesDir, "overrides", `${locale}.patch.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const patch = JSON.parse(fs.readFileSync(patchPath, "utf8"));

  deepMerge(data, patch);
  removeDupPulpitKeys(data);

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

  const { count, remaining } = countEnglishMatches(en, data);
  const patchKeyCount = Object.keys(flatten(patch)).length;
  console.log(`${locale}: applied ${patchKeyCount} patch keys, ${count} keys still match en`);
  if (remaining.length > 0 && remaining.length <= 20) {
    console.log(`  remaining: ${remaining.join(", ")}`);
  } else if (remaining.length > 20) {
    console.log(`  remaining (first 10): ${remaining.slice(0, 10).join(", ")}...`);
  }
}
