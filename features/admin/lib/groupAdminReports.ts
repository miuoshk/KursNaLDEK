import type { AdminReport } from "@/features/admin/server/loadAdminReports";

type AdminReportBase = Omit<
  AdminReport,
  "questionReportCount" | "questionPendingCount"
>;

export type AdminQuestionReportGroup = {
  questionId: string;
  questionTextShort: string;
  subjectName: string | null;
  track: string | null;
  year: number | null;
  total: number;
  pending: number;
  reports: AdminReport[];
};

export function attachQuestionReportCounts(reports: AdminReportBase[]): AdminReport[] {
  const counts = new Map<string, { total: number; pending: number }>();
  for (const r of reports) {
    const cur = counts.get(r.questionId) ?? { total: 0, pending: 0 };
    cur.total += 1;
    if (r.status === "pending") cur.pending += 1;
    counts.set(r.questionId, cur);
  }

  return reports.map((r) => {
    const c = counts.get(r.questionId) ?? { total: 1, pending: 0 };
    return {
      ...r,
      questionReportCount: c.total,
      questionPendingCount: c.pending,
    };
  });
}

export function groupReportsByQuestion(
  reports: AdminReport[],
): AdminQuestionReportGroup[] {
  const byQuestion = new Map<string, AdminReport[]>();
  for (const r of reports) {
    const list = byQuestion.get(r.questionId) ?? [];
    list.push(r);
    byQuestion.set(r.questionId, list);
  }

  return [...byQuestion.entries()].map(([questionId, items]) => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = sorted[0];
    return {
      questionId,
      questionTextShort: latest.questionTextShort,
      subjectName: latest.subjectName,
      track: latest.track,
      year: latest.year,
      total: sorted.length,
      pending: sorted.filter((x) => x.status === "pending").length,
      reports: sorted,
    };
  });
}

export function sortQuestionReportGroups(
  groups: AdminQuestionReportGroup[],
  sortBy: "reportCount" | "createdAt",
  sortDir: "asc" | "desc",
): AdminQuestionReportGroup[] {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...groups].sort((a, b) => {
    if (sortBy === "reportCount") {
      return (a.total - b.total) * dir;
    }
    const aTime = new Date(a.reports[0]?.createdAt ?? 0).getTime();
    const bTime = new Date(b.reports[0]?.createdAt ?? 0).getTime();
    return (aTime - bTime) * dir;
  });
}
