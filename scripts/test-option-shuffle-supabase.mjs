#!/usr/bin/env node
/**
 * Test integracyjny shuffle opcji na danych z Supabase (prod/staging).
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (np. z .env.local)
 *
 *   npm run test:supabase
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  hasCombinatorialOptions,
  isCombinatorialOptionText,
} from "../features/session/lib/combinatorialOptions.ts";
import { hasFixedOptionLetterRefsInExplanation } from "../features/session/lib/explanationOptionRefs.ts";
import {
  orderSessionOptions,
  shouldKeepFixedOptionOrder,
} from "../features/session/lib/sessionOptionOrder.ts";

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

function normalizeOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = typeof entry.id === "string" ? entry.id : null;
      const text = typeof entry.text === "string" ? entry.text : "";
      if (!id) return null;
      return { id, text };
    })
    .filter(Boolean);
}

function ctxFor(row) {
  return {
    disableOptionShuffle: row.disable_option_shuffle === true,
    explanation: row.explanation ?? "",
  };
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  return msg;
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY (.env.local)",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

console.log("Pobieranie pytań z Supabase…");

const rows = [];
const pageSize = 500;
let from = 0;

while (true) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, options, explanation, disable_option_shuffle, is_active")
    .eq("is_active", true)
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Błąd Supabase:", error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < pageSize) break;
  from += pageSize;
}

console.log(`Załadowano ${rows.length} aktywnych pytań.\n`);

const errors = [];
let blocked = 0;
let shuffled = 0;
let blockedCombo = 0;
let blockedExplanation = 0;
let blockedManual = 0;

for (const row of rows) {
  const options = normalizeOptions(row.options);
  const ctx = ctxFor(row);
  const keepFixed = shouldKeepFixedOptionOrder(options, ctx);
  const combo = hasCombinatorialOptions(options);
  const explRefs = hasFixedOptionLetterRefsInExplanation(ctx.explanation);

  if (keepFixed) {
    blocked++;
    if (ctx.disableOptionShuffle) blockedManual++;
    else if (combo) blockedCombo++;
    else if (explRefs) blockedExplanation++;
  } else {
    shuffled++;
  }

  if (combo && !keepFixed) {
    errors.push(fail(`${row.id}: meta-opcje wykryte, ale shuffle dozwolony`));
  }

  if (explRefs && !keepFixed) {
    errors.push(
      fail(`${row.id}: wyjaśnienie ma (A)–(E), ale shuffle dozwolony`),
    );
  }

  if (ctx.disableOptionShuffle && !keepFixed) {
    errors.push(
      fail(`${row.id}: disable_option_shuffle=true, ale shuffle dozwolony`),
    );
  }

  for (const opt of options) {
    if (isCombinatorialOptionText(opt.text) && !keepFixed) {
      errors.push(
        fail(
          `${row.id}: opcja „${opt.text.slice(0, 50)}" — meta bez zakazu shuffle`,
        ),
      );
    }
  }
}

const KNOWN_MUST_BLOCK = [
  "mju-kz2-023",
  "ana-trz-092",
  "HIST-02-001",
  "micro-exam-589",
];

for (const id of KNOWN_MUST_BLOCK) {
  const row = rows.find((r) => r.id === id);
  if (!row) {
    console.warn(`⚠ Pominięto znane pytanie (brak w bazie): ${id}`);
    continue;
  }
  const options = normalizeOptions(row.options);
  if (!shouldKeepFixedOptionOrder(options, ctxFor(row))) {
    errors.push(fail(`${id}: znane pytanie wymaga zakazu shuffle`));
  }
}

const SANITY_OPTIONS = [
  { id: "a", text: "alfa" },
  { id: "b", text: "beta" },
  { id: "c", text: "gamma" },
  { id: "d", text: "delta" },
  { id: "e", text: "epsilon" },
];
const sanityOrdered = orderSessionOptions(
  "__supabase_shuffle_sanity__",
  SANITY_OPTIONS,
);
if (
  sanityOrdered.every((o, i) => o.id === SANITY_OPTIONS[i]?.id)
) {
  errors.push(
    fail("Funkcja shuffle nie permutuje opcji (test sanity na sztucznym id)"),
  );
}

console.log("=== Podsumowanie Supabase ===");
console.log(`Aktywne pytania:     ${rows.length}`);
console.log(
  `Zakaz shuffle:       ${blocked} (${((blocked / rows.length) * 100).toFixed(1)}%)`,
);
console.log(`  — meta-opcje:      ${blockedCombo}`);
console.log(`  — (A) w wyjaśn.:   ${blockedExplanation}`);
console.log(`  — ręczny admin:    ${blockedManual}`);
console.log(`Shuffle dozwolony:   ${shuffled}`);
console.log("");

if (errors.length > 0) {
  console.error(`FAILED: ${errors.length} błąd(ów)\n`);
  for (const e of errors.slice(0, 30)) {
    console.error(`  • ${e}`);
  }
  if (errors.length > 30) {
    console.error(`  … i ${errors.length - 30} więcej`);
  }
  process.exit(1);
}

console.log("✔ Wszystkie testy integracyjne Supabase przeszły.");
process.exit(0);
