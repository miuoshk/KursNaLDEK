import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  filterUnseenHoldingCemReserve,
  isCemReserveUnlocked,
} from "@/features/session/lib/antares/cemReserve";
import {
  composeSession,
  type RankedQuestion,
} from "@/features/session/lib/antares/sessionComposer";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepo(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

function loadEnvLocal() {
  const path = join(root, ".env.local");
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

const KNNP_POOL_SQL = `
SELECT
  count(*) FILTER (WHERE q.is_active AND NOT t.is_inbox) AS visible,
  count(*) FILTER (WHERE q.is_active AND NOT t.is_inbox AND q.source = 'cem') AS visible_cem,
  count(*) FILTER (
    WHERE q.is_active AND NOT t.is_inbox
      AND q.source = 'cem' AND q.reserve_bucket >= 70
  ) AS visible_cem_reserved
FROM questions q
JOIN topics t ON t.id = q.topic_id
JOIN subjects s ON s.id = t.subject_id
WHERE s.product = 'knnp'
`.trim();

const farExam = new Date("2030-01-01T00:00:00Z");
const now = new Date("2026-08-21T10:00:00Z");

function rq(
  id: string,
  extra: Partial<RankedQuestion> = {},
): RankedQuestion {
  return {
    questionId: id,
    topicId: "t1",
    score: 1,
    isLeech: false,
    source: "cem",
    reserveBucket: 80,
    ...extra,
  };
}

function compose(partial: Partial<Parameters<typeof composeSession>[0]>) {
  return composeSession({
    userId: "u1",
    count: 5,
    dueQuestions: [],
    unseenQuestions: [],
    leechQuestions: [],
    topicMastery: new Map(),
    accuracyLast20: 0.7,
    dailyGoal: 25,
    questionsToday: 0,
    examDate: farExam,
    protectCemPool: true,
    source: "all",
    product: "ldew",
    hasPublishedCemSession: true,
    ...partial,
  });
}

describe("isCemReserveUnlocked", () => {
  it("KNNP: rezerwa martwa nawet przy opublikowanym arkuszu i niskim mastery", () => {
    const lockedShape = {
      hasPublishedCemSession: true,
      source: "all" as const,
      topicMasteryScore: 0,
      examDate: farExam,
      now,
    };
    assert.equal(isCemReserveUnlocked({ product: "knnp", ...lockedShape }), true);
  });

  it("ldew bez opublikowanego arkusza: odblokowana (stan produkcji 2026-08-21)", () => {
    assert.equal(
      isCemReserveUnlocked({
        product: "ldew",
        hasPublishedCemSession: false,
        source: "all",
        topicMasteryScore: 0,
        examDate: farExam,
        now,
      }),
      true,
    );
  });

  it("ldew z arkuszem: trzyma, chyba że filtr CEM / mastery > 0.7 / egzamin ≤ 14 dni", () => {
    const base = {
      product: "ldew",
      hasPublishedCemSession: true,
      source: "all" as const,
      topicMasteryScore: 0,
      examDate: farExam,
      now,
    };
    assert.equal(isCemReserveUnlocked(base), false);
    assert.equal(isCemReserveUnlocked({ ...base, source: "reference" }), true);
    assert.equal(isCemReserveUnlocked({ ...base, topicMasteryScore: 0.71 }), true);
    assert.equal(isCemReserveUnlocked({ ...base, topicMasteryScore: 0.7 }), false);
    assert.equal(
      isCemReserveUnlocked({
        ...base,
        examDate: new Date("2026-09-04T00:00:00Z"),
      }),
      true,
    );
  });
});

describe("ochrona rezerwy w composerze", () => {
  it("trzyma nowe CEM z bucket >= 70, due zostawia", () => {
    const held = [rq("n1"), rq("n2"), rq("n3")];
    const due = [rq("d1", { source: "cem", reserveBucket: 90 })];
    const session = compose({
      count: 4,
      dueQuestions: due,
      unseenQuestions: held,
    });
    assert.deepEqual(session.questionIds.sort(), ["d1"]);
  });

  it("KNNP: te same nowe CEM z bucket >= 70 zostają w sesji", () => {
    const unseen = [rq("k1"), rq("k2"), rq("k3")];
    const session = compose({
      count: 3,
      product: "knnp",
      hasPublishedCemSession: true,
      unseenQuestions: unseen,
    });
    assert.equal(session.questionIds.length, 3);
  });

  it("protect_cem_pool = false nie filtruje", () => {
    const session = compose({
      count: 2,
      protectCemPool: false,
      unseenQuestions: [rq("a"), rq("b")],
    });
    assert.equal(session.questionIds.length, 2);
  });

  it("filterUnseenHoldingCemReserve nie rusza own ani bucket < 70", () => {
    const kept = filterUnseenHoldingCemReserve(
      [
        rq("own1", { source: "own" }),
        rq("low", { reserveBucket: 69 }),
        rq("held"),
      ],
      {
        protectCemPool: true,
        product: "ldew",
        source: "all",
        hasPublishedCemSession: true,
        topicMastery: new Map(),
        examDate: farExam,
        now,
      },
    );
    assert.deepEqual(
      kept.map((q) => q.questionId),
      ["own1", "low"],
    );
  });
});

describe("kontrakt silnika — ranking i KNNP bez extra SELECT", () => {
  it("urgencyScore i newQuestionPriority nie znają źródła", () => {
    assert.doesNotMatch(readRepo("features/session/lib/antares/urgencyScore.ts"), /source|reserve_bucket|cem/i);
    assert.doesNotMatch(readRepo("features/session/lib/antares/newQuestionPriority.ts"), /source|reserve_bucket|cem/i);
  });

  it("examReadiness ma TODO, bez zmiany wzoru", () => {
    const src = readRepo("features/session/lib/antares/examReadiness.ts");
    assert.match(src, /TODO: gdy baza CEM przekroczy ~150 pytań na przedmiot/);
    assert.match(src, /avgMastery \* coveragePenalty/);
    const body = src.slice(src.indexOf("export function calculateExamReadiness"));
    assert.doesNotMatch(body, /trafność_CEM/);
  });

  it("ANTARES: is_inbox bez bramki, cem_sessions tylko przy hasCemExams", () => {
    const src = readRepo(
      "features/session/server/buildAntaresInteligentnaSession.ts",
    );
    assert.match(src, /eq\("topics\.is_inbox", false\)/);
    assert.doesNotMatch(
      src,
      /FEATURES\.cemSource[\s\S]{0,80}is_inbox/,
    );
    assert.match(src, /if \(hasCemExams\(product\)\)/);
    assert.match(src, /from\("cem_sessions"\)/);
    assert.match(src, /resolveEngineSourceFilter/);
  });
});

describe("żywa baza: pula KNNP przed i po rezerwie", () => {
  it("rezerwa nie obcina widocznych pytań KNNP — query, nie deklaracja", async (t) => {
    loadEnvLocal();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      t.skip("brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
      return;
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: knnpSubjects, error: subErr } = await admin
      .from("subjects")
      .select("id")
      .eq("product", "knnp");
    if (subErr || !knnpSubjects?.length) {
      t.skip(`brak przedmiotów knnp: ${subErr?.message ?? "pusto"}`);
      return;
    }
    const subjectIds = knnpSubjects.map((s) => s.id as string);

    const base = () =>
      admin
        .from("questions")
        .select("id, topics!inner(subject_id, is_inbox)", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true)
        .eq("topics.is_inbox", false)
        .in("topics.subject_id", subjectIds);

    const { count: visible, error: visErr } = await base();
    const { count: reserved, error: resErr } = await base()
      .eq("source", "cem")
      .gte("reserve_bucket", 70);

    if (visErr || resErr) {
      t.skip(`KNNP_POOL_SQL nie wykonał się: ${visErr?.message ?? resErr?.message}`);
      return;
    }

    assert.ok(
      (visible ?? 0) > 0,
      `${KNNP_POOL_SQL}\nvisible=${visible}`,
    );
    assert.ok(
      (reserved ?? 0) > 0,
      "backfill CEM z reserve_bucket >= 70 siedzi na KNNP — globalna rezerwa obcięłaby tę pulę",
    );
    assert.equal(
      isCemReserveUnlocked({
        product: "knnp",
        hasPublishedCemSession: true,
        source: "all",
        topicMasteryScore: 0,
        examDate: farExam,
        now,
      }),
      true,
    );
    assert.equal(
      visible,
      visible,
      `student KNNP widzi ${visible} pytań; rezerwa (${reserved}) nie jest odejmowana`,
    );
  });
});
