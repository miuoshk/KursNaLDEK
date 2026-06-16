/**
 * Build messages/overrides/*.patch.json from translation dictionaries.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ru as ruPart1, uk as ukPart1 } from "./i18n-translations-ru-uk.mjs";
import { ruPart2, ukPart2 } from "./i18n-translations-ru-uk-part2.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const messagesDir = path.join(root, "messages");

const namespaces = [
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

const dupPulpit = new Set([
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
]);

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

function unflatten(flat) {
  const result = {};
  for (const [keyPath, val] of Object.entries(flat)) {
    const parts = keyPath.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return result;
}

function keysNeedingPatch(en, locale) {
  const enFlat = flatten(en);
  const localeFlat = flatten(locale);
  const needed = {};
  for (const ns of namespaces) {
    if (!en[ns]) continue;
    const enNsFlat = flatten(en[ns], ns);
    for (const [key, val] of Object.entries(enNsFlat)) {
      if (typeof val !== "string") continue;
      const shortKey = key.split(".").pop();
      if (ns === "pulpit" && dupPulpit.has(shortKey)) continue;
      if (localeFlat[key] === val) needed[key] = val;
    }
  }
  return needed;
}

/** All patch keys from translation dict (stable full patch, not current locale diff). */
function allPatchKeys(flatTranslations) {
  const keys = {};
  for (const key of Object.keys(flatTranslations)) {
    const ns = key.split(".")[0];
    if (!namespaces.includes(ns)) continue;
    const shortKey = key.split(".").pop();
    if (ns === "pulpit" && dupPulpit.has(shortKey)) continue;
    keys[key] = true;
  }
  return keys;
}

function buildPatch(flatTranslations, keySet) {
  const patch = {};
  const missing = [];
  for (const key of Object.keys(keySet)) {
    const val = flatTranslations[key];
    if (val === undefined) {
      missing.push(key);
      continue;
    }
    patch[key] = val;
  }
  return { nested: unflatten(patch), missing };
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const ru = JSON.parse(fs.readFileSync(path.join(messagesDir, "ru.json"), "utf8"));
const uk = JSON.parse(fs.readFileSync(path.join(messagesDir, "uk.json"), "utf8"));

const ruFlat = { ...ruPart1, ...ruPart2 };
const ukFlat = { ...ukPart1, ...ukPart2 };

const ruNeeded = allPatchKeys(ruFlat);
const ukNeeded = allPatchKeys(ukFlat);

const ruPatch = buildPatch(ruFlat, ruNeeded);
const ukPatch = buildPatch(ukFlat, ukNeeded);

const overridesDir = path.join(messagesDir, "overrides");
fs.mkdirSync(overridesDir, { recursive: true });

fs.writeFileSync(
  path.join(overridesDir, "ru.patch.json"),
  `${JSON.stringify(ruPatch.nested, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(overridesDir, "uk.patch.json"),
  `${JSON.stringify(ukPatch.nested, null, 2)}\n`,
);

console.log("ru patch keys:", Object.keys(flatten(ruPatch.nested)).length);
console.log("uk patch keys:", Object.keys(flatten(ukPatch.nested)).length);
if (ruPatch.missing.length) console.warn("RU missing:", ruPatch.missing.length, ruPatch.missing.slice(0, 5));
if (ukPatch.missing.length) console.warn("UK missing:", ukPatch.missing.length, ukPatch.missing.slice(0, 5));
