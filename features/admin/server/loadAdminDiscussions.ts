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

export type AdminDiscussionThreadOption = {
  id: string;
  text: string;
};

export type AdminDiscussionThread = {
  questionId: string;
  questionText: string;
  options: AdminDiscussionThreadOption[];
  subjectLabel: string | null;
  topicName: string | null;
  comments: AdminDiscussionThreadComment[];
};

function normalizeOptions(raw: unknown): AdminDiscussionThreadOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : null;
      const text = typeof obj.text === "string" ? obj.text : "";
      if (!id) return null;
      return { id, text };
    })
    .filter((entry): entry is AdminDiscussionThreadOption => entry !== null);
}

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
    supabase
      .from("questions")
      .select("text, options, topics(name, subjects(name, track, year))")
      .eq("id", questionId)
      .maybeSingle(),
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

  const topic = question.topics as unknown as {
    name: string | null;
    subjects: { name: string | null; track: string | null; year: number | null } | null;
  } | null;
  const subject = topic?.subjects;
  const subjectLabel =
    subject?.name && subject.year
      ? `${subject.name} · rok ${subject.year}${subject.track === "lekarski" ? " · lekarski" : subject.track === "stomatologia" ? " · stomatologia" : ""}`
      : subject?.name ?? null;

  return {
    questionId,
    questionText: (question.text as string) ?? "",
    options: normalizeOptions(question.options),
    subjectLabel,
    topicName: topic?.name ?? null,
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
