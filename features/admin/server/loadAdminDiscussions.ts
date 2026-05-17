import { createClient } from "@/lib/supabase/server";

export type AdminDiscussionRow = {
  id: string;
  questionId: string;
  questionTextShort: string;
  content: string;
  userName: string;
  createdAt: string;
};

export async function loadAdminDiscussions(params: {
  search?: string;
}): Promise<AdminDiscussionRow[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("question_discussions")
    .select("id, question_id, content, created_at, user_id, profiles(display_name), questions(text)")
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
    [row.content, row.questionTextShort, row.userName].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}
