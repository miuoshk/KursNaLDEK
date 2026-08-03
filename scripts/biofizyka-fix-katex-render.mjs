#!/usr/bin/env node
/**
 * Naprawa renderowania KaTeX — opcje i wyjaśnienia biofizyki.
 * Czyta ORYGINALNY backup sprzed pierwszego audytu jako źródło do przeformatowania.
 *
 *   node scripts/biofizyka-fix-katex-render.mjs --dry-run
 *   node scripts/biofizyka-fix-katex-render.mjs --apply
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUBJECT_ID = "biofizyka";
const ORIGINAL_BACKUP = "exports/biofizyka-pre-katex-polish-backup-ORIGINAL.json";
const ROLLBACK_SQL = "exports/biofizyka-katex-render-fix-rollback.sql";
const APPLY_SQL = "scripts/2026-06-18-biofizyka-katex-render-fix.sql";

const POLISH_IN_MATH =
  /\b(jest|wektor|skierowany|skalar|skierowana|od|do|oraz|nie|tylko|między|przez|przy|jako|się|i)\b/i;

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

function escapeSQL(v) {
  return String(v ?? "").replace(/'/g, "''");
}

function stripAllMathDelimiters(s) {
  return s.replace(/\$/g, "").trim();
}

function isCorruptedMath(text) {
  if (!text) return false;
  return /\\{4,}/.test(text) || /\$\$/.test(text) || /\$\\+\$/.test(text);
}

function looksLikeFormula(s) {
  const t = stripAllMathDelimiters(s);
  return (
    /=/.test(t) ||
    /\^/.test(t) ||
    /[αβγλ]/.test(t) ||
    /\b(sin|cos|tan|tg|log|ln|exp)\b/i.test(t) ||
    /\*/.test(t) ||
    /\//.test(t) ||
    /_\d/.test(t) ||
    /\\(sin|cos|alpha|lambda|dfrac|cdot)/.test(t)
  );
}

function normalizeMathCommands(s) {
  let m = s.replace(/\r\n/g, " ").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  m = m.replace(/[\u0300-\u036f]/g, "");
  m = m.replace(/α/g, "\\alpha").replace(/β/g, "\\beta").replace(/λ/g, "\\lambda");
  m = m.replace(/ƛ/g, "\\lambda");
  m = m.replace(/ω/g, "\\omega");

  // e-λt przed zamianą λ → \lambda (inaczej powstaje e-\lambdat)
  m = m.replace(/\be-λt/gi, "e^{-\\lambda t}");
  m = m.replace(/\beλt/gi, "e^{\\lambda t}");

  // e-λt / e-λ t → wykładnik
  m = m.replace(/\be\s*-\s*\\?lambda\s*t\b/gi, "e^{-\\lambda t}");
  m = m.replace(/\be\s*\\?lambda\s*t\b/gi, "e^{\\lambda t}");
  m = m.replace(/\\lambdat\b/g, "\\lambda t");
  m = m.replace(/\\omegat\b/g, "\\omega t");
  m = m.replace(/\be-\s*\\lambda\s*t\b/g, "e^{-\\lambda t}");
  m = m.replace(/\be\\lambdat\b/g, "e^{\\lambda t}");
  m = m.replace(/\be-\s*\\omega\s*t\b/g, "e^{-\\omega t}");
  m = m.replace(/\be\\omegat\b/g, "e^{\\omega t}");
  m = m.replace(/\bexp\s*\(\s*-\\?lambda\s*t\s*\)/gi, "e^{-\\lambda t}");
  m = m.replace(/\bexp\s*\(\s*\\?lambda\s*t\s*\)/gi, "e^{\\lambda t}");
  m = m.replace(/\bexp\s*\(\s*-\\?omega\s*t\s*\)/gi, "e^{-\\omega t}");
  m = m.replace(/\bexp\s*\(\s*\\?omega\s*t\s*\)/gi, "e^{\\omega t}");
  m = m.replace(/\be\s*\(\s*-\\?lambda\s*t\s*\)/gi, "e^{-\\lambda t}");
  m = m.replace(/\be\s*\(\s*\\?lambda\s*t\s*\)/gi, "e^{\\lambda t}");
  m = m.replace(/\be\s*\(\s*-\\?omega\s*t\s*\)/gi, "e^{-\\omega t}");
  m = m.replace(/\be\s*\(\s*\\?omega\s*t\s*\)/gi, "e^{\\omega t}");

  // Artefakt I₀ zapisany jako „ o” na końcu
  m = m.replace(/\s+o\s*$/i, "");

  m = m.replace(/\\+(sin|cos|tan|tg|ln|log|exp|alpha|beta|gamma|lambda|mu|nu|rho|sigma|tau|phi|omega|pi|theta|epsilon|Delta|dfrac|tfrac|frac|cdot|times)\b/g, "\\$1");

  m = m.replace(/\bI\s+o\b/gi, "I_0");
  m = m.replace(/\bI\s*\(\s*0\s*\)/g, "I_0");
  m = m.replace(/\bN\s*\(\s*0\s*\)/g, "N_0");
  m = m.replace(/\bI\s*=\s*I\s+(?=\\?(?:sin|cos|tan))/gi, "I = I_0 ");

  m = m.replace(/\bsin2\s*\(?\s*\\?alpha\s*\)?/gi, "\\sin^{2}\\alpha");
  m = m.replace(/\bcos2\s*\(?\s*\\?alpha\s*\)?/gi, "\\cos^{2}\\alpha");
  m = m.replace(/\bsin2\s*\(([^)]+)\)/gi, "\\sin^{2}($1)");
  m = m.replace(/\bcos2\s*\(([^)]+)\)/gi, "\\cos^{2}($1)");
  m = m.replace(/\bsin\s*\(([^)]+)\)/gi, "\\sin($1)");
  m = m.replace(/\bcos\s*\(([^)]+)\)/gi, "\\cos($1)");
  m = m.replace(/\bsin\s*\\?alpha\b/gi, "\\sin\\alpha");
  m = m.replace(/\bcos\s*\\?alpha\b/gi, "\\cos\\alpha");
  m = m.replace(/\btg\s*\(([^)]+)\)/gi, "\\tan($1)");
  m = m.replace(/\*/g, " \\cdot ");
  m = m.replace(/\s*=\s*/g, " = ");
  m = m.replace(/\s*\^\s*(\d+)/g, "^{$1}");
  m = m.replace(/\s{2,}/g, " ").trim();
  return m;
}

function formatMixedOption(raw) {
  const s = stripAllMathDelimiters(raw).replace(/\*/g, " * ").replace(/\s+/g, " ").trim();

  const v1 = s.match(
    /^(.+?)\s+i jest to wektor skierowany od\s*([+\-−])\s*do\s*([+\-−])$/i,
  );
  if (v1) {
    const math = normalizeMathCommands(v1[1].replace(/\//g, " / "));
    if (math.includes("/")) {
      const [a, b] = math.split(/\s*\/\s*/);
      return `$\\dfrac{${a.trim()}}{${b.trim()}}$ i jest to wektor skierowany od $${v1[2]}$ do $${v1[3]}$`;
    }
    return `$${math.replace(" * ", " \\cdot ")}$ i jest to wektor skierowany od $${v1[2]}$ do $${v1[3]}$`;
  }

  const v2 = s.match(/^(.+?)\s+i jest to skalar$/i);
  if (v2) {
    const part = v2[1].trim();
    if (part.includes("/")) {
      const [a, b] = part.split(/\s*\/\s*/);
      return `$\\dfrac{${normalizeMathCommands(a)}}{${normalizeMathCommands(b)}}$ i jest to skalar`;
    }
    return `$${normalizeMathCommands(part)}$ i jest to skalar`;
  }

  return null;
}

const POLISH_PROSE =
  /\b(Zmniejszenie|Wydzielanie|Powstanie|Zwiększenie|Obniżenie|Wzrost|Spadek|Brak|Obecność|Obecność|stężenia|wartości|jonu|wodoru|cząsteczek|wody|pH)\b/i;

function isMixedTextAndMath(raw) {
  const t = raw.trim();
  return (
    !t.startsWith("$") &&
    t.includes("$") &&
    /^[\p{L}ĄĆĘŁŃÓŚŹŻ"'(]/u.test(t)
  );
}

function splitPolishFormulaOption(raw) {
  const s = stripAllMathDelimiters(raw).replace(/\s+/g, " ").trim();

  // Zmniejszenie stężenia jonu hydroniowego H3O+ / \mathrm{H_3O^+}
  const chem = s.match(
    /^(.+?)\s+(\\mathrm\{H_3O\^\+}|H_3O\^\+|\\mathrm\{[^}]+\})$/i,
  );
  if (chem && POLISH_PROSE.test(chem[1])) {
    const formula = chem[2].startsWith("\\mathrm")
      ? chem[2]
      : `\\mathrm{${chem[2]}}`;
    return `${chem[1].trim()} $${formula}$`;
  }

  return null;
}

function formatMixedExistingOption(raw) {
  if (!isMixedTextAndMath(raw)) return null;
  return raw.replace(/\$[^$\n]+\$/g, (seg) => {
    const inner = stripAllMathDelimiters(seg);
    return `$${normalizeMathCommands(inner)}$`;
  });
}

function formatFormulaOption(raw) {
  const strippedEarly = stripAllMathDelimiters(raw);
  if (POLISH_PROSE.test(strippedEarly) && raw.trim().startsWith("$")) {
    const unwrapped = splitPolishFormulaOption(strippedEarly);
    if (unwrapped) return unwrapped;
  }

  const mixedExisting = formatMixedExistingOption(raw);
  if (mixedExisting) return mixedExisting;

  const polishSplit = splitPolishFormulaOption(raw);
  if (polishSplit) return polishSplit;

  const mixed = formatMixedOption(raw);
  if (mixed) return mixed;

  const stripped = stripAllMathDelimiters(raw);
  if (POLISH_PROSE.test(stripped) && !/^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*=/.test(stripped)) {
    const split = splitPolishFormulaOption(stripped);
    if (split) return split;
    // czysty polski tekst — nie owijaj w $
    if (!looksLikeFormula(stripped)) return raw.trim();
  }

  const inner = normalizeMathCommands(stripped);
  if (!inner) return raw;
  return `$${inner}$`;
}

function formatExplanationFromOriginal(raw) {
  let s = raw;

  const replacements = [
    [
      /\bI\s*=\s*I_0\s*\*?\s*cos\^?2?\(alpha\)/gi,
      "$I = I_0 \\cos^{2}(\\alpha)$",
    ],
    [
      /\bN\(t\)\s*=\s*N\(0\)\s*\*?\s*e\^\(-lambda\*t\)/gi,
      "$N(t) = N_0 e^{-\\lambda t}$",
    ],
    [
      /\blambda\s*=\s*h\/\(\s*mv\s*\)\s*=\s*h\/p/gi,
      "$\\lambda = h/(mv) = h/p$",
    ],
    [
      /\blambda\s*=\s*h\/\(\s*mv\s*\)/gi,
      "$\\lambda = h/(mv)$",
    ],
    [
      /\bn\s*\*\s*lambda\s*=\s*2d\s*\*\s*sin\s*\(\s*alpha\s*\)/gi,
      "$n\\lambda = 2d\\sin(\\alpha)$",
    ],
    [
      /\bn\s*\*\s*lambda\s*=\s*2\s*\*\s*d\s*\*\s*sin\s*\(\s*theta\s*\)/gi,
      "$n\\lambda = 2d\\sin(\\theta)$",
    ],
    [
      /\bM\s*=\s*p\s*x\s*E\s*=\s*p\s*\*?\s*E\s*\*?\s*sin\s*\(\s*alpha\s*\)/gi,
      "$M = p \\times E = pE\\sin(\\alpha)$",
    ],
    [
      /\bd\s*=\s*lambda\s*\/\s*\(\s*2\s*\*?\s*n\s*\*?\s*sin\s*\(\s*u\s*\)\s*\)/gi,
      "$d = \\lambda/(2n\\sin u)$",
    ],
    [
      /\bD\s*=\s*R_K\s*\/\s*\(\s*1\s*-\s*x\s*\*?\s*R_K\s*\)/gi,
      "$D = R_K/(1-x R_K)$",
    ],
    [/\b10\s*\^\s*-(\d+)/g, "$10^{-$1}$"],
  ];

  for (const [re, repl] of replacements) {
    s = s.replace(re, repl);
  }

  // Prawo X: formula
  s = s.replace(
    /(Prawo [^:]+:\s*)([A-Za-z0-9_\\^+\-*/(). λα=]+(?:=\s*[A-Za-z0-9_\\^+\-*/(). λα]+)+)/gi,
    (full, prefix, expr) => {
      if (expr.includes("$")) return full;
      if (/[ąćęłńóśźż]{4,}/i.test(expr)) return full;
      return `${prefix}$${normalizeMathCommands(expr)}$`;
    },
  );

  return s;
}

function fixStemText(text) {
  if (!text) return text;
  let s = text;
  s = s.replace(/\(\s*\n\s*([A-Za-z])\s*\)/g, (_, g1) => `($${g1}$)`);
  s = s.replace(/\\n([A-Za-z])/g, (_, g1) => `$${g1}$`);
  s = s.replace(/\(([αβγδεθλμπρστφω])\s*[-–—]/g, (_, g1) => `($${g1}$ -`);
  s = s.replace(/\(([a-zA-Z])\s*[-–—]/g, (_, g1) => `($${g1}$ -`);
  s = s.replace(
    /(\(\$q\$ - ładunek,\s*)\$I\$( - odległość między ładunkiem \+ i - \))/,
    (_, a, b) => `${a}$l$${b}`,
  );
  s = s.replace(
    /(\(\$q\$ - ładunek,\s*)I( - odległość między ładunkiem \+ i - \))/,
    (_, a, b) => `${a}$l$${b}`,
  );
  s = s.replace(
    /(\(q - ładunek,\s*)I( - odległość między ładunkiem \+ i - \))/,
    (_, a, b) => `${a}$l$${b}`,
  );
  return s;
}

function optionNeedsReformat(current, original) {
  if (!current?.includes("$") && !looksLikeFormula(current)) return false;
  if (isMixedTextAndMath(current) && !/\\lambdat|\\omegat|\\\\+(sin|cos|alpha)/.test(current))
    return true;
  if (isCorruptedMath(current)) return true;
  if (POLISH_IN_MATH.test(stripAllMathDelimiters(current)) && current.startsWith("$"))
    return true;
  if (POLISH_PROSE.test(stripAllMathDelimiters(current)) && current.startsWith("$"))
    return true;
  if (/\\lambdat|\\omegat|\\\\+(sin|cos|alpha)/.test(current)) return true;
  if (/sin\\+alpha|sin2\\+/.test(current)) return true;
  if (original && looksLikeFormula(original)) return true;
  return current.includes("$");
}

function processQuestion(current, original) {
  const changes = [];
  let { text, explanation, options } = current;

  const newText = fixStemText(text);
  if (newText !== text) {
    text = newText;
    changes.push("text");
  }

  const newOptions = (options ?? []).map((opt) => {
    const origOpt = original?.options?.find((o) => o.id === opt.id)?.text;
    if (!optionNeedsReformat(opt.text, origOpt)) return opt;

    let source = origOpt ?? opt.text;
    if (
      opt.text.startsWith("$") &&
      POLISH_PROSE.test(stripAllMathDelimiters(opt.text))
    ) {
      source = stripAllMathDelimiters(origOpt ?? opt.text);
    }

    const formatted =
      looksLikeFormula(source) ||
      /i jest to/.test(source) ||
      POLISH_PROSE.test(source)
        ? formatFormulaOption(source)
        : opt.text;

    if (formatted !== opt.text) changes.push(`option-${opt.id}`);
    return { ...opt, text: formatted };
  });
  options = newOptions;

  const origExpl = original?.explanation;
  const explNeedsRestore =
    (isCorruptedMath(explanation) ||
      /\blambda\b/i.test(explanation) ||
      /\balpha\b/i.test(explanation) ||
      /sin\s*\(\s*theta\s*\)/i.test(explanation)) &&
    origExpl;

  if (explNeedsRestore) {
    const fixed = formatExplanationFromOriginal(origExpl);
    if (fixed !== explanation) {
      explanation = fixed;
      changes.push("explanation-restore");
    }
  }

  if (explanation.includes("$")) {
    const normalized = explanation.replace(/\$[^$\n]+\$/g, (seg) => {
      const inner = stripAllMathDelimiters(seg);
      return `$${normalizeMathCommands(inner)}$`;
    });
    if (normalized !== explanation) {
      explanation = normalized;
      changes.push("explanation-math");
    }
  }

  const plFixes = [
    [/\bkat\b/g, "kąt"],
    [/\bmiedzy\b/g, "między"],
    [/\bplaszczyznami\b/g, "płaszczyznami"],
    [/\bzalamania\b/g, "załamania"],
    [/\bsily\b/g, "siły"],
    [/\bdzialajacy\b/g, "działający"],
    [/\bwzdluz\b/g, "wzdłuż"],
    [/\bdazy\b/g, "dąży"],
    [/\bosrodkow\b/g, "ośrodków"],
    [/\bokresla\b/g, "określa"],
    [/\bsie\b/g, "się"],
  ];
  let explPol = explanation;
  for (const [re, repl] of plFixes) explPol = explPol.replace(re, repl);
  if (explPol !== explanation) {
    explanation = explPol;
    changes.push("explanation-pl");
  }

  const changed =
    text !== current.text ||
    explanation !== current.explanation ||
    JSON.stringify(options) !== JSON.stringify(current.options);

  return {
    ...current,
    text,
    explanation,
    options,
    changed,
    changes,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  loadEnvLocal();

  if (!existsSync(resolve(ORIGINAL_BACKUP))) {
    console.error(`Brak ${ORIGINAL_BACKUP}`);
    process.exit(1);
  }

  const originalData = JSON.parse(readFileSync(resolve(ORIGINAL_BACKUP), "utf8"));
  const originalMap = new Map(originalData.questions.map((q) => [q.id, q]));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: topics } = await supabase.from("topics").select("id").eq("subject_id", SUBJECT_ID);
  const { data: rows, error } = await supabase
    .from("questions")
    .select("*")
    .in(
      "topic_id",
      topics.map((t) => t.id),
    )
    .eq("is_active", true)
    .order("id");
  if (error) throw error;

  const fixed = rows.map((row) => processQuestion(row, originalMap.get(row.id)));
  const changed = fixed.filter((r) => r.changed);

  mkdirSync(resolve("exports"), { recursive: true });
  mkdirSync(resolve("scripts"), { recursive: true });

  const rb = changed
    .map((r) => {
      const o = rows.find((x) => x.id === r.id);
      const opt = JSON.stringify(o.options).replace(/'/g, "''");
      return `UPDATE public.questions SET text='${escapeSQL(o.text)}', options='${opt}'::jsonb, explanation='${escapeSQL(o.explanation)}' WHERE id='${escapeSQL(o.id)}';`;
    })
    .join("\n\n");
  writeFileSync(resolve(ROLLBACK_SQL), `-- rollback ${changed.length}\nBEGIN;\n${rb}\nCOMMIT;\n`);

  const ap = changed
    .map((r) => {
      const opt = JSON.stringify(r.options).replace(/'/g, "''");
      return `UPDATE public.questions SET text='${escapeSQL(r.text)}', options='${opt}'::jsonb, explanation='${escapeSQL(r.explanation)}' WHERE id='${escapeSQL(r.id)}';`;
    })
    .join("\n\n");
  writeFileSync(resolve(APPLY_SQL), `-- apply ${changed.length}\nBEGIN;\n${ap}\nCOMMIT;\n`);

  console.log(`Do poprawy: ${changed.length} / ${rows.length}`);
  for (const id of [
    "biofiz-c2-009",
    "biofiz-w5-197",
    "biofiz-w5-315",
    "biofiz-c1-026",
    "biofiz-s1-006",
    "biofiz-s1-345",
  ]) {
    const r = fixed.find((x) => x.id === id);
    if (!r) continue;
    console.log(`\n=== ${id} ===`);
    console.log("text:", r.text.slice(0, 100));
    for (const o of r.options) console.log(`  ${o.id}: ${o.text}`);
    console.log("expl:", r.explanation.slice(0, 120));
  }

  if (!apply) {
    console.log("\nDry-run. Uruchom z --apply");
    return;
  }

  let ok = 0;
  for (const r of changed) {
    const { error: e } = await supabase
      .from("questions")
      .update({ text: r.text, options: r.options, explanation: r.explanation })
      .eq("id", r.id);
    if (e) console.error(r.id, e.message);
    else ok += 1;
  }
  console.log(`\nZapisano ${ok}/${changed.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
