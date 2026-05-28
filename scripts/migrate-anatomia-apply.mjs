#!/usr/bin/env node
/**
 * Migracja anatomii → kanoniczny subject `anatomia` (big bang).
 *
 *   node scripts/migrate-anatomia-apply.mjs           # dry-run
 *   node scripts/migrate-anatomia-apply.mjs --apply   # wykonaj
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const ANATOMY_SUBJECTS = ["stoma-anatomia", "lek-anatomia"];
const CONTENT_FIELDS = [
  "text",
  "options",
  "correct_option_id",
  "explanation",
  "is_active",
  "source_exam",
  "source_code",
  "image_url",
  "theme_label",
  "subtheme_label",
  "batch_label",
  "learning_outcome",
  "disable_option_shuffle",
];

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

function lekQuestionToCanonical(lekId) {
  if (!lekId.startsWith("lek-ana-")) return null;
  return lekId.slice("lek-".length);
}

function lekTopicToCanonical(topicId) {
  if (!topicId.startsWith("LEK-ANA-")) return null;
  return topicId.replace(/^LEK-ANA-/, "ANA-");
}

function pickContentSource(stomaEditMs, lekEditMs) {
  if (lekEditMs > stomaEditMs) return "lek";
  return "stoma";
}

function mergeProgressRows(canonical, lek) {
  const cReps = Number(canonical.reps ?? 0);
  const lReps = Number(lek.reps ?? 0);
  const primary = lReps > cReps ? lek : canonical;
  const secondary = primary === lek ? canonical : lek;

  return {
    times_answered:
      Number(canonical.times_answered ?? 0) + Number(lek.times_answered ?? 0),
    times_correct:
      Number(canonical.times_correct ?? 0) + Number(lek.times_correct ?? 0),
    stability: primary.stability ?? secondary.stability ?? 0,
    difficulty_rating: primary.difficulty_rating ?? secondary.difficulty_rating ?? 0.3,
    elapsed_days: Math.max(Number(canonical.elapsed_days ?? 0), Number(lek.elapsed_days ?? 0)),
    scheduled_days: Math.max(
      Number(canonical.scheduled_days ?? 0),
      Number(lek.scheduled_days ?? 0),
    ),
    reps: Math.max(cReps, lReps),
    lapses: Number(canonical.lapses ?? 0) + Number(lek.lapses ?? 0),
    state: primary.state ?? secondary.state ?? "new",
    next_review: primary.next_review ?? secondary.next_review ?? null,
    last_answered_at: primary.last_answered_at ?? secondary.last_answered_at ?? null,
    last_confidence: primary.last_confidence ?? secondary.last_confidence ?? null,
    correct_streak: Math.max(
      Number(canonical.correct_streak ?? 0),
      Number(lek.correct_streak ?? 0),
    ),
    wrong_streak: Math.max(Number(canonical.wrong_streak ?? 0), Number(lek.wrong_streak ?? 0)),
    is_leech: Boolean(canonical.is_leech || lek.is_leech),
    leech_count: Math.max(Number(canonical.leech_count ?? 0), Number(lek.leech_count ?? 0)),
    avg_time_seconds: primary.avg_time_seconds ?? secondary.avg_time_seconds ?? null,
    last_rating: primary.last_rating ?? secondary.last_rating ?? null,
  };
}

async function fetchAll(sb, table, select, filterFn) {
  const rows = [];
  let from = 0;
  const page = 1000;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + page - 1);
    if (filterFn) q = filterFn(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sb = createClient(url, key);
  const log = { mode: APPLY ? "apply" : "dry-run", steps: [] };
  const step = (name, detail) => {
    log.steps.push({ name, ...detail });
    console.log(`[${APPLY ? "APPLY" : "DRY"}] ${name}`, detail ?? "");
  };

  const topicRows = await fetchAll(sb, "topics", "id, subject_id, name", (q) =>
    q.in("subject_id", [...ANATOMY_SUBJECTS, "anatomia"]),
  );

  const topicIds = topicRows.map((t) => t.id);
  const questions = [];
  for (let i = 0; i < topicIds.length; i += 40) {
    const chunk = topicIds.slice(i, i + 40);
    const batch = await fetchAll(sb, "questions", "*", (q) => q.in("topic_id", chunk));
    questions.push(...batch);
  }

  const questionById = new Map(questions.map((q) => [q.id, q]));
  const pairs = [];
  for (const q of questions) {
    if (!q.id.startsWith("ana-")) continue;
    const lekId = `lek-${q.id}`;
    const lek = questionById.get(lekId);
    if (lek) pairs.push({ canonicalId: q.id, lekId, stoma: q, lek });
  }

  const edits = await fetchAll(sb, "question_edits", "question_id, created_at");
  const lastEditByQ = new Map();
  for (const e of edits) {
    const t = new Date(e.created_at).getTime();
    const prev = lastEditByQ.get(e.question_id) ?? 0;
    if (t > prev) lastEditByQ.set(e.question_id, t);
  }

  step("inventory", {
    topics: topicRows.length,
    questions: questions.length,
    pairs: pairs.length,
    lekOnlyQuestions: questions.filter((q) => q.id.startsWith("lek-ana-")).length - pairs.length,
  });

  const { count: lekExisting } = await sb
    .from("questions")
    .select("id", { count: "exact", head: true })
    .like("id", "lek-ana-%");

  if ((lekExisting ?? 0) === 0 && APPLY) {
    console.log("Migracja FK już wykonana (0 pytań lek-ana-*). Pomijam cleanup.");
    writeFileSync(
      resolve("exports/anatomia-migration-apply-log.json"),
      JSON.stringify({ mode: "already_done", lekQuestions: 0 }, null, 2),
    );
    return;
  }

  if (!APPLY) {
    let syncFromLek = 0;
    for (const p of pairs) {
      const src = pickContentSource(
        lastEditByQ.get(p.canonicalId) ?? 0,
        lastEditByQ.get(p.lekId) ?? 0,
      );
      if (src === "lek") syncFromLek += 1;
    }
    step("would_sync_content", { fromLek: syncFromLek, fromStoma: pairs.length - syncFromLek });
    writeFileSync(
      resolve("exports/anatomia-migration-apply-log.json"),
      JSON.stringify(log, null, 2),
    );
    console.log("\nDry-run zakończony. Uruchom z --apply aby wykonać migrację.");
    return;
  }

  // 1. Subject kanoniczny
  const { error: subErr } = await sb.from("subjects").upsert({
    id: "anatomia",
    name: "Anatomia",
    short_name: "Anatomia",
    icon_name: "bone",
    year: 1,
    track: "shared",
    product: "knnp",
    display_order: 99,
  });
  if (subErr) throw new Error(subErr.message);
  step("subject_anatomia", { ok: true });

  // 2. Treść par — nowsza edycja wygrywa → zapis na ana-*
  for (const p of pairs) {
    const src = pickContentSource(
      lastEditByQ.get(p.canonicalId) ?? 0,
      lastEditByQ.get(p.lekId) ?? 0,
    );
    const winner = src === "lek" ? p.lek : p.stoma;
    const payload = {};
    for (const f of CONTENT_FIELDS) payload[f] = winner[f];
    const canonicalTopic = lekTopicToCanonical(winner.topic_id) ?? winner.topic_id;
    if (canonicalTopic.startsWith("ANA-")) payload.topic_id = canonicalTopic;

    const { error } = await sb.from("questions").update(payload).eq("id", p.canonicalId);
    if (error) throw new Error(`sync ${p.canonicalId}: ${error.message}`);
  }
  step("sync_pair_content", { pairs: pairs.length });

  // 3. Pytania na topikach LEK-ANA → ANA-*
  const lekTopicQuestions = questions.filter((q) => q.topic_id?.startsWith("LEK-ANA-"));
  for (const q of lekTopicQuestions) {
    const newTopic = lekTopicToCanonical(q.topic_id);
    if (!newTopic || newTopic === q.topic_id) continue;
    if (q.id.startsWith("lek-ana-")) continue;
    const { error } = await sb.from("questions").update({ topic_id: newTopic }).eq("id", q.id);
    if (error) throw new Error(`topic ${q.id}: ${error.message}`);
  }

  // 4. Topiki → anatomia
  const { error: topicSubErr } = await sb
    .from("topics")
    .update({ subject_id: "anatomia" })
    .in("subject_id", ANATOMY_SUBJECTS);
  if (topicSubErr) throw new Error(topicSubErr.message);
  step("topics_to_anatomia", { ok: true });

  // 5. Przepięcie FK + merge UQP
  const lekIds = pairs.map((p) => p.lekId);
  const fkTables = [
    "session_answers",
    "question_discussions",
    "error_reports",
    "question_edits",
  ];

  for (const table of fkTables) {
    let updated = 0;
    let deleted = 0;
    for (const lekId of lekIds) {
      const canonicalId = lekQuestionToCanonical(lekId);
      const { data: lekRows } = await sb.from(table).select("id").eq("question_id", lekId);
      for (const row of lekRows ?? []) {
        const { data: conflict } = await sb
          .from(table)
          .select("id")
          .eq("question_id", canonicalId)
          .neq("id", row.id)
          .limit(1);
        if (conflict?.length) {
          const { error } = await sb.from(table).delete().eq("id", row.id);
          if (error) throw new Error(`${table} delete ${lekId}: ${error.message}`);
          deleted += 1;
        } else {
          const { error } = await sb
            .from(table)
            .update({ question_id: canonicalId })
            .eq("id", row.id);
          if (error) throw new Error(`${table} ${lekId}: ${error.message}`);
          updated += 1;
        }
      }
    }
    step(`fk_remap_${table}`, { updated, deleted });
  }

  // saved_questions — usuń kolizje, potem przepnij
  const { data: savedLek } = await sb
    .from("saved_questions")
    .select("id, user_id, question_id")
    .in("question_id", lekIds);
  for (const row of savedLek ?? []) {
    const canonicalId = lekQuestionToCanonical(row.question_id);
    const { data: existing } = await sb
      .from("saved_questions")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("question_id", canonicalId)
      .maybeSingle();
    if (existing?.id) {
      await sb.from("saved_questions").delete().eq("id", row.id);
    } else {
      await sb
        .from("saved_questions")
        .update({ question_id: canonicalId })
        .eq("id", row.id);
    }
  }
  step("saved_questions", { rows: savedLek?.length ?? 0 });

  // user_question_progress
  const { data: uqpLek } = await sb
    .from("user_question_progress")
    .select("*")
    .in("question_id", lekIds);

  let merged = 0;
  let moved = 0;
  for (const lekRow of uqpLek ?? []) {
    const canonicalId = lekQuestionToCanonical(lekRow.question_id);
    const { data: canonRow } = await sb
      .from("user_question_progress")
      .select("*")
      .eq("user_id", lekRow.user_id)
      .eq("question_id", canonicalId)
      .maybeSingle();

    if (canonRow) {
      const mergedPayload = mergeProgressRows(canonRow, lekRow);
      const { error } = await sb
        .from("user_question_progress")
        .update(mergedPayload)
        .eq("id", canonRow.id);
      if (error) throw new Error(`uqp merge: ${error.message}`);
      await sb.from("user_question_progress").delete().eq("id", lekRow.id);
      merged += 1;
    } else {
      const { error } = await sb
        .from("user_question_progress")
        .update({ question_id: canonicalId })
        .eq("id", lekRow.id);
      if (error) throw new Error(`uqp move: ${error.message}`);
      moved += 1;
    }
  }
  step("user_question_progress", { merged, moved });

  // 6. Usuń lek-ana pytania
  for (let i = 0; i < lekIds.length; i += 50) {
    const chunk = lekIds.slice(i, i + 50);
    const { error } = await sb.from("questions").delete().in("id", chunk);
    if (error) throw new Error(`delete questions: ${error.message}`);
  }
  step("delete_lek_questions", { count: lekIds.length });

  // 7. Usuń topiki LEK-ANA-*
  const lekTopicIds = topicRows.filter((t) => t.id.startsWith("LEK-ANA-")).map((t) => t.id);
  if (lekTopicIds.length > 0) {
    const { error } = await sb.from("topics").delete().in("id", lekTopicIds);
    if (error) throw new Error(`delete topics: ${error.message}`);
  }
  step("delete_lek_topics", { count: lekTopicIds.length });

  // 8. Przelicz question_count
  const anaTopics = topicRows
    .filter((t) => t.id.startsWith("ANA-"))
    .map((t) => t.id);
  for (const tid of anaTopics) {
    const { count } = await sb
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", tid)
      .eq("is_active", true);
    await sb.from("topics").update({ question_count: count ?? 0 }).eq("id", tid);
  }
  step("sync_topic_counts", { topics: anaTopics.length });

  const { count: lekLeft } = await sb
    .from("questions")
    .select("id", { count: "exact", head: true })
    .like("id", "lek-ana-%");
  const { count: anaQ } = await sb
    .from("questions")
    .select("id", { count: "exact", head: true })
    .in(
      "topic_id",
      anaTopics.length ? anaTopics : ["__none__"],
    );

  step("verify", { lekQuestionsRemaining: lekLeft ?? 0, questionsOnAnaTopics: anaQ ?? 0 });

  writeFileSync(
    resolve("exports/anatomia-migration-apply-log.json"),
    JSON.stringify(log, null, 2),
  );
  console.log("\nMigracja anatomii zakończona.");
  console.log(`Log: exports/anatomia-migration-apply-log.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
