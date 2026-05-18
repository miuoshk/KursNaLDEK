import { createClient } from "@/lib/supabase/server";

export type AdminQuestionEditChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type AdminQuestionEditEntry = {
  id: string;
  createdAt: string;
  editorId: string | null;
  editorName: string;
  editorRole: string;
  reportId: string | null;
  questionId: string;
  questionPreview: string;
  changedFields: string[];
  changes: AdminQuestionEditChange[];
};

export type LoadAdminQuestionEditsResult = {
  entries: AdminQuestionEditEntry[];
  total: number;
};

export type AdminQuestionEditsParams = {
  page: number;
  perPage: number;
  questionId?: string;
  editorId?: string;
  search?: string;
};

export async function loadAdminQuestionEdits(
  params: AdminQuestionEditsParams,
): Promise<LoadAdminQuestionEditsResult> {
  const supabase = await createClient();
  const { page, perPage, questionId, editorId, search } = params;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("question_edits")
    .select(
      "id, created_at, editor_id, editor_role, report_id, changes, question_id, profiles(display_name), questions(text)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (questionId) {
    query = query.eq("question_id", questionId);
  }
  if (editorId) {
    query = query.eq("editor_id", editorId);
  }

  query = query.range(offset, offset + perPage - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("[loadAdminQuestionEdits]", error.message);
    return { entries: [], total: 0 };
  }

  const baseEntries: AdminQuestionEditEntry[] = (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string | null } | null;
    const question = row.questions as unknown as { text: string | null } | null;
    const rawChanges = (row.changes as Record<string, unknown>) ?? {};
    const changes: AdminQuestionEditChange[] = Object.entries(rawChanges).map(
      ([field, entry]) => {
        if (entry && typeof entry === "object") {
          const e = entry as Record<string, unknown>;
          return {
            field,
            before: e.before ?? null,
            after: e.after ?? null,
          };
        }
        return { field, before: null, after: null };
      },
    );
    const text = question?.text ?? "";
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      editorId: (row.editor_id as string | null) ?? null,
      editorName: profile?.display_name ?? "—",
      editorRole: (row.editor_role as string) ?? "—",
      reportId: (row.report_id as string | null) ?? null,
      questionId: row.question_id as string,
      questionPreview: text.length > 110 ? `${text.slice(0, 110)}…` : text,
      changedFields: changes.map((c) => c.field),
      changes,
    };
  });

  const normalizedSearch = search?.trim().toLowerCase();
  if (!normalizedSearch) {
    return { entries: baseEntries, total: count ?? baseEntries.length };
  }

  const filtered = baseEntries.filter((entry) =>
    [
      entry.questionId,
      entry.questionPreview,
      entry.editorName,
      entry.changedFields.join(" "),
    ].some((value) => value.toLowerCase().includes(normalizedSearch)),
  );
  return { entries: filtered, total: filtered.length };
}

export async function loadQuestionEditEditors(): Promise<
  Array<{ id: string; name: string; count: number }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_edits")
    .select("editor_id, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error || !data) return [];

  const counter = new Map<string, { name: string; count: number }>();
  for (const row of data) {
    const id = row.editor_id as string | null;
    if (!id) continue;
    const profile = row.profiles as unknown as { display_name: string | null } | null;
    const name = profile?.display_name ?? "—";
    const existing = counter.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      counter.set(id, { name, count: 1 });
    }
  }

  return Array.from(counter.entries())
    .map(([id, value]) => ({ id, name: value.name, count: value.count }))
    .sort((a, b) => b.count - a.count);
}
