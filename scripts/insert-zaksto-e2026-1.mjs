/**
 * Jednorazowy insert batcha z2026-1 (choroby zakaźne STOMA).
 * ID z JSON: zaksto-z2026-1-{n}.
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

const BATCH = "z2026-1";
const items = JSON.parse(
  readFileSync(resolve("exports/zakazne-batch-stoma-2026-1.json"), "utf8"),
);
const supabase = createClient(url, key, { auth: { persistSession: false } });

const topicIds = [...new Set(items.map((q) => q.topic_id))];
async function fetchAllIds(client, ids) {
  const all = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await client
      .from("questions")
      .select("id, topic_id, is_active")
      .in("topic_id", ids)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return all;
}

const rows = items.map((q) => ({
  id: q.id,
  topic_id: q.topic_id,
  text: q.text,
  options: q.options,
  correct_option_id: q.correct_option_id,
  explanation: q.explanation,
  subtheme_label: q.subtheme_label,
  source_code: q.source_code,
  batch_label: q.batch_label,
  source_exam: q.source_exam,
  theme_label: q.theme_label ?? "2026",
}));

console.log("to insert", rows.length, rows[0].id, "...", rows[rows.length - 1].id);

const { count: dupBatch } = await supabase
  .from("questions")
  .select("id", { count: "exact", head: true })
  .eq("batch_label", BATCH);
if (dupBatch) {
  console.error("Batch", BATCH, "już istnieje:", dupBatch);
  process.exit(1);
}

const ids = rows.map((r) => r.id);
const { data: existingIds, error: existErr } = await supabase
  .from("questions")
  .select("id")
  .in("id", ids);
if (existErr) {
  console.error("id check fail", existErr);
  process.exit(1);
}
if (existingIds?.length) {
  console.error("Kolizja ID:", existingIds.map((r) => r.id));
  process.exit(1);
}

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

const allAfter = await fetchAllIds(supabase, topicIds);
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
