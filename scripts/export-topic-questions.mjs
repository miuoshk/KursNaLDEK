#!/usr/bin/env node
/**
 * Eksport pytań z Supabase (topic → SQL / JSON / Markdown).
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local)
 *
 * Przykłady:
 *   node scripts/export-topic-questions.mjs --topic MJU-ZAL --format sql
 *   node scripts/export-topic-questions.mjs --topic MJU-ZAL --format json --out exports/mju-zal.json
 *   node scripts/export-topic-questions.mjs --subject stoma-mikrobio-ju --topic MJU-ZAL --format md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUBJECT_ID = "stoma-mikrobio-ju";
const DEFAULT_TOPIC_ID = "MJU-ZAL";

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
  const args = {
    subjectId: DEFAULT_SUBJECT_ID,
    topicId: DEFAULT_TOPIC_ID,
    format: "sql",
    out: null,
    includeInactive: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--subject" && argv[i + 1]) {
      args.subjectId = argv[++i];
    } else if (arg === "--topic" && argv[i + 1]) {
      args.topicId = argv[++i];
    } else if (arg === "--format" && argv[i + 1]) {
      args.format = argv[++i];
    } else if (arg === "--out" && argv[i + 1]) {
      args.out = argv[++i];
    } else if (arg === "--include-inactive") {
      args.includeInactive = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

function escapeSQL(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function optionLabel(options, id) {
  const match = (options ?? []).find((o) => o?.id === id);
  return match?.text ?? id;
}

function rowToInsert(row) {
  const optionsJSON = JSON.stringify(row.options ?? []).replace(/'/g, "''");
  const cols = [
    "id",
    "topic_id",
    "text",
    "options",
    "correct_option_id",
    "explanation",
    "batch_label",
    "theme_label",
    "subtheme_label",
    "learning_outcome",
    "source_exam",
    "source_code",
    "image_url",
    "question_type",
    "timer_seconds",
    "correct_order",
    "hotspots",
    "drill_questions",
    "identify_mode",
    "disable_option_shuffle",
    "is_active",
  ];

  const values = [
    `'${escapeSQL(row.id)}'`,
    `'${escapeSQL(row.topic_id)}'`,
    `'${escapeSQL(row.text)}'`,
    `'${optionsJSON}'::jsonb`,
    `'${escapeSQL(row.correct_option_id)}'`,
    `'${escapeSQL(row.explanation)}'`,
    row.batch_label ? `'${escapeSQL(row.batch_label)}'` : "NULL",
    row.theme_label ? `'${escapeSQL(row.theme_label)}'` : "NULL",
    row.subtheme_label ? `'${escapeSQL(row.subtheme_label)}'` : "NULL",
    row.learning_outcome ? `'${escapeSQL(row.learning_outcome)}'` : "NULL",
    row.source_exam ? `'${escapeSQL(row.source_exam)}'` : "NULL",
    row.source_code ? `'${escapeSQL(row.source_code)}'` : "NULL",
    row.image_url ? `'${escapeSQL(row.image_url)}'` : "NULL",
    row.question_type ? `'${escapeSQL(row.question_type)}'` : "'single_choice'",
    row.timer_seconds != null ? String(row.timer_seconds) : "NULL",
    row.correct_order ? `'${escapeSQL(JSON.stringify(row.correct_order))}'::jsonb` : "NULL",
    row.hotspots ? `'${escapeSQL(JSON.stringify(row.hotspots))}'::jsonb` : "NULL",
    row.drill_questions ? `'${escapeSQL(JSON.stringify(row.drill_questions))}'::jsonb` : "NULL",
    row.identify_mode ? `'${escapeSQL(row.identify_mode)}'` : "NULL",
    row.disable_option_shuffle === true ? "true" : "false",
    row.is_active === false ? "false" : "true",
  ];

  return `(${values.join(", ")})`;
}

function toSQL(rows, meta) {
  const header = `-- ============================================================
-- EKSPORT PYTAŃ
-- Przedmiot: ${meta.subjectName} (${meta.subjectId})
-- Temat:     ${meta.topicName} (${meta.topicId})
-- Data:      ${new Date().toISOString().split("T")[0]}
-- Liczba:    ${rows.length}
-- ============================================================

SELECT
  q.id,
  q.text AS pytanie,
  q.options,
  q.correct_option_id AS poprawna_odpowiedz,
  q.explanation AS wyjasnienie
FROM public.questions q
WHERE q.topic_id = '${meta.topicId}'
${meta.includeInactive ? "" : "  AND q.is_active = true\n"}ORDER BY q.id;

-- ============================================================
-- BACKUP INSERT (opcjonalnie — do ponownego załadowania)
-- ============================================================

INSERT INTO public.questions
  (${[
    "id",
    "topic_id",
    "text",
    "options",
    "correct_option_id",
    "explanation",
    "batch_label",
    "theme_label",
    "subtheme_label",
    "learning_outcome",
    "source_exam",
    "source_code",
    "image_url",
    "question_type",
    "timer_seconds",
    "correct_order",
    "hotspots",
    "drill_questions",
    "identify_mode",
    "disable_option_shuffle",
    "is_active",
  ].join(", ")})
VALUES
`;

  const values = rows.map((row) => rowToInsert(row)).join(",\n\n");
  return `${header}${values};`;
}

function toMarkdown(rows, meta) {
  const lines = [
    `# ${meta.subjectName} · ${meta.topicName}`,
    "",
    `Wyeksportowano: ${new Date().toISOString()}`,
    `Liczba pytań: ${rows.length}`,
    "",
  ];

  for (const row of rows) {
    lines.push(`## ${row.id}`);
    lines.push("");
    lines.push(row.text);
    lines.push("");
    for (const opt of row.options ?? []) {
      const marker = opt.id === row.correct_option_id ? "✓" : " ";
      lines.push(`- [${marker}] **${String(opt.id).toUpperCase()}.** ${opt.text}`);
    }
    lines.push("");
    lines.push(`**Poprawna odpowiedź:** ${String(row.correct_option_id).toUpperCase()} — ${optionLabel(row.options, row.correct_option_id)}`);
    lines.push("");
    lines.push("**Wyjaśnienie:**");
    lines.push("");
    lines.push(row.explanation ?? "");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function toJSON(rows, meta) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      subject: { id: meta.subjectId, name: meta.subjectName },
      topic: { id: meta.topicId, name: meta.topicName },
      count: rows.length,
      questions: rows.map((row) => ({
        id: row.id,
        text: row.text,
        options: row.options,
        correctOptionId: row.correct_option_id,
        correctAnswerText: optionLabel(row.options, row.correct_option_id),
        explanation: row.explanation,
        batchLabel: row.batch_label,
        sourceExam: row.source_exam,
        sourceCode: row.source_code,
      })),
    },
    null,
    2,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Użycie:
  node scripts/export-topic-questions.mjs [opcje]

Opcje:
  --subject <id>         domyślnie: ${DEFAULT_SUBJECT_ID}
  --topic <id>           domyślnie: ${DEFAULT_TOPIC_ID}
  --format sql|json|md   domyślnie: sql
  --out <path>           zapis do pliku (domyślnie stdout)
  --include-inactive     uwzględnij nieaktywne pytania
`);
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

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, name, subject_id, subjects(id, name)")
    .eq("id", args.topicId)
    .single();

  if (topicError || !topic) {
    console.error(`Nie znaleziono tematu ${args.topicId}:`, topicError?.message ?? "brak danych");
    process.exit(1);
  }

  if (topic.subject_id !== args.subjectId) {
    console.error(
      `Temat ${args.topicId} należy do ${topic.subject_id}, nie do ${args.subjectId}`,
    );
    process.exit(1);
  }

  let query = supabase
    .from("questions")
    .select("*")
    .eq("topic_id", args.topicId)
    .order("id", { ascending: true });

  if (!args.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data: rows, error: questionsError } = await query;

  if (questionsError) {
    console.error("Błąd pobierania pytań:", questionsError.message);
    process.exit(1);
  }

  const meta = {
    subjectId: args.subjectId,
    subjectName: topic.subjects?.name ?? args.subjectId,
    topicId: args.topicId,
    topicName: topic.name,
    includeInactive: args.includeInactive,
  };

  let output;
  if (args.format === "json") {
    output = toJSON(rows ?? [], meta);
  } else if (args.format === "md" || args.format === "markdown") {
    output = toMarkdown(rows ?? [], meta);
  } else if (args.format === "sql") {
    output = toSQL(rows ?? [], meta);
  } else {
    console.error(`Nieznany format: ${args.format}`);
    process.exit(1);
  }

  if (args.out) {
    const outPath = resolve(args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output, "utf8");
    console.log(`Zapisano ${rows?.length ?? 0} pytań → ${outPath}`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
