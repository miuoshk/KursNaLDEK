"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { resolveReport } from "@/features/admin/server/adminActions";
import type {
  AdminReport,
  AdminReportFacets,
  AdminReportSortBy,
  SortDirection,
} from "@/features/admin/server/loadAdminReports";
import { AdminResolveDialog } from "@/features/admin/components/AdminResolveDialog";
import { AdminReportHistoryPanel } from "@/features/admin/components/AdminReportHistoryPanel";
import { AdminSortableHeader } from "@/features/admin/components/AdminSortableHeader";
import { reportStatusBadge } from "@/features/admin/lib/adminReportStatus";
import {
  groupReportsByQuestion,
  sortQuestionReportGroups,
} from "@/features/admin/lib/groupAdminReports";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "Wszystkie" },
  { value: "pending", label: "Oczekujące" },
  { value: "reviewed", label: "Przeglądnięte" },
  { value: "resolved", label: "Rozwiązane" },
  { value: "rejected", label: "Odrzucone" },
];

const VIEW_MODES = [
  { value: "inbox", label: "Skrzynka" },
  { value: "grouped", label: "Grupuj po pytaniu" },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]["value"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

function trackLabel(track: string | null) {
  if (track === "lekarski") return "Lekarski";
  if (track === "stomatologia") return "Stomatologia";
  return track ?? "—";
}

function ReportCountBadge({
  total,
  pending,
}: {
  total: number;
  pending: number;
}) {
  if (total <= 1) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-body text-body-xs font-medium",
        total >= 3
          ? "bg-error/15 text-error"
          : "bg-brand-gold/15 text-brand-gold",
      )}
      title={
        pending > 0
          ? `${total} zgłoszeń, ${pending} oczekujących`
          : `${total} zgłoszeń`
      }
    >
      ×{total}
      {pending > 0 ? ` (${pending} oczek.)` : ""}
    </span>
  );
}

type Props = {
  reports: AdminReport[];
  facets: AdminReportFacets;
  currentStatus?: string;
  currentTrack?: string;
  currentYear?: number;
  currentSubject?: string;
  currentSortBy: AdminReportSortBy;
  currentSortDir: SortDirection;
  currentView?: ViewMode;
};

export function AdminReportsTable({
  reports,
  facets,
  currentStatus,
  currentTrack,
  currentYear,
  currentSubject,
  currentSortBy,
  currentSortDir,
  currentView = "inbox",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [resolving, setResolving] = useState<AdminReport | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    () => new Set(),
  );

  const reportsByQuestion = useMemo(() => {
    const map = new Map<string, AdminReport[]>();
    for (const r of reports) {
      const list = map.get(r.questionId) ?? [];
      list.push(r);
      map.set(r.questionId, list);
    }
    for (const [qid, list] of map) {
      map.set(
        qid,
        [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    }
    return map;
  }, [reports]);

  const groupedRows = useMemo(() => {
    const groups = groupReportsByQuestion(reports);
    const sortField =
      currentSortBy === "reportCount" ? "reportCount" : "createdAt";
    return sortQuestionReportGroups(groups, sortField, currentSortDir);
  }, [reports, currentSortBy, currentSortDir]);

  const toggleExpanded = useCallback((questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const handleResolve = useCallback(
    async (status: "resolved" | "rejected" | "reviewed", response: string) => {
      if (!resolving) return;
      await resolveReport({
        reportId: resolving.id,
        status,
        adminResponse: response || undefined,
      });
      setResolving(null);
      router.refresh();
    },
    [resolving, router],
  );

  const navigateWith = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      mutate(params);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const yearOptions = useMemo(() => {
    const scoped = currentTrack
      ? facets.subjects.filter((s) => s.track === currentTrack)
      : facets.subjects;
    return Array.from(new Set(scoped.map((s) => s.year))).sort((a, b) => a - b);
  }, [facets.subjects, currentTrack]);

  const subjectOptions = useMemo(() => {
    return facets.subjects
      .filter((s) => (currentTrack ? s.track === currentTrack : true))
      .filter((s) => (currentYear != null ? s.year === currentYear : true));
  }, [facets.subjects, currentTrack, currentYear]);

  const resolvingSiblings =
    resolving != null
      ? (reportsByQuestion.get(resolving.questionId) ?? [resolving])
      : [];

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() =>
              navigateWith((p) => {
                if (mode.value === "inbox") p.delete("view");
                else p.set("view", mode.value);
              })
            }
            className={cn(
              "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
              currentView === mode.value
                ? "bg-brand-sage text-white font-medium"
                : "bg-card text-secondary hover:text-white",
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() =>
              navigateWith((p) => {
                if (f.value) p.set("status", f.value);
                else p.delete("status");
              })
            }
            className={cn(
              "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
              (currentStatus ?? "") === f.value
                ? "bg-brand-gold text-brand-bg font-medium"
                : "bg-card text-secondary hover:text-white",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="font-body text-body-xs uppercase tracking-widest text-muted">
            Kierunek
          </label>
          <select
            value={currentTrack ?? ""}
            onChange={(e) =>
              navigateWith((p) => {
                if (e.target.value) p.set("track", e.target.value);
                else p.delete("track");
                p.delete("year");
                p.delete("subject");
              })
            }
            className="mt-1 w-full rounded-btn border border-border bg-card px-3 py-2 font-body text-body-sm text-primary"
          >
            <option value="">Wszystkie</option>
            {facets.tracks.map((t) => (
              <option key={t} value={t}>
                {trackLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-body-xs uppercase tracking-widest text-muted">
            Rok
          </label>
          <select
            value={currentYear != null ? String(currentYear) : ""}
            onChange={(e) =>
              navigateWith((p) => {
                if (e.target.value) p.set("year", e.target.value);
                else p.delete("year");
                p.delete("subject");
              })
            }
            className="mt-1 w-full rounded-btn border border-border bg-card px-3 py-2 font-body text-body-sm text-primary"
          >
            <option value="">Wszystkie</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Rok {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-body text-body-xs uppercase tracking-widest text-muted">
            Przedmiot
          </label>
          <select
            value={currentSubject ?? ""}
            onChange={(e) =>
              navigateWith((p) => {
                if (e.target.value) p.set("subject", e.target.value);
                else p.delete("subject");
              })
            }
            className="mt-1 w-full rounded-btn border border-border bg-card px-3 py-2 font-body text-body-sm text-primary"
          >
            <option value="">Wszystkie</option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentView === "grouped" ? (
        <GroupedReportsTable
          groups={groupedRows}
          expandedQuestions={expandedQuestions}
          onToggleExpand={toggleExpanded}
          onResolve={setResolving}
          currentSortBy={currentSortBy}
          currentSortDir={currentSortDir}
        />
      ) : (
        <InboxReportsTable
          reports={reports}
          reportsByQuestion={reportsByQuestion}
          expandedQuestions={expandedQuestions}
          onToggleExpand={toggleExpanded}
          onResolve={setResolving}
          currentSortBy={currentSortBy}
          currentSortDir={currentSortDir}
        />
      )}

      {resolving && (
        <AdminResolveDialog
          report={resolving}
          questionReports={resolvingSiblings}
          open={!!resolving}
          onOpenChange={(open) => !open && setResolving(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}

function InboxReportsTable({
  reports,
  reportsByQuestion,
  expandedQuestions,
  onToggleExpand,
  onResolve,
  currentSortBy,
  currentSortDir,
}: {
  reports: AdminReport[];
  reportsByQuestion: Map<string, AdminReport[]>;
  expandedQuestions: Set<string>;
  onToggleExpand: (questionId: string) => void;
  onResolve: (report: AdminReport) => void;
  currentSortBy: AdminReportSortBy;
  currentSortDir: SortDirection;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="w-8 px-2 py-3" />
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Data"
                field="createdAt"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Pytanie
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="× pytanie"
                field="reportCount"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Przedmiot"
                field="subject"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Rok / kierunek
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Kategoria"
                field="category"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Status"
                field="status"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Użytkownik
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td
                colSpan={10}
                className="px-3 py-8 text-center font-body text-body-sm text-muted"
              >
                Brak zgłoszeń
              </td>
            </tr>
          ) : (
            reports.map((r) => {
              const badge = reportStatusBadge(r.status);
              const expanded = expandedQuestions.has(r.questionId);
              const siblings = reportsByQuestion.get(r.questionId) ?? [r];
              const canExpand = siblings.length > 1;

              return (
                <Fragment key={r.id}>
                  <tr className="border-b border-border transition-colors hover:bg-white/[0.02]">
                    <td className="px-2 py-3">
                      {canExpand ? (
                        <button
                          type="button"
                          onClick={() => onToggleExpand(r.questionId)}
                          className="rounded-btn p-1 text-muted transition-colors hover:text-primary"
                          aria-expanded={expanded}
                          aria-label={
                            expanded
                              ? "Zwiń historię zgłoszeń"
                              : "Rozwiń historię zgłoszeń"
                          }
                        >
                          {expanded ? (
                            <ChevronDown className="size-4" aria-hidden />
                          ) : (
                            <ChevronRight className="size-4" aria-hidden />
                          )}
                        </button>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {(() => {
                        const { date, time } = formatDate(r.createdAt);
                        return (
                          <>
                            <span className="whitespace-nowrap">{date}</span>
                            <span className="ml-1 whitespace-nowrap text-muted">
                              · {time}
                            </span>
                          </>
                        );
                      })()}
                    </td>
                    <td className="max-w-[250px] truncate px-3 py-3 font-body text-body-sm text-primary">
                      {r.questionTextShort}
                    </td>
                    <td className="px-3 py-3">
                      <ReportCountBadge
                        total={r.questionReportCount}
                        pending={r.questionPendingCount}
                      />
                    </td>
                    <td className="px-3 py-3 font-body text-body-sm text-secondary">
                      {r.subjectName ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {r.year != null ? `Rok ${r.year}` : "—"} ·{" "}
                      {trackLabel(r.track)}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {r.category}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 font-body text-body-xs",
                          badge.cls,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body text-body-sm text-secondary">
                      {r.userName}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => onResolve(r)}
                          className="text-left font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                        >
                          Rozpatrz
                        </button>
                        <Link
                          href={`/admin/pytania?q=${encodeURIComponent(r.questionId)}`}
                          className="font-body text-body-xs text-secondary transition-colors hover:text-white"
                        >
                          Pytanie →
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expanded && canExpand ? (
                    <tr className="border-b border-border bg-background/30">
                      <td colSpan={10} className="px-4 py-4">
                        <p className="mb-3 font-body text-body-xs uppercase tracking-widest text-muted">
                          Historia zgłoszeń tego pytania ({siblings.length})
                        </p>
                        <AdminReportHistoryPanel
                          reports={siblings}
                          highlightReportId={r.id}
                          onResolve={onResolve}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function GroupedReportsTable({
  groups,
  expandedQuestions,
  onToggleExpand,
  onResolve,
  currentSortBy,
  currentSortDir,
}: {
  groups: ReturnType<typeof sortQuestionReportGroups>;
  expandedQuestions: Set<string>;
  onToggleExpand: (questionId: string) => void;
  onResolve: (report: AdminReport) => void;
  currentSortBy: AdminReportSortBy;
  currentSortDir: SortDirection;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="w-8 px-2 py-3" />
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Pytanie
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Zgłoszenia"
                field="reportCount"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Przedmiot
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Rok / kierunek
            </th>
            <th className="px-3 py-3">
              <AdminSortableHeader
                label="Ostatnie"
                field="createdAt"
                currentSortBy={currentSortBy}
                currentSortDir={currentSortDir}
              />
            </th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-8 text-center font-body text-body-sm text-muted"
              >
                Brak zgłoszeń
              </td>
            </tr>
          ) : (
            groups.map((g) => {
              const expanded = expandedQuestions.has(g.questionId);
              const latestPending = g.reports.find((r) => r.status === "pending");
              const latest = g.reports[0];

              return (
                <Fragment key={g.questionId}>
                  <tr className="border-b border-border transition-colors hover:bg-white/[0.02]">
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(g.questionId)}
                        className="rounded-btn p-1 text-muted transition-colors hover:text-primary"
                        aria-expanded={expanded}
                        aria-label={
                          expanded
                            ? "Zwiń historię zgłoszeń"
                            : "Rozwiń historię zgłoszeń"
                        }
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </button>
                    </td>
                    <td className="max-w-[300px] truncate px-3 py-3 font-body text-body-sm text-primary">
                      {g.questionTextShort}
                    </td>
                    <td className="px-3 py-3">
                      <ReportCountBadge total={g.total} pending={g.pending} />
                      {g.total === 1 ? (
                        <span className="font-body text-body-xs text-muted">
                          1 zgłoszenie
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 font-body text-body-sm text-secondary">
                      {g.subjectName ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {g.year != null ? `Rok ${g.year}` : "—"} ·{" "}
                      {trackLabel(g.track)}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {latest
                        ? (() => {
                            const { date, time } = formatDate(latest.createdAt);
                            return (
                              <>
                                <span className="whitespace-nowrap">{date}</span>
                                <span className="ml-1 whitespace-nowrap text-muted">
                                  · {time}
                                </span>
                              </>
                            );
                          })()
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        {latestPending ? (
                          <button
                            type="button"
                            onClick={() => onResolve(latestPending)}
                            className="text-left font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                          >
                            Rozpatrz oczekujące
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onResolve(latest)}
                            className="text-left font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                          >
                            Rozpatrz ostatnie
                          </button>
                        )}
                        <Link
                          href={`/admin/pytania?q=${encodeURIComponent(g.questionId)}`}
                          className="font-body text-body-xs text-secondary transition-colors hover:text-white"
                        >
                          Pytanie →
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="border-b border-border bg-background/30">
                      <td colSpan={7} className="px-4 py-4">
                        <p className="mb-3 font-body text-body-xs uppercase tracking-widest text-muted">
                          Historia zgłoszeń ({g.total})
                        </p>
                        <AdminReportHistoryPanel
                          reports={g.reports}
                          onResolve={onResolve}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
