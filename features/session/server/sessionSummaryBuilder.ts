import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionSummaryData } from "@/features/session/summaryTypes";
import type { Confidence, SessionMode } from "@/features/session/types";

const TRUNC = 80;

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

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
      "id, user_id, subject_id, mode, total_questions, correct_answers, duration_seconds, xp_earned, is_completed",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (se || !session) return null;

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, short_name")
    .eq("id", session.subject_id as string)
    .maybeSingle();

  if (!subject) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, current_streak")
    .eq("id", userId)
    .maybeSingle();

  const { data: prev } = await supabase
    .from("study_sessions")
    .select("accuracy")
    .eq("user_id", userId)
    .eq("subject_id", session.subject_id)
    .eq("is_completed", true)
    .neq("id", sessionId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: ansRows } = await supabase
    .from("session_answers")
    .select(
      "question_id, selected_option_id, is_correct, confidence, time_spent_seconds, question_order, is_first_exposure",
    )
    .eq("session_id", sessionId)
    .order("question_order", { ascending: true });

  const rows = ansRows ?? [];
  const qids = [...new Set(rows.map((r) => r.question_id as string))];

  const { data: qmeta } = await supabase
    .from("questions")
    .select("id, text, correct_option_id, difficulty, options, topics ( name )")
    .in("id", qids.length ? qids : ["__none__"]);

  const qById = new Map(
    (qmeta ?? []).map((q) => [
      q.id as string,
      {
        text: q.text as string,
        correct: q.correct_option_id as string,
        difficulty: q.difficulty as string,
        options: q.options,
        topic: topicNameFromJoin(
          q.topics as { name: string } | { name: string }[] | null,
        ),
      },
    ]),
  );

  const topicMap = new Map<string, { c: number; t: number }>();
  const answers: SessionSummaryData["answers"] = [];

  for (const r of rows) {
    const meta = qById.get(r.question_id as string);
    const topicName = meta?.topic ?? "Temat";
    const cur = topicMap.get(topicName) ?? { c: 0, t: 0 };
    cur.t += 1;
    if (r.is_correct) cur.c += 1;
    topicMap.set(topicName, cur);

    answers.push({
      questionId: r.question_id as string,
      questionText: truncate(meta?.text ?? "", TRUNC),
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
    });
  }

  const total = session.total_questions ?? rows.length;
  const correct = session.correct_answers ?? 0;
  const acc = total > 0 ? correct / total : 0;
  const dur = session.duration_seconds ?? 0;
  const answered = rows.length;
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

  return {
    sessionId,
    subjectName: subject.name,
    subjectShortName: subject.short_name,
    mode: session.mode as SessionMode,
    totalQuestions: total,
    correctAnswers: correct,
    accuracy: acc,
    durationSeconds: dur,
    avgTimePerQuestion: avg,
    xpEarned: session.xp_earned ?? 0,
    longestStreak: maxConsecutiveCorrect(
      rows.map((r) => ({ is_correct: r.is_correct as boolean })),
    ),
    previousAccuracy: prev?.accuracy != null ? Number(prev.accuracy) : null,
    answers,
    topicBreakdown,
    newXpTotal: profile?.xp ?? 0,
    newStreak: profile?.current_streak ?? 0,
    previousStreakDays: null,
    newQuestionsCount,
    reviewCount,
    achievementUnlocked: null,
    subjectId: subject.id,
  };
}
