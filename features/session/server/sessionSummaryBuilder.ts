import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type { Confidence, SessionMode } from "@/features/session/types";
import { parseStoredSessionInsights } from "@/features/session/lib/parseStoredSessionInsights";
import { parseDailyPlanProgress } from "@/features/session/lib/parseDailyPlanProgress";
import { inferSessionTopicId } from "@/features/session/lib/inferSessionTopicId";

function topicNameFromJoin(
  topics: { name: string } | { name: string }[] | null | undefined,
): string {
  if (!topics) return "Temat";
  if (Array.isArray(topics)) return topics[0]?.name ?? "Temat";
  return topics.name ?? "Temat";
}

type OptRow = { id: string; text: string };

function optionText(optsJson: unknown, id: string): string {
  const opts = Array.isArray(optsJson) ? (optsJson as OptRow[]) : [];
  return opts.find((o) => o.id === id)?.text ?? id;
}

function maxConsecutiveCorrect(rows: { is_correct: boolean }[]): number {
  let best = 0;
  let cur = 0;
  for (const row of rows) {
    if (row.is_correct) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

export async function buildSessionSummary(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<SessionSummaryData | null> {
  const { data: session, error: se } = await supabase
    .from("study_sessions")
    .select(
      "id, user_id, subject_id, topic_id, mode, total_questions, correct_answers, duration_seconds, xp_earned, is_completed, session_insights, plan_snapshot",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (se || !session) return null;

  const subjId = session.subject_id as string;

  const [subjectRes, profileRes, prevRes, ansRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, short_name")
      .eq("id", subjId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("xp, current_streak, exam_readiness_score")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("study_sessions")
      .select("accuracy, total_questions")
      .eq("user_id", userId)
      .eq("subject_id", subjId)
      .eq("is_completed", true)
      .neq("id", sessionId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("session_answers")
      .select(
        "question_id, selected_option_id, is_correct, confidence, time_spent_seconds, question_order, is_first_exposure",
      )
      .eq("session_id", sessionId)
      .order("question_order", { ascending: true }),
  ]);

  const subject = subjectRes.data;
  const profile = profileRes.data;
  const prev = prevRes.data;
  const rows = ansRes.data ?? [];

  if (!subject) return null;
  const qids = [...new Set(rows.map((r) => r.question_id as string))];

  const { data: qmeta } = await supabase
    .from("questions")
    .select(
      "id, text, explanation, correct_option_id, options, topic_id, topics!inner ( name ), question_concepts(concept_id, relation, concepts(name))",
    )
    .eq("topics.is_inbox", false)
    .in("id", qids.length ? qids : ["__none__"]);

  const questionTopicIds = (qmeta ?? []).map((q) => q.topic_id as string);
  const topicId =
    (session.topic_id as string | null) ??
    inferSessionTopicId(questionTopicIds);

  const qById = new Map(
    (qmeta ?? []).map((q) => [
      q.id as string,
      {
        text: q.text as string,
        explanation: (q.explanation as string | null) ?? "",
        correct: q.correct_option_id as string,
        options: q.options,
        topic: topicNameFromJoin(
          q.topics as { name: string } | { name: string }[] | null,
        ),
        concepts: (() => {
          const links =
            (
              q as unknown as {
                question_concepts?: Array<{
                  concept_id: string;
                  relation: string;
                  concepts: { name: string } | Array<{ name: string }> | null;
                }>;
              }
            ).question_concepts ?? [];
          const primary = links.filter((link) => link.relation === "primary");
          return (primary.length > 0 ? primary : links).map((link) => ({
          id: link.concept_id,
          label: Array.isArray(link.concepts)
            ? (link.concepts[0]?.name ?? link.concept_id)
            : (link.concepts?.name ?? link.concept_id),
          }));
        })(),
      },
    ]),
  );

  const topicMap = new Map<string, { c: number; t: number }>();
  const conceptMap = new Map<
    string,
    {
      label: string;
      attempts: number;
      correct: number;
      questionIds: string[];
    }
  >();
  const answers: SessionSummaryData["answers"] = [];

  for (const r of rows) {
    const meta = qById.get(r.question_id as string);
    const topicName = meta?.topic ?? "Temat";
    const cur = topicMap.get(topicName) ?? { c: 0, t: 0 };
    cur.t += 1;
    if (r.is_correct) cur.c += 1;
    topicMap.set(topicName, cur);
    const questionId = r.question_id as string;
    for (const concept of meta?.concepts ?? []) {
      const conceptProgress = conceptMap.get(concept.id) ?? {
        label: concept.label,
        attempts: 0,
        correct: 0,
        questionIds: [],
      };
      conceptProgress.attempts += 1;
      if (r.is_correct) conceptProgress.correct += 1;
      if (!conceptProgress.questionIds.includes(questionId)) {
        conceptProgress.questionIds.push(questionId);
      }
      conceptMap.set(concept.id, conceptProgress);
    }

    answers.push({
      questionId,
      questionText: meta?.text ?? "",
      topicName,
      selectedOptionId: r.selected_option_id as string,
      correctOptionId: meta?.correct ?? "",
      selectedOptionText: optionText(
        meta?.options,
        r.selected_option_id as string,
      ),
      correctOptionText: optionText(meta?.options, meta?.correct ?? ""),
      isCorrect: r.is_correct as boolean,
      confidence: r.confidence as Confidence | null,
      timeSpentSeconds: r.time_spent_seconds ?? 0,
      explanation: meta?.explanation || undefined,
    });
  }

  const totalPlan = session.total_questions ?? rows.length;
  const correct = session.correct_answers ?? 0;
  const answered = rows.length;
  const acc = answered > 0 ? correct / answered : 0;
  const dur = session.duration_seconds ?? 0;
  const avg = answered > 0 ? Math.round(dur / answered) : 0;

  const newQuestionsCount = rows.filter(
    (r) => r.is_first_exposure !== false,
  ).length;
  const reviewCount = Math.max(0, answered - newQuestionsCount);

  const topicBreakdown = [...topicMap.entries()]
    .map(([topicName, v]) => ({
      topicName,
      correct: v.c,
      total: v.t,
      accuracy: v.t > 0 ? v.c / v.t : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
  const strengthenedConcepts = [...conceptMap.entries()]
    .map(([conceptId, value]) => ({ conceptId, ...value }))
    .sort(
      (a, b) =>
        b.attempts - a.attempts ||
        b.correct - a.correct ||
        a.label.localeCompare(b.label, "pl"),
    );

  const dbMode = session.mode as string;
  const mappedMode: SessionMode =
    dbMode === "nauka"
      ? "inteligentna"
      : dbMode === "egzamin"
        ? "przeglad"
        : (dbMode as SessionMode);

  const { sessionInsights, examReadiness } = parseStoredSessionInsights(
    session.session_insights,
  );
  const dailyPlan = parseDailyPlanProgress(
    session.plan_snapshot,
    answered,
    dur,
  );

  return {
    sessionId,
    subjectName: subject.name,
    subjectShortName: subject.short_name,
    mode: mappedMode,
    totalQuestions: totalPlan,
    correctAnswers: correct,
    accuracy: acc,
    durationSeconds: dur,
    avgTimePerQuestion: avg,
    xpEarned: session.xp_earned ?? 0,
    longestStreak: maxConsecutiveCorrect(
      rows.map((r) => ({ is_correct: r.is_correct as boolean })),
    ),
    previousAccuracy: prev?.accuracy != null ? Number(prev.accuracy) : null,
    previousTotalQuestions:
      prev == null
        ? null
        : prev.total_questions != null
          ? Number(prev.total_questions)
          : null,
    answers,
    topicBreakdown,
    newXpTotal: profile?.xp ?? 0,
    newStreak: profile?.current_streak ?? 0,
    previousStreakDays: null,
    newQuestionsCount,
    reviewCount,
    achievementUnlocked: null,
    subjectId: subject.id,
    topicId,
    sessionInsights: sessionInsights ?? undefined,
    examReadiness: examReadiness ?? undefined,
    examReadinessBefore: examReadiness
      ? undefined
      : typeof profile?.exam_readiness_score === "number"
        ? profile.exam_readiness_score
        : profile
          ? null
          : undefined,
    dailyPlan,
    strengthenedConcepts,
  };
}
