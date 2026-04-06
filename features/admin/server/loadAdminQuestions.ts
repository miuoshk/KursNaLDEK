import { createClient } from "@/lib/supabase/server";

export type AdminQuestion = {
  id: string;
  topicName: string;
  text: string;
  difficulty: string;
  isActive: boolean;
  timesAnswered: number;
  accuracy: number;
};

export type LoadAdminQuestionsResult = {
  questions: AdminQuestion[];
  total: number;
};

export async function loadAdminQuestions(params: {
  page: number;
  perPage: number;
  subjectId?: string;
  search?: string;
}): Promise<LoadAdminQuestionsResult> {
  const supabase = await createClient();
  const { page, perPage, subjectId, search } = params;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("questions")
    .select("id, text, difficulty, is_active, topic_id, topics(name, subject_id)", {
      count: "exact",
    })
    .order("id", { ascending: true })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.ilike("text", `%${search}%`);
  }

  const { data: rows, count, error } = await query;

  if (error) {
    console.error("[loadAdminQuestions]", error.message);
    return { questions: [], total: 0 };
  }

  let filtered = rows ?? [];
  if (subjectId) {
    filtered = filtered.filter((r) => {
      const topic = r.topics as unknown as { name: string; subject_id: string } | null;
      return topic?.subject_id === subjectId;
    });
  }

  const qIds = filtered.map((r) => r.id as string);

  const statsMap = new Map<string, { answered: number; correct: number }>();
  if (qIds.length > 0) {
    const { data: statsRows } = await supabase
      .from("user_question_progress")
      .select("question_id, times_answered, times_correct")
      .in("question_id", qIds);

    if (statsRows) {
      for (const s of statsRows) {
        const qid = s.question_id as string;
        const existing = statsMap.get(qid) ?? { answered: 0, correct: 0 };
        existing.answered += (s.times_answered as number) ?? 0;
        existing.correct += (s.times_correct as number) ?? 0;
        statsMap.set(qid, existing);
      }
    }
  }

  const questions: AdminQuestion[] = filtered.map((r) => {
    const topic = r.topics as unknown as { name: string; subject_id: string } | null;
    const stats = statsMap.get(r.id as string);
    const answered = stats?.answered ?? 0;
    const correct = stats?.correct ?? 0;
    return {
      id: r.id as string,
      topicName: topic?.name ?? "—",
      text: r.text as string,
      difficulty: r.difficulty as string,
      isActive: (r.is_active as boolean) ?? true,
      timesAnswered: answered,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    };
  });

  return { questions, total: count ?? 0 };
}
