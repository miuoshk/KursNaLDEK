import { createAdminClient } from "@/lib/supabase/admin";

export type AdminDiscussionRow = {
  id: string;
  questionId: string;
  questionTextShort: string;
  content: string;
  userName: string;
  createdAt: string;
};

export type AdminDiscussionThreadComment = {
  id: string;
  content: string;
  userName: string;
  createdAt: string;
  upvotes: number;
};

export type AdminDiscussionThread = {
  questionId: string;
  questionText: string;
  comments: AdminDiscussionThreadComment[];
};

export async function loadAdminDiscussions(params: {
  search?: string;
}): Promise<AdminDiscussionRow[]> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("question_discussions")
    .select("id, question_id, content, created_at, user_id, profiles(display_name), questions(text)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[loadAdminDiscussions]", error.message);
    return [];
  }

  const baseRows: AdminDiscussionRow[] = (rows ?? []).map((r) => {
    const profile = r.profiles as unknown as { display_name: string | null } | null;
    const question = r.questions as unknown as { text: string | null } | null;
    const text = question?.text ?? "";

    return {
      id: r.id as string,
      questionId: r.question_id as string,
      questionTextShort: text.length > 90 ? `${text.slice(0, 90)}…` : text,
      content: r.content as string,
      userName: profile?.display_name ?? "Anonimowy",
      createdAt: r.created_at as string,
    };
  });

  const normalizedSearch = params.search?.trim().toLowerCase();
  if (!normalizedSearch) return baseRows;

  return baseRows.filter((row) =>
    [row.content, row.questionTextShort, row.userName, row.questionId].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}

export async function loadAdminDiscussionThread(
  questionId: string,
): Promise<AdminDiscussionThread | null> {
  const supabase = createAdminClient();

  const [{ data: question, error: qErr }, { data: rows, error: dErr }] = await Promise.all([
    supabase.from("questions").select("text").eq("id", questionId).maybeSingle(),
    supabase
      .from("question_discussions")
      .select("id, content, created_at, upvotes, profiles(display_name)")
      .eq("question_id", questionId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
  ]);

  if (qErr || dErr || !question) {
    console.error("[loadAdminDiscussionThread]", qErr?.message ?? dErr?.message);
    return null;
  }

  return {
    questionId,
    questionText: (question.text as string) ?? "",
    comments: (rows ?? []).map((r) => {
      const profile = r.profiles as unknown as { display_name: string | null } | null;
      return {
        id: r.id as string,
        content: r.content as string,
        userName: profile?.display_name ?? "Anonimowy",
        createdAt: r.created_at as string,
        upvotes: (r.upvotes as number) ?? 0,
      };
    }),
  };
}
