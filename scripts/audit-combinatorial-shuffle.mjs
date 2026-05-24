/**
 * Audyt detekcji meta-opcji przed shuffle.
 * Uruchom: node scripts/audit-combinatorial-shuffle.mjs < questions.json
 * questions.json = [{ "id": "...", "options": [{ "id":"a","text":"..." }, ...] }, ...]
 */

import { readFileSync } from "node:fs";

// Inline copy of production heuristics (keep in sync with combinatorialOptions.ts)
const CORRECTNESS_WORD =
  /(?:prawidłowe|prawidłowa|prawidłowy|prawidłowej|fałszywe|fałszywa|fałszywy|błędne|błędna|błędny|poprawne|poprawna|poprawnej|prawdziwe|prawdziwa|nieprawidłowe|niepoprawne)/i;
const ALL_NONE_WORD =
  /(?:prawidłowe|fałszywe|błędne|poprawne|prawdziwe|nieprawidłowe|niepoprawne|powyższe|poniższe|powyzsze|odpowiedzi|wymienione|mechanizmy)/i;
const OPTION_LETTER = /(?:^|[^A-Za-z])[A-E](?:[^A-Za-z]|$)/;
const LETTER_PAIR = /[A-E]\s+i\s+[A-E]/i;
const LETTER_COMMA_LIST = /[A-E]\s*,\s*[A-E]/i;
const LETTER_RANGE = /[A-E]\s*[-–]\s*[A-E]/i;
const META_OPTION_MAX_LEN = 120;

function hasAllOrNoneMeta(text) {
  if (/(?:żadne|żadna)/i.test(text)) {
    return /(?:powyższych|poniższych|wymienionych)/i.test(text);
  }
  if (/wszystkie/i.test(text)) {
    if (ALL_NONE_WORD.test(text)) return true;
    if (LETTER_RANGE.test(text)) return true;
    if (LETTER_COMMA_LIST.test(text) || LETTER_PAIR.test(text)) return true;
  }
  return false;
}

function isShortStandaloneMeta(text) {
  const t = text.trim();
  if (t.length > META_OPTION_MAX_LEN) return false;
  if (/^wszystkie$/i.test(t)) return true;
  if (/^wszystkie\s+powy/i.test(t)) return true;
  if (
    /^wszystkie\s+(?:odpowiedzi\s+)?(?:są\s+)?(?:prawidłowe|fałszywe|poprawne|prawdziwe|nieprawidłowe|błędne)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^żadne?\s+z\s+powy/i.test(t)) return true;
  if (/^tylko\s+[A-E](?:\s+i\s+[A-E])?$/i.test(t)) return true;
  return false;
}

function hasLetterCombinationMeta(text) {
  if (LETTER_RANGE.test(text)) return true;
  if (/odpowiedzi?\s+[A-E]/i.test(text) && CORRECTNESS_WORD.test(text)) {
    return true;
  }
  if (/odpowiedzi\s+prawidłowe\s+to\s*:/i.test(text)) return true;
  if (!OPTION_LETTER.test(text)) return false;
  if (CORRECTNESS_WORD.test(text)) return true;
  if (/tylko/i.test(text) && text.trim().length <= META_OPTION_MAX_LEN) {
    return true;
  }
  if (LETTER_PAIR.test(text) || LETTER_COMMA_LIST.test(text)) {
    return (
      CORRECTNESS_WORD.test(text) ||
      /tylko/i.test(text) ||
      /wszystkie/i.test(text)
    );
  }
  return false;
}

function isCombinatorialOptionText(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return (
    isShortStandaloneMeta(trimmed) ||
    hasAllOrNoneMeta(trimmed) ||
    hasLetterCombinationMeta(trimmed)
  );
}

function hasCombinatorialOptions(options) {
  return options.some((opt) => isCombinatorialOptionText(opt.text));
}

/** Szeroki „ground truth” — meta-opcja LDEK (superset, do szacowania recall). */
function isBroadMetaReference(text) {
  const t = text.trim();
  if (!t) return false;
  if (t.length <= 120) {
    if (/^wszystkie(\s|$)/i.test(t)) return true;
    if (/^żadne?\s+z\s+powy/i.test(t)) return true;
    if (/^tylko\s+[A-E]/i.test(t)) return true;
  }
  if (/odpowiedzi\s+prawidłowe\s+to\s*:/i.test(t)) return true;
  if (/[A-E]\s*[-–]\s*[A-E]/i.test(t)) return true;
  if (/odpowiedzi?\s+[A-E]/i.test(t) && CORRECTNESS_WORD.test(t)) return true;
  if (
    /[A-E]\s+i\s+[A-E]/i.test(t) &&
    /(?:prawid|fałsz|błęd|popraw|odpowiedz|tylko|wszystkie)/i.test(t)
  ) {
    return true;
  }
  if (
    /[A-E]\s*,\s*[A-E]/i.test(t) &&
    /(?:prawid|fałsz|błęd|popraw|wszystkie|tylko)/i.test(t)
  ) {
    return true;
  }
  if (/^prawidłowe\s+[A-E]/i.test(t) || /^[A-E]\s+i\s+[A-E]\s+prawidłowe/i.test(t)) {
    return true;
  }
  return false;
}

function hasBroadMeta(options) {
  return options.some((opt) => isBroadMetaReference(opt.text));
}

const raw = readFileSync(0, "utf8");
const questions = JSON.parse(raw);

let blocked = 0;
let shuffled = 0;
const falseNegatives = [];
const falsePositives = [];
const blockedSamples = [];

for (const q of questions) {
  const options = Array.isArray(q.options) ? q.options : [];
  const prod = hasCombinatorialOptions(options);
  const broad = hasBroadMeta(options);

  if (prod) {
    blocked++;
    if (blockedSamples.length < 5) blockedSamples.push(q.id);
  } else {
    shuffled++;
  }

  if (broad && !prod) {
    const metaOpts = options.filter((o) => isBroadMetaReference(o.text));
    falseNegatives.push({
      id: q.id,
      metaTexts: metaOpts.map((o) => o.text),
    });
  }
  if (prod && !broad) {
    const metaOpts = options.filter((o) => isCombinatorialOptionText(o.text));
    falsePositives.push({
      id: q.id,
      metaTexts: metaOpts.map((o) => o.text),
    });
  }
}

const broadTotal = questions.filter((q) =>
  hasBroadMeta(Array.isArray(q.options) ? q.options : []),
).length;

const recall =
  broadTotal > 0 ? ((broadTotal - falseNegatives.length) / broadTotal) * 100 : 100;

console.log(JSON.stringify({
  totalActive: questions.length,
  blockedFromShuffle: blocked,
  wouldShuffle: shuffled,
  blockedPct: ((blocked / questions.length) * 100).toFixed(1),
  broadMetaEstimate: broadTotal,
  recallVsBroadPct: recall.toFixed(1),
  falseNegativeCount: falseNegatives.length,
  falsePositiveCount: falsePositives.length,
  falseNegatives: falseNegatives.slice(0, 25),
  falsePositives: falsePositives.slice(0, 15),
}, null, 2));
