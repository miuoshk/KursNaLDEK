"use client";

import { reportStatusBadge } from "@/features/admin/lib/adminReportStatus";
import type { AdminReport } from "@/features/admin/server/loadAdminReports";
import { cn } from "@/lib/utils";

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
  return `${date} · ${time}`;
}

type Props = {
  reports: AdminReport[];
  highlightReportId?: string;
  onResolve?: (report: AdminReport) => void;
};

export function AdminReportHistoryPanel({
  reports,
  highlightReportId,
  onResolve,
}: Props) {
  if (reports.length === 0) {
    return (
      <p className="font-body text-body-sm text-muted">Brak zgłoszeń dla tego pytania.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => {
        const badge = reportStatusBadge(r.status);
        const isHighlight = r.id === highlightReportId;
        return (
          <li
            key={r.id}
            className={cn(
              "rounded-card border p-3",
              isHighlight
                ? "border-brand-gold/40 bg-brand-gold/5"
                : "border-border bg-background/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-body text-body-xs text-muted">
                  {formatDate(r.createdAt)} · {r.userName}
                </p>
                <p className="mt-1 font-body text-body-sm font-medium text-primary">
                  {r.category}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 font-body text-body-xs",
                    badge.cls,
                  )}
                >
                  {badge.label}
                </span>
                {onResolve && r.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => onResolve(r)}
                    className="font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                  >
                    Rozpatrz
                  </button>
                )}
              </div>
            </div>

            <p className="mt-2 whitespace-pre-wrap font-body text-body-sm text-secondary">
              {r.description}
            </p>

            {r.adminResponse ? (
              <div className="mt-3 rounded-btn border border-border bg-card/60 px-3 py-2">
                <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                  Odpowiedź admina
                  {r.resolvedAt ? ` · ${formatDate(r.resolvedAt)}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap font-body text-body-sm text-primary">
                  {r.adminResponse}
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
