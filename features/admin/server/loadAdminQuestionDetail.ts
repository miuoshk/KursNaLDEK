import { createClient } from "@/lib/supabase/server";

export type AdminQuestionOption = {
  id: string;
  text: string;
};

export type AdminQuestionDetail = {
  id: string;
  topicId: string | null;
  questionType: string | null;
  text: string;
  options: AdminQuestionOption[];
  correctOptionId: string;
  explanation: string;
  sourceExam: string | null;
  sourceCode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  themeLabel: string | null;
  subthemeLabel: string | null;
  batchLabel: string | null;
  learningOutcome: string | null;
  disableOptionShuffle: boolean;
};

function normalizeOptions(raw: unknown): AdminQuestionOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : null;
      const text = typeof obj.text === "string" ? obj.text : "";
      if (!id) return null;
      return { id, text } satisfies AdminQuestionOption;
    })
    .filter((entry): entry is AdminQuestionOption => entry !== null);
}

export async function loadAdminQuestionDetail(
  questionId: string,
): Promise<AdminQuestionDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, topic_id, question_type, text, options, correct_option_id, explanation, source_exam, source_code, image_url, is_active, theme_label, subtheme_label, batch_label, learning_outcome, disable_option_shuffle",
    )
    .eq("id", questionId)
    .maybeSingle();

  if (error) {
    console.error("[loadAdminQuestionDetail]", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id as string,
    topicId: (data.topic_id as string | null) ?? null,
    questionType: (data.question_type as string | null) ?? null,
    text: (data.text as string) ?? "",
    options: normalizeOptions(data.options),
    correctOptionId: (data.correct_option_id as string) ?? "",
    explanation: (data.explanation as string) ?? "",
    sourceExam: (data.source_exam as string | null) ?? null,
    sourceCode: (data.source_code as string | null) ?? null,
    imageUrl: (data.image_url as string | null) ?? null,
    isActive: (data.is_active as boolean | null) ?? true,
    themeLabel: (data.theme_label as string | null) ?? null,
    subthemeLabel: (data.subtheme_label as string | null) ?? null,
    batchLabel: (data.batch_label as string | null) ?? null,
    learningOutcome: (data.learning_outcome as string | null) ?? null,
    disableOptionShuffle: (data.disable_option_shuffle as boolean | null) === true,
  };
}

export type QuestionEditLogEntry = {
  id: string;
  createdAt: string;
  editorId: string | null;
  editorName: string;
  editorRole: string;
  reportId: string | null;
  changedFields: string[];
  changes: Record<string, { before: unknown; after: unknown }>;
};

export async function loadQuestionEdits(
  questionId: string,
  limit = 25,
): Promise<QuestionEditLogEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_edits")
    .select(
      "id, created_at, editor_id, editor_role, report_id, changes, profiles(display_name)",
    )
    .eq("question_id", questionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[loadQuestionEdits]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string | null } | null;
    const changesRaw = (row.changes as Record<string, unknown>) ?? {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const [field, entry] of Object.entries(changesRaw)) {
      if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        changes[field] = {
          before: e.before ?? null,
          after: e.after ?? null,
        };
      }
    }
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      editorId: (row.editor_id as string | null) ?? null,
      editorName: profile?.display_name ?? "—",
      editorRole: (row.editor_role as string) ?? "—",
      reportId: (row.report_id as string | null) ?? null,
      changedFields: Object.keys(changes),
      changes,
    };
  });
}
