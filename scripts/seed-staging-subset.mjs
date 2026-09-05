#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SEED = "ufo-staging-2026";
const PAGE = 200;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Brak ${name}.`);
  return value;
}

function client(url, key) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hashRank(id) {
  return createHash("md5").update(`${id}${SEED}`).digest("hex");
}

async function allRows(supabase, table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function upsert(supabase, table, rows, onConflict) {
  for (let index = 0; index < rows.length; index += 50) {
    const chunk = rows.slice(index, index + 50);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const prod = client(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
);
const stagingUrl =
  process.env.STAGING_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_STAGING_SUPABASE_URL;
const stagingKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
const apply = process.argv.includes("--apply");

const subjects = await allRows(prod, "subjects", "*");
const topics = await allRows(prod, "topics", "*");
const configs = await allRows(prod, "learning_experiment_configs", "*");
const questions = await allRows(
  prod,
  "questions",
  "id, topic_id, text, options, correct_option_id, explanation, source_exam, source_code, image_url, is_active, created_at, question_type, learning_outcome, theme_label, subtheme_label, batch_label, disable_option_shuffle, tracks, source, first_seen_session, repeat_count, explanation_status, content_hash, reserve_bucket, explanation_blocks, explanation_legacy, blocks_status, blocks_source, blocks_updated_at",
);

const topicById = new Map(topics.map((topic) => [topic.id, topic]));
const chirurgia = [];
const anatomia = [];
const endo = [];
for (const question of questions) {
  const subjectId = topicById.get(question.topic_id)?.subject_id;
  if (subjectId === "ldew-chirurgia-stomatologiczna") chirurgia.push(question);
  else if (subjectId === "anatomia") anatomia.push(question);
  else if (subjectId === "ldew-endodoncja") endo.push(question);
}
anatomia.sort((a, b) => hashRank(a.id) - hashRank(b.id));
endo.sort((a, b) => hashRank(a.id) - hashRank(b.id));
const selected = [
  ...chirurgia,
  ...anatomia.slice(0, 500),
  ...endo.slice(0, 200),
];
const selectedIds = new Set(selected.map((row) => row.id));

const conceptLinks = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await prod
    .from("question_concepts")
    .select("*")
    .range(from, from + PAGE - 1);
  if (error) throw error;
  for (const row of data ?? []) {
    if (selectedIds.has(row.question_id)) conceptLinks.push(row);
  }
  if (!data || data.length < PAGE) break;
}
const conceptIds = [...new Set(conceptLinks.map((row) => row.concept_id))];
const concepts = [];
for (let index = 0; index < conceptIds.length; index += PAGE) {
  const { data, error } = await prod
    .from("concepts")
    .select("*")
    .in("id", conceptIds.slice(index, index + PAGE));
  if (error) throw error;
  concepts.push(...(data ?? []));
}

const summary = {
  subjects: subjects.length,
  topics: topics.length,
  questions: selected.length,
  chirurgia: chirurgia.length,
  anatomia: Math.min(500, anatomia.length),
  endodoncja: Math.min(200, endo.length),
  question_concepts: conceptLinks.length,
  concepts: concepts.length,
  experiment_configs: configs.length,
};
console.log(JSON.stringify(summary, null, 2));

if (!apply) {
  console.error("Dry-run. Dodaj --apply oraz STAGING_SUPABASE_* aby skopiować.");
  process.exit(0);
}

if (!stagingUrl || !stagingKey) {
  throw new Error(
    "Brak STAGING_SUPABASE_URL albo STAGING_SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const staging = client(stagingUrl, stagingKey);
await upsert(staging, "subjects", subjects, "id");
await upsert(staging, "topics", topics, "id");
await upsert(staging, "questions", selected, "id");
if (concepts.length) await upsert(staging, "concepts", concepts, "id");
if (conceptLinks.length) {
  await upsert(staging, "question_concepts", conceptLinks, "question_id,concept_id");
}
await upsert(staging, "learning_experiment_configs", configs, "experiment_key");
console.error("Skopiowano podzbiór na ufo-staging.");
