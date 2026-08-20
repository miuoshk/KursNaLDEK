/**
 * Insert r_anat_2026/1: działy ANA-* + theme_label=2026, tracks NULL.
 * Exact stem+options+klucz → nie wstawiaj; tylko dociągnięcie theme_label=2026.
 * ID: ana-xxx-NNN = max seq z bazy + 1.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak URL lub SERVICE_ROLE_KEY");
  process.exit(1);
}

const BATCH = "r_anat_2026/1";
const ANA_TOPICS = [
  "ANA-CZA",
  "ANA-JAM",
  "ANA-KON",
  "ANA-MIE",
  "ANA-NAC",
  "ANA-NER",
  "ANA-OBW",
  "ANA-OUN",
  "ANA-TRZ",
  "ANA-TUL",
];
const items = JSON.parse(
  readFileSync(resolve("exports/anatomia-batch-lek-r2026-1.json"), "utf8"),
);
const supabase = createClient(url, key, { auth: { persistSession: false } });

function fingerprint(text, options, key) {
  const opts = (options ?? [])
    .map((o) => `${o.id}:${String(o.text ?? "").trim()}`)
    .join("|");
  return `${String(text ?? "").trim()}\n${opts}\n${key}`;
}

async function fetchAll(select, topicIds) {
  const all = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select(select)
      .in("topic_id", topicIds)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return all;
}

const { count: dupBatch } = await supabase
  .from("questions")
  .select("id", { count: "exact", head: true })
  .eq("batch_label", BATCH);
if (dupBatch) {
  console.error("Batch", BATCH, "już istnieje:", dupBatch);
  process.exit(1);
}

const existing = await fetchAll(
  "id, topic_id, text, options, correct_option_id, theme_label, is_active",
  ANA_TOPICS,
);
const byFp = new Map();
for (const row of existing) {
  byFp.set(fingerprint(row.text, row.options, row.correct_option_id), row);
}

const toInsert = [];
const toTag = [];
for (const q of items) {
  const fp = fingerprint(q.text, q.options, q.correct_option_id);
  const hit = byFp.get(fp);
  if (hit) {
    toTag.push(hit);
    continue;
  }
  toInsert.push(q);
}

console.log("plik", items.length, "duplikaty", toTag.length, "nowe", toInsert.length);

for (const row of toTag) {
  if (row.theme_label === "2026") continue;
  const { error } = await supabase
    .from("questions")
    .update({ theme_label: "2026" })
    .eq("id", row.id);
  if (error) {
    console.error("tag fail", row.id, error);
    process.exit(1);
  }
  console.log("tagged existing", row.id);
}

const maxes = Object.fromEntries(ANA_TOPICS.map((t) => [t, 0]));
for (const row of existing) {
  const m = String(row.id).match(/(\d+)$/);
  if (!m) continue;
  const n = Number(m[1]);
  if (n > maxes[row.topic_id]) maxes[row.topic_id] = n;
}

const counters = { ...maxes };
const rows = toInsert.map((q) => {
  counters[q.topic_id] += 1;
  return {
    id: `${q.topic_id.toLowerCase()}-${String(counters[q.topic_id]).padStart(3, "0")}`,
    topic_id: q.topic_id,
    text: q.text,
    options: q.options,
    correct_option_id: q.correct_option_id,
    explanation: q.explanation,
    subtheme_label: q.subtheme_label,
    source_code: q.source_code,
    batch_label: q.batch_label,
    source_exam: q.source_exam,
    theme_label: "2026",
    tracks: null,
  };
});

if (rows.length) {
  console.log("maxes before", maxes);
  console.log("insert", rows.length, rows[0].id, "...", rows[rows.length - 1].id);
  const chunk = 25;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from("questions").insert(slice);
    if (error) {
      console.error("insert fail at", i, error);
      process.exit(1);
    }
    console.log("inserted", i + slice.length);
  }
}

const allAfter = await fetchAll("id, topic_id, is_active", ANA_TOPICS);
const byTopic = {};
for (const r of allAfter) {
  if (r.is_active === false) continue;
  byTopic[r.topic_id] = (byTopic[r.topic_id] ?? 0) + 1;
}
for (const [id, cnt] of Object.entries(byTopic)) {
  const { error } = await supabase
    .from("topics")
    .update({ question_count: cnt })
    .eq("id", id);
  if (error) {
    console.error("count update fail", id, error);
    process.exit(1);
  }
}
console.log("question_count synced", byTopic);
console.log("OK");
