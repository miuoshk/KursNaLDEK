import { createClient } from "@/lib/supabase/server";
import { attachQuestionReportCounts } from "@/features/admin/lib/groupAdminReports";

export type AdminReport = {
  id: string;
  questionId: string;
  questionTextShort: string;
  category: string;
  description: string;
  status: string;
  userName: string;
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
  subjectId: string | null;
  subjectName: string | null;
  track: string | null;
  year: number | null;
  questionReportCount: number;
  questionPendingCount: number;
};

export type AdminReportSortBy =
  | "createdAt"
  | "status"
  | "category"
  | "subject"
  | "reportCount";
export type SortDirection = "asc" | "desc";

export type AdminReportsParams = {
  status?: string;
  track?: string;
  year?: number;
  subjectId?: string;
  sortBy?: AdminReportSortBy;
  sortDir?: SortDirection;
};

export type AdminReportFacets = {
  tracks: string[];
  years: number[];
  subjects: { id: string; name: string; track: string; year: number }[];
};

export async function loadAdminReportFacets(): Promise<AdminReportFacets> {
  const supabase = await createClient();

  const { data: subjectsData, error } = await supabase
    .from("subjects")
    .select("id, name, track, year")
    .order("track", { ascending: true })
    .order("year", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[loadAdminReportFacets]", error.message);
    return { tracks: [], years: [], subjects: [] };
  }

  const subjects = (subjectsData ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    track: s.track as string,
    year: Number(s.year),
  }));

  const tracks = Array.from(new Set(subjects.map((s) => s.track))).sort();
  const years = Array.from(new Set(subjects.map((s) => s.year))).sort((a, b) => a - b);

  return { tracks, years, subjects };
}

export async function loadAdminReports(
  params: AdminReportsParams,
): Promise<AdminReport[]> {
  const supabase = await createClient();

  // Resolve scope of question IDs based on track / year / subject filters.
  let questionIdScope: string[] | null = null;

  if (params.track || params.year || params.subjectId) {
    let subjectQuery = supabase.from("subjects").select("id");
    if (params.track) subjectQuery = subjectQuery.eq("track", params.track);
    if (params.year != null) subjectQuery = subjectQuery.eq("year", params.year);
    if (params.subjectId) subjectQuery = subjectQuery.eq("id", params.subjectId);
    const { data: subjectRows, error: subErr } = await subjectQuery;
    if (subErr) {
      console.error("[loadAdminReports.subjects]", subErr.message);
      return [];
    }
    const subjectIds = (subjectRows ?? []).map((r) => r.id as string);
    if (subjectIds.length === 0) return [];

    const { data: topicRows, error: topErr } = await supabase
      .from("topics")
      .select("id")
      .in("subject_id", subjectIds);
    if (topErr) {
      console.error("[loadAdminReports.topics]", topErr.message);
      return [];
    }
    const topicIds = (topicRows ?? []).map((r) => r.id as string);
    if (topicIds.length === 0) return [];

    const { data: qRows, error: qErr } = await supabase
      .from("questions")
      .select("id")
      .in("topic_id", topicIds);
    if (qErr) {
      console.error("[loadAdminReports.questions]", qErr.message);
      return [];
    }
    questionIdScope = (qRows ?? []).map((r) => r.id as string);
    if (questionIdScope.length === 0) return [];
  }

  const sortBy: AdminReportSortBy = params.sortBy ?? "createdAt";
  const sortDir: SortDirection = params.sortDir ?? "desc";
  const ascending = sortDir === "asc";

  const orderColumn =
    sortBy === "createdAt"
      ? "created_at"
      : sortBy === "status"
        ? "status"
        : sortBy === "category"
          ? "category"
          : "created_at";

  let query = supabase
    .from("error_reports")
    .select(
      "*, profiles(display_name), questions(text, topics(subject_id, subjects(id, name, track, year)))",
    )
    .order(orderColumn, { ascending });

  if (sortBy === "createdAt") {
    // No-op; already ordered.
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (questionIdScope) {
    query = query.in("question_id", questionIdScope);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("[loadAdminReports]", error.message);
    return [];
  }

  const mapped = (rows ?? []).map((r) => {
    const profile = r.profiles as { display_name: string | null } | null;
    const question = r.questions as
      | {
          text: string;
          topics:
            | {
                subject_id: string;
                subjects:
                  | { id: string; name: string; track: string; year: number }
                  | { id: string; name: string; track: string; year: number }[]
                  | null;
              }
            | {
                subject_id: string;
                subjects:
                  | { id: string; name: string; track: string; year: number }
                  | { id: string; name: string; track: string; year: number }[]
                  | null;
              }[]
            | null;
        }
      | null;
    const text = question?.text ?? "";
    const topicNode = Array.isArray(question?.topics) ? question?.topics[0] : question?.topics;
    const subjectNode = Array.isArray(topicNode?.subjects)
      ? topicNode?.subjects[0]
      : topicNode?.subjects;

    return {
      id: r.id as string,
      questionId: r.question_id as string,
      questionTextShort: text.length > 80 ? text.slice(0, 80) + "…" : text,
      category: r.category as string,
      description: r.description as string,
      status: r.status as string,
      userName: profile?.display_name ?? "Anonimowy",
      adminResponse: r.admin_response as string | null,
      createdAt: r.created_at as string,
      resolvedAt: r.resolved_at as string | null,
      subjectId: subjectNode?.id ?? topicNode?.subject_id ?? null,
      subjectName: subjectNode?.name ?? null,
      track: subjectNode?.track ?? null,
      year: subjectNode?.year ?? null,
    };
  });

  const withCounts = attachQuestionReportCounts(mapped);

  if (sortBy === "subject") {
    withCounts.sort((a, b) => {
      const an = a.subjectName ?? "";
      const bn = b.subjectName ?? "";
      const cmp = an.localeCompare(bn, "pl");
      return ascending ? cmp : -cmp;
    });
  }

  if (sortBy === "reportCount") {
    withCounts.sort((a, b) => {
      const cmp = a.questionReportCount - b.questionReportCount;
      if (cmp !== 0) return ascending ? cmp : -cmp;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }

  return withCounts;
}
