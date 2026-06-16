#!/usr/bin/env node
/**
 * Usuwa treść w nawiasach okrągłych z tekstu OPCJI odpowiedzi (JSON options).
 * Domyślnie tylko stoma-patologia; nie dotyka treści pytania ani wyjaśnień.
 *
 *   node scripts/strip-option-parentheses.mjs
 *   node scripts/strip-option-parentheses.mjs --apply
 *   node scripts/strip-option-parentheses.mjs --subject stoma-patologia --out exports/audit.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUBJECT = "stoma-patologia";

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

function parseArgs(argv) {
  const args = { subjectId: DEFAULT_SUBJECT, apply: false, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--apply") args.apply = true;
    else if (argv[i] === "--subject" && argv[i + 1]) args.subjectId = argv[++i];
    else if (argv[i] === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

/** Usuwa wszystkie `(…)` (bez zagnieżdżeń) i czyści whitespace. */
export function stripParenthesesFromOptionText(text) {
  if (!text || typeof text !== "string") return text;
  let s = text;
  let prev;
  do {
    prev = s;
    s = s.replace(/\s*\([^()]*\)/g, "");
  } while (s !== prev);

  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .trim();
}

function optionsChanged(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after)) return false;
  if (before.length !== after.length) return true;
  return before.some((opt, i) => opt.text !== after[i].text);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Użycie:
  node scripts/strip-option-parentheses.mjs [--apply] [--subject stoma-patologia] [--out path]

Domyślnie dry-run (podgląd bez zapisu).`);
    return;
  }

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", args.subjectId);
  if (topicsError) throw topicsError;

  const topicIds = (topics ?? []).map((t) => t.id);
  if (topicIds.length === 0) {
    console.error(`Brak tematów dla ${args.subjectId}`);
    process.exit(1);
  }

  const { data: rows, error: qError } = await supabase
    .from("questions")
    .select("id, topic_id, options")
    .in("topic_id", topicIds)
    .eq("is_active", true)
    .order("id");
  if (qError) throw qError;

  const changes = [];
  let optionsStripped = 0;

  for (const row of rows ?? []) {
    const options = row.options ?? [];
    const hasParen = options.some((o) => /[()]/.test(o?.text ?? ""));
    if (!hasParen) continue;

    const newOptions = options.map((opt) => {
      const before = opt.text ?? "";
      const after = stripParenthesesFromOptionText(before);
      if (after !== before) {
        optionsStripped += 1;
        return { ...opt, text: after };
      }
      return opt;
    });

    if (!optionsChanged(options, newOptions)) continue;

    changes.push({
      id: row.id,
      topic_id: row.topic_id,
      before: options.map((o) => ({ id: o.id, text: o.text })),
      after: newOptions.map((o) => ({ id: o.id, text: o.text })),
      options: newOptions,
    });
  }

  const audit = {
    subjectId: args.subjectId,
    scanned: rows?.length ?? 0,
    questionsChanged: changes.length,
    optionsStripped,
    changes: changes.map(({ id, topic_id, before, after }) => ({
      id,
      topic_id,
      before,
      after,
    })),
  };

  const outPath =
    args.out ??
    resolve(
      "exports",
      `patomorfologia-strip-parens-audit${args.apply ? "-applied" : ""}.json`,
    );
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(audit, null, 2), "utf8");

  console.log(`Przedmiot:     ${args.subjectId}`);
  console.log(`Przeskanowano: ${audit.scanned} pytań`);
  console.log(`Do zmiany:     ${changes.length} pytań (${optionsStripped} opcji)`);
  console.log(`Audyt:         ${outPath}`);

  if (changes.length > 0) {
    console.log("\nPrzykłady (max 5):");
    for (const c of changes.slice(0, 5)) {
      console.log(`\n--- ${c.id} ---`);
      for (const b of c.before) {
        const a = c.after.find((x) => x.id === b.id);
        if (a && a.text !== b.text) {
          console.log(`  ${String(b.id).toUpperCase()}.`);
          console.log(`    PRZED: ${b.text}`);
          console.log(`    PO:    ${a.text}`);
        }
      }
    }
  }

  if (!args.apply) {
    console.log("\nDry-run. Dodaj --apply aby zapisać w Supabase.");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const c of changes) {
    const { error } = await supabase
      .from("questions")
      .update({ options: c.options })
      .eq("id", c.id);
    if (error) {
      console.error(`${c.id}: ${error.message}`);
      fail += 1;
    } else {
      ok += 1;
    }
  }

  console.log(`\nZapisano: ${ok}, błędy: ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
