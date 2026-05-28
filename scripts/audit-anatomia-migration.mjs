#!/usr/bin/env node
/**
 * Audyt migracji anatomii → kanoniczny subject `anatomia` (model jak histologia).
 *
 * Wymaga: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local)
 *
 *   node scripts/audit-anatomia-migration.mjs
 *   node scripts/audit-anatomia-migration.mjs --out exports/anatomia-migration-audit
 *
 * Zapisuje: <out>.json i <out>.md
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ANATOMY_SUBJECT_IDS = ["stoma-anatomia", "lek-anatomia"];
const PAGE_SIZE = 1000;

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
  const args = { out: "exports/anatomia-migration-audit", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

/** @param {string} topicId */
function getTopicFamilyKey(topicId) {
  if (topicId.startsWith("LEK-ANA-")) return topicId.slice("LEK-".length);
  return topicId;
}

/** @param {string} topicId */
function getAnatomyPeerTopicId(topicId) {
  if (topicId.startsWith("LEK-ANA-")) return topicId.replace(/^LEK-ANA-/, "ANA-");
  if (topicId.startsWith("ANA-")) return `LEK-${topicId}`;
  return null;
}

/** @param {string} questionId */
function getAnatomyPeerQuestionId(questionId) {
  if (questionId.startsWith("lek-ana-")) return questionId.slice("lek-".length);
  if (questionId.startsWith("ana-")) return `lek-${questionId}`;
  return null;
}

/** @param {Record<string, unknown>} row */
function contentFingerprint(row) {
  const options = Array.isArray(row.options) ? row.options : [];
  const normalizedOptions = options
    .map((o) => ({
      id: o?.id ?? "",
      text: String(o?.text ?? "").trim(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const payload = {
    text: String(row.text ?? "").trim(),
    options: normalizedOptions,
    correct_option_id: row.correct_option_id ?? "",
    explanation: String(row.explanation ?? "").trim(),
    is_active: row.is_active !== false,
    source_exam: row.source_exam ?? null,
    source_code: row.source_code ?? null,
    image_url: row.image_url ?? null,
    learning_outcome: row.learning_outcome ?? null,
    disable_option_shuffle: row.disable_option_shuffle === true,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
async function fetchAllRows(buildQuery) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase @param {string[]} ids @param {string} table @param {string} column */
async function fetchRefsForIds(supabase, table, column, ids) {
  const counts = new Map();
  const CHUNK = 80;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .in(column, chunk)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      if (!data?.length) break;
      for (const row of data) {
        const id = row[column];
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }
  return counts;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase @param {string[]} ids */
async function fetchQuestionEdits(supabase, ids) {
  const byQuestion = new Map();
  const CHUNK = 80;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("question_edits")
      .select("question_id, created_at, editor_id, editor_role")
      .in("question_id", chunk)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`question_edits: ${error.message}`);
    for (const row of data ?? []) {
      const qid = row.question_id;
      if (!byQuestion.has(qid)) {
        byQuestion.set(qid, {
          count: 0,
          lastEditAt: row.created_at,
          lastEditorRole: row.editor_role,
        });
      }
      const entry = byQuestion.get(qid);
      entry.count += 1;
    }
  }
  return byQuestion;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase @param {string[]} ids */
async function fetchDualProgressPairs(supabase, ids) {
  const peerById = new Map();
  for (const id of ids) {
    const peer = getAnatomyPeerQuestionId(id);
    if (peer) peerById.set(id, peer);
  }

  const dualUsers = [];
  const CHUNK = 40;
  const checkedPairs = new Set();

  for (const [id, peer] of peerById) {
    if (!ids.includes(peer)) continue;
    const pairKey = [id, peer].sort().join("|");
    if (checkedPairs.has(pairKey)) continue;
    checkedPairs.add(pairKey);

    const { data, error } = await supabase
      .from("user_question_progress")
      .select("user_id, question_id, times_answered, reps, last_answered_at")
      .in("question_id", [id, peer]);
    if (error) throw new Error(`user_question_progress: ${error.message}`);

    const byUser = new Map();
    for (const row of data ?? []) {
      const uid = row.user_id;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(row);
    }

    for (const [userId, rows] of byUser) {
      if (rows.length >= 2) {
        dualUsers.push({
          pairKey,
          userId,
          rows: rows.map((r) => ({
            questionId: r.question_id,
            timesAnswered: r.times_answered,
            reps: r.reps,
            lastAnsweredAt: r.last_answered_at,
          })),
        });
      }
    }
  }

  return dualUsers;
}

function pickCanonicalForPair(stomaRow, lekRow, editsByQuestion) {
  const stomaEdits = editsByQuestion.get(stomaRow.id);
  const lekEdits = editsByQuestion.get(lekRow.id);
  const stomaLast = stomaEdits?.lastEditAt ? new Date(stomaEdits.lastEditAt).getTime() : 0;
  const lekLast = lekEdits?.lastEditAt ? new Date(lekEdits.lastEditAt).getTime() : 0;

  if (stomaLast > lekLast) return { canonicalId: stomaRow.id, reason: "question_edits:stoma-newer" };
  if (lekLast > stomaLast) return { canonicalId: lekRow.id, reason: "question_edits:lek-newer" };
  if ((stomaEdits?.count ?? 0) > (lekEdits?.count ?? 0)) {
    return { canonicalId: stomaRow.id, reason: "question_edits:stoma-more-edits" };
  }
  if ((lekEdits?.count ?? 0) > (stomaEdits?.count ?? 0)) {
    return { canonicalId: lekRow.id, reason: "question_edits:lek-more-edits" };
  }
  return { canonicalId: stomaRow.id, reason: "default:stoma-id" };
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# Audyt migracji anatomii → `anatomia` (kanoniczny)");
  lines.push("");
  lines.push(`**Wygenerowano:** ${report.generatedAt}`);
  lines.push("");
  lines.push("## Podsumowanie");
  lines.push("");
  lines.push(`| Metryka | Wartość |`);
  lines.push(`| --- | --- |`);
  for (const [k, v] of Object.entries(report.summary)) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push("");
  lines.push("## Topiki");
  lines.push("");
  lines.push(`- STOMA (\`stoma-anatomia\`): **${report.topics.stoma.count}**`);
  lines.push(`- LEK (\`lek-anatomia\`): **${report.topics.lek.count}**`);
  lines.push(`- Pary rodzin (\`ANA-*\` ↔ \`LEK-ANA-*\`): **${report.topics.pairedFamilies}**`);
  lines.push(`- Tylko STOMA (brak LEK-ANA): **${report.topics.stomaOnlyFamilies}**`);
  lines.push(`- Tylko LEK (brak ANA): **${report.topics.lekOnlyFamilies}**`);
  lines.push("");
  lines.push("## Pytania cross-track (pary `ana-*` ↔ `lek-ana-*`)");
  lines.push("");
  lines.push(`- Par z oboma rekordami: **${report.crossTrackPairs.matched}**`);
  lines.push(`- Treść identyczna (hash): **${report.crossTrackPairs.identical}**`);
  lines.push(`- Treść rozjechana: **${report.crossTrackPairs.diverged}**`);
  lines.push(`- Tylko \`ana-*\` (bez lek peer): **${report.crossTrackPairs.stomaOnly}**`);
  lines.push(`- Tylko \`lek-ana-*\` (bez ana peer): **${report.crossTrackPairs.lekOnly}**`);
  lines.push(`- Rekomendowany kanoniczny = zawsze \`ana-*\` po merge: **${report.crossTrackPairs.canonicalWouldBeStoma}**`);
  lines.push(`- Wyjątki (kanoniczny byłby \`lek-*\` — nowsza edycja): **${report.crossTrackPairs.canonicalWouldBeLek}**`);
  lines.push(`- Odpowiedzi w sesjach na stronie LEK (łącznie): **${report.crossTrackPairs.lekSessionAnswersTotal}**`);
  lines.push(`- Odpowiedzi w sesjach na stronie STOMA (łącznie): **${report.crossTrackPairs.stomaSessionAnswersTotal}**`);
  lines.push("");
  lines.push(
    "> **Uwaga:** „Rozjechane” pary to często różne wersje merytoryczne (STOMA rozbudowane vs LEK skrót), niekoniecznie błąd syncu. Przed migracją zsynchronizuj treść ze strony STOMA (`ana-*`) na `lek-ana-*` lub usuń duplikat LEK.",
  );
  lines.push("");

  if (report.crossTrackPairs.divergedSamples.length > 0) {
    lines.push("### Próbka rozjechanych par (max 25)");
    lines.push("");
    for (const s of report.crossTrackPairs.divergedSamples) {
      lines.push(`- \`${s.stomaId}\` ↔ \`${s.lekId}\` | sto: ${s.stomaHash} lek: ${s.lekHash} | pick: \`${s.canonicalId}\` (${s.reason})`);
    }
    lines.push("");
  }

  lines.push("## Duplikaty wewnętrzne STOMA (ten sam hash treści)");
  lines.push("");
  lines.push("### Wszystkie `ana-*` (łącznie z parami LEK)");
  lines.push("");
  lines.push(`- Grup: **${report.internalDuplicates.allStoma.groupCount}** | pytań w grupach: **${report.internalDuplicates.allStoma.questionCountInGroups}** | nadmiarowych: **${report.internalDuplicates.allStoma.redundantCount}**`);
  lines.push("");
  lines.push("### Tylko `ana-*` bez rekordu `lek-ana-*`");
  lines.push("");
  lines.push(`- Grup: **${report.internalDuplicates.stomaOnly.groupCount}** | nadmiarowych: **${report.internalDuplicates.stomaOnly.redundantCount}**`);
  lines.push("");

  const dupSection = report.internalDuplicates.allStoma.largestGroups;
  if (dupSection.length > 0) {
    lines.push("### Największe grupy — wszystkie ana (max 15)");
    lines.push("");
    for (const g of dupSection) {
      lines.push(`- hash \`${g.hash}\` × ${g.ids.length}: ${g.ids.slice(0, 6).join(", ")}${g.ids.length > 6 ? "…" : ""}`);
    }
    lines.push("");
  }

  lines.push("## Referencje FK (pytania anatomii)");
  lines.push("");
  for (const [table, stat] of Object.entries(report.foreignKeys)) {
    lines.push(`- **${table}**: ${stat.totalRefs} wpisów, ${stat.distinctQuestions} pytań`);
  }
  lines.push("");
  lines.push(`- **question_edits**: ${report.edits.questionsWithEdits} pytań z edycjami, ${report.edits.totalEdits} wpisów łącznie`);
  lines.push(`- **Użytkownicy z postępem na OBU ID pary**: ${report.progress.dualProgressUsers}`);
  lines.push("");

  if (report.progress.dualProgressSamples.length > 0) {
    lines.push("### Próbka dual progress (max 20)");
    lines.push("");
    for (const d of report.progress.dualProgressSamples) {
      lines.push(`- user \`${d.userId.slice(0, 8)}…\` | ${d.pairKey}`);
    }
    lines.push("");
  }

  lines.push("## Następne kroki");
  lines.push("");
  lines.push("1. Re-sync rozjechanych par (admin lub SQL) przed migracją.");
  lines.push("2. Migracja FK: `lek-ana-*` → `ana-*`, merge `user_question_progress`.");
  lines.push("3. Scalenie topików `LEK-ANA-*` → `ANA-*`, `subject_id` → `anatomia`.");
  lines.push("4. Dedup wewnętrzny STOMA (`is_active = false` na nadmiarowych).");
  lines.push("5. Widoczność topików per `track` dla LEK (jeśli całość w `anatomia`).");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Użycie: node scripts/audit-anatomia-migration.mjs [--out exports/anatomia-migration-audit]`);
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

  console.log("Pobieranie topików anatomii…");
  const topics = await fetchAllRows(() =>
    supabase
      .from("topics")
      .select("id, name, subject_id, display_order, question_count")
      .in("subject_id", ANATOMY_SUBJECT_IDS)
      .order("subject_id")
      .order("display_order"),
  );

  const topicById = new Map(topics.map((t) => [t.id, t]));
  const topicIds = topics.map((t) => t.id);

  console.log(`Pobieranie pytań (${topicIds.length} topików)…`);
  const questions = [];
  const TOPIC_CHUNK = 50;
  for (let i = 0; i < topicIds.length; i += TOPIC_CHUNK) {
    const chunk = topicIds.slice(i, i + TOPIC_CHUNK);
    const batch = await fetchAllRows(() =>
      supabase
        .from("questions")
        .select(
          "id, topic_id, text, options, correct_option_id, explanation, is_active, source_exam, source_code, image_url, learning_outcome, disable_option_shuffle",
        )
        .in("topic_id", chunk)
        .order("id"),
    );
    questions.push(...batch);
  }

  const questionById = new Map(questions.map((q) => [q.id, q]));
  const questionIds = questions.map((q) => q.id);

  console.log("Pobieranie question_edits…");
  const editsByQuestion = await fetchQuestionEdits(supabase, questionIds);

  console.log("Liczenie referencji FK…");
  const [sessionAnswers, discussions, saved, reports] = await Promise.all([
    fetchRefsForIds(supabase, "session_answers", "question_id", questionIds),
    fetchRefsForIds(supabase, "question_discussions", "question_id", questionIds),
    fetchRefsForIds(supabase, "saved_questions", "question_id", questionIds),
    fetchRefsForIds(supabase, "error_reports", "question_id", questionIds),
  ]);

  console.log("Sprawdzanie dual progress na parach…");
  const dualProgress = await fetchDualProgressPairs(supabase, questionIds);

  const stomaTopics = topics.filter((t) => t.subject_id === "stoma-anatomia");
  const lekTopics = topics.filter((t) => t.subject_id === "lek-anatomia");

  const stomaFamilies = new Set(stomaTopics.map((t) => getTopicFamilyKey(t.id)));
  const lekFamilies = new Set(lekTopics.map((t) => getTopicFamilyKey(t.id)));

  let pairedFamilies = 0;
  let stomaOnlyFamilies = 0;
  let lekOnlyFamilies = 0;
  for (const f of stomaFamilies) {
    if (lekFamilies.has(f)) pairedFamilies += 1;
    else stomaOnlyFamilies += 1;
  }
  for (const f of lekFamilies) {
    if (!stomaFamilies.has(f)) lekOnlyFamilies += 1;
  }

  const crossTrackPairs = {
    matched: 0,
    identical: 0,
    diverged: 0,
    stomaOnly: 0,
    lekOnly: 0,
    canonicalWouldBeStoma: 0,
    canonicalWouldBeLek: 0,
    divergedSamples: [],
    pairDetails: [],
  };

  const processedLek = new Set();

  for (const q of questions) {
    if (!q.id.startsWith("ana-")) continue;
    const peerId = getAnatomyPeerQuestionId(q.id);
    if (!peerId) continue;
    const peer = questionById.get(peerId);
    if (!peer) {
      crossTrackPairs.stomaOnly += 1;
      continue;
    }
    processedLek.add(peerId);
    crossTrackPairs.matched += 1;

    const stomaHash = contentFingerprint(q);
    const lekHash = contentFingerprint(peer);
    const identical = stomaHash === lekHash;
    if (identical) crossTrackPairs.identical += 1;
    else crossTrackPairs.diverged += 1;

    const pick = pickCanonicalForPair(q, peer, editsByQuestion);
    if (pick.canonicalId === q.id) crossTrackPairs.canonicalWouldBeStoma += 1;
    else crossTrackPairs.canonicalWouldBeLek += 1;

    const detail = {
      stomaId: q.id,
      lekId: peer.id,
      topicStoma: q.topic_id,
      topicLek: peer.topic_id,
      stomaHash,
      lekHash,
      identical,
      canonicalId: pick.canonicalId === q.id ? q.id : peer.id,
      canonicalTarget: pick.canonicalId.startsWith("ana-") ? "ana" : "lek",
      reason: pick.reason,
      stomaEdits: editsByQuestion.get(q.id)?.count ?? 0,
      lekEdits: editsByQuestion.get(peer.id)?.count ?? 0,
      sessionAnswersStoma: sessionAnswers.get(q.id) ?? 0,
      sessionAnswersLek: sessionAnswers.get(peer.id) ?? 0,
      discussionsStoma: discussions.get(q.id) ?? 0,
      discussionsLek: discussions.get(peer.id) ?? 0,
    };
    crossTrackPairs.pairDetails.push(detail);

    if (!identical && crossTrackPairs.divergedSamples.length < 25) {
      crossTrackPairs.divergedSamples.push(detail);
    }
  }

  for (const q of questions) {
    if (!q.id.startsWith("lek-ana-")) continue;
    if (processedLek.has(q.id)) continue;
    crossTrackPairs.lekOnly += 1;
  }

  const stomaOnlyQuestions = questions.filter(
    (q) => q.id.startsWith("ana-") && !questionById.has(getAnatomyPeerQuestionId(q.id) ?? ""),
  );
  crossTrackPairs.stomaOnly = stomaOnlyQuestions.length;

  const hashGroupsAllStoma = new Map();
  const hashGroupsStomaOnly = new Map();
  for (const q of questions) {
    if (!q.id.startsWith("ana-")) continue;
    const hash = contentFingerprint(q);
    if (!hashGroupsAllStoma.has(hash)) hashGroupsAllStoma.set(hash, []);
    hashGroupsAllStoma.get(hash).push(q.id);

    const peer = getAnatomyPeerQuestionId(q.id);
    if (peer && questionById.has(peer)) continue;
    if (!hashGroupsStomaOnly.has(hash)) hashGroupsStomaOnly.set(hash, []);
    hashGroupsStomaOnly.get(hash).push(q.id);
  }

  const hashGroups = hashGroupsStomaOnly;

  function summarizeDuplicateGroups(groupMap) {
    const groups = [...groupMap.values()].filter((ids) => ids.length >= 2);
    groups.sort((a, b) => b.length - a.length);
    let redundant = 0;
    for (const ids of groups) redundant += ids.length - 1;
    return {
      groupCount: groups.length,
      questionCountInGroups: groups.reduce((s, g) => s + g.length, 0),
      redundantCount: redundant,
      largestGroups: groups.slice(0, 15).map((ids) => ({
        hash: contentFingerprint(questionById.get(ids[0])),
        ids: ids.sort(),
      })),
    };
  }

  const duplicateGroups = [...hashGroups.values()].filter((ids) => ids.length >= 2);
  const allStomaDup = summarizeDuplicateGroups(hashGroupsAllStoma);
  const stomaOnlyDup = summarizeDuplicateGroups(hashGroupsStomaOnly);

  let redundantCount = stomaOnlyDup.redundantCount;

  let lekSessionAnswersTotal = 0;
  let stomaSessionAnswersTotal = 0;
  for (const d of crossTrackPairs.pairDetails) {
    lekSessionAnswersTotal += d.sessionAnswersLek;
    stomaSessionAnswersTotal += d.sessionAnswersStoma;
  }
  crossTrackPairs.lekSessionAnswersTotal = lekSessionAnswersTotal;
  crossTrackPairs.stomaSessionAnswersTotal = stomaSessionAnswersTotal;

  const totalEdits = [...editsByQuestion.values()].reduce((s, e) => s + e.count, 0);

  const fkStat = (map) => ({
    totalRefs: [...map.values()].reduce((a, b) => a + b, 0),
    distinctQuestions: map.size,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      topicsTotal: topics.length,
      questionsTotal: questions.length,
      questionsActive: questions.filter((q) => q.is_active !== false).length,
      crossTrackPairs: crossTrackPairs.matched,
      crossTrackDiverged: crossTrackPairs.diverged,
      internalDuplicateGroupsAllStoma: allStomaDup.groupCount,
      internalDuplicateGroupsStomaOnly: stomaOnlyDup.groupCount,
      dualProgressUsers: dualProgress.length,
      questionEditsTotal: totalEdits,
    },
    topics: {
      stoma: { count: stomaTopics.length, ids: stomaTopics.map((t) => t.id) },
      lek: { count: lekTopics.length, ids: lekTopics.map((t) => t.id) },
      pairedFamilies,
      stomaOnlyFamilies,
      lekOnlyFamilies,
      unpairedLek: lekTopics
        .filter((t) => !stomaFamilies.has(getTopicFamilyKey(t.id)))
        .map((t) => ({ id: t.id, name: t.name })),
    },
    crossTrackPairs,
    internalDuplicates: {
      allStoma: allStomaDup,
      stomaOnly: stomaOnlyDup,
    },
    foreignKeys: {
      session_answers: fkStat(sessionAnswers),
      question_discussions: fkStat(discussions),
      saved_questions: fkStat(saved),
      error_reports: fkStat(reports),
    },
    edits: {
      totalEdits,
      questionsWithEdits: editsByQuestion.size,
      byQuestion: Object.fromEntries(
        [...editsByQuestion.entries()].map(([id, e]) => [
          id,
          { count: e.count, lastEditAt: e.lastEditAt },
        ]),
      ),
    },
    progress: {
      dualProgressUsers: dualProgress.length,
      dualProgressSamples: dualProgress.slice(0, 20),
    },
    topicPairs: stomaTopics
      .map((st) => {
        const peerId = getAnatomyPeerTopicId(st.id);
        const peer = peerId ? topicById.get(peerId) : null;
        return {
          stomaTopicId: st.id,
          stomaTopicName: st.name,
          lekTopicId: peer?.id ?? null,
          lekTopicName: peer?.name ?? null,
          hasPair: !!peer,
        };
      })
      .filter((t) => t.hasPair || t.stomaTopicId.startsWith("ANA-")),
  };

  const basePath = resolve(args.out);
  mkdirSync(dirname(basePath), { recursive: true });
  const jsonPath = basePath.endsWith(".json") ? basePath : `${basePath}.json`;
  const mdPath = basePath.endsWith(".md")
    ? basePath
    : basePath.replace(/\.json$/, "") + ".md";

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(mdPath, toMarkdown(report), "utf8");

  console.log("\n=== Audyt migracji anatomii ===\n");
  console.log(`Topiki: ${report.summary.topicsTotal} | Pytania: ${report.summary.questionsTotal}`);
  console.log(`Pary cross-track: ${crossTrackPairs.matched} (rozjechane: ${crossTrackPairs.diverged})`);
  console.log(`Tylko ana-*: ${crossTrackPairs.stomaOnly} | Tylko lek-ana-*: ${crossTrackPairs.lekOnly}`);
  console.log(
    `Duplikaty wewn. (hash): wszystkie ana ${allStomaDup.groupCount} grup | tylko stoma-only ${stomaOnlyDup.groupCount} grup`,
  );
  console.log(`Dual progress users: ${dualProgress.length}`);
  console.log(`\nZapisano:\n  ${jsonPath}\n  ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
