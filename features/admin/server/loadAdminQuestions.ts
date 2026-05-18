import { createClient } from "@/lib/supabase/server";

export type AdminQuestion = {
  id: string;
  topicName: string;
  topicId: string | null;
  text: string;
  explanationSnippet: string;
  isActive: boolean;
  timesAnswered: number;
  accuracy: number;
};

export type LoadAdminQuestionsResult = {
  questions: AdminQuestion[];
  total: number;
};

export type AdminQuestionActiveFilter = "all" | "active" | "inactive";

function escapeOrPattern(value: string): string {
  // Supabase .or() używa przecinka jako separatora — usuwamy go z zapytania.
  return value.replace(/,/g, " ").replace(/%/g, "");
}

export async function loadAdminQuestions(params: {
  page: number;
  perPage: number;
  subjectId?: string;
  search?: string;
  searchIn?: "text" | "explanation" | "both";
  active?: AdminQuestionActiveFilter;
}): Promise<LoadAdminQuestionsResult> {
  const supabase = await createClient();
  const {
    page,
    perPage,
    subjectId,
    search,
    searchIn = "both",
    active = "all",
  } = params;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("questions")
    .select("id, text, explanation, is_active, topic_id, topics(name, subject_id)", {
      count: "exact",
    });

  if (subjectId) {
    const { data: topicRows } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId);
    const topicIds = (topicRows ?? []).map((r) => r.id as string);
    if (topicIds.length === 0) {
      return { questions: [], total: 0 };
    }
    query = query.in("topic_id", topicIds);
  }

  if (active === "active") {
    query = query.eq("is_active", true);
  } else if (active === "inactive") {
    query = query.eq("is_active", false);
  }

  const trimmedSearch = search?.trim() ?? "";
  if (trimmedSearch) {
    const safe = escapeOrPattern(trimmedSearch);
    const pattern = `%${safe}%`;
    if (searchIn === "text") {
      query = query.ilike("text", pattern);
    } else if (searchIn === "explanation") {
      query = query.ilike("explanation", pattern);
    } else {
      query = query.or(`text.ilike.${pattern},explanation.ilike.${pattern}`);
    }
  }

  query = query.order("id", { ascending: true }).range(offset, offset + perPage - 1);

  const { data: rows, count, error } = await query;

  if (error) {
    console.error("[loadAdminQuestions]", error.message);
    return { questions: [], total: 0 };
  }

  const filtered = rows ?? [];
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
    const explanation = (r.explanation as string | null) ?? "";
    const snippet =
      explanation.length > 140 ? `${explanation.slice(0, 140)}…` : explanation;
    return {
      id: r.id as string,
      topicName: topic?.name ?? "—",
      topicId: (r.topic_id as string | null) ?? null,
      text: r.text as string,
      explanationSnippet: snippet,
      isActive: (r.is_active as boolean) ?? true,
      timesAnswered: answered,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    };
  });

  return { questions, total: count ?? 0 };
}
