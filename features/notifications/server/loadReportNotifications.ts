import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseQuestionOptions } from "@/features/notifications/lib/parseQuestionOptions";
import type {
  ReportNotification,
  ReportNotificationQuestionPreview,
} from "@/features/notifications/types";

const RESOLVED_STATUSES = ["resolved", "rejected", "reviewed"] as const;

type ReportRow = {
  id: string;
  question_id: string;
  category: string;
  status: string;
  admin_response: string | null;
  resolved_at: string;
};

type QuestionRow = {
  id: string;
  text: string;
  options: unknown;
  correct_option_id: string;
  explanation: string;
};

function mapQuestionPreview(
  row: QuestionRow,
  changedFields: string[],
): ReportNotificationQuestionPreview {
  return {
    text: row.text,
    options: parseQuestionOptions(row.options),
    correctOptionId: row.correct_option_id,
    explanation: row.explanation,
    changedFields,
  };
}

export async function loadReportNotifications(
  unreadOnly = false,
): Promise<ReportNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("error_reports")
    .select("id, question_id, category, status, admin_response, resolved_at")
    .eq("user_id", user.id)
    .in("status", [...RESOLVED_STATUSES])
    .not("resolved_at", "is", null)
    .order("resolved_at", { ascending: false })
    .limit(20);

  if (unreadOnly) {
    query = query.is("notification_read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[loadReportNotifications]", error.message);
    return [];
  }

  const rows = (data ?? []).filter(
    (row): row is ReportRow & { resolved_at: string } =>
      typeof row.resolved_at === "string",
  );

  if (rows.length === 0) return [];

  const reportIds = rows.map((r) => r.id);
  const questionIds = [...new Set(rows.map((r) => r.question_id).filter(Boolean))];

  const [questionsRes, editsRes] = await Promise.all([
    questionIds.length > 0
      ? supabase
          .from("questions")
          .select("id, text, options, correct_option_id, explanation")
          .in("id", questionIds)
      : Promise.resolve({ data: [] as QuestionRow[], error: null }),
    (async () => {
      const admin = createAdminClient();
      return admin
        .from("question_edits")
        .select("report_id, changes, created_at")
        .in("report_id", reportIds)
        .order("created_at", { ascending: false });
    })(),
  ]);

  if (questionsRes.error) {
    console.error("[loadReportNotifications] questions", questionsRes.error.message);
  }
  if (editsRes.error) {
    console.error("[loadReportNotifications] edits", editsRes.error.message);
  }

  const questionsById = new Map(
    ((questionsRes.data ?? []) as QuestionRow[]).map((q) => [q.id, q]),
  );

  const changedFieldsByReport = new Map<string, string[]>();
  for (const edit of editsRes.data ?? []) {
    const rid = edit.report_id as string | null;
    if (!rid || changedFieldsByReport.has(rid)) continue;
    const raw = (edit.changes as Record<string, unknown>) ?? {};
    changedFieldsByReport.set(rid, Object.keys(raw));
  }

  return rows.map((row) => {
    const q = questionsById.get(row.question_id);
    return {
      id: row.id,
      questionId: row.question_id,
      category: row.category,
      status: row.status as ReportNotification["status"],
      adminResponse: row.admin_response,
      resolvedAt: row.resolved_at,
      question: q
        ? mapQuestionPreview(q, changedFieldsByReport.get(row.id) ?? [])
        : null,
    };
  });
}
