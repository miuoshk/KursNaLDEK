"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { resolveReport } from "@/features/admin/server/adminActions";
import type {
  AdminReport,
  AdminReportFacets,
  AdminReportSortBy,
  SortDirection,
} from "@/features/admin/server/loadAdminReports";
import { AdminResolveDialog } from "@/features/admin/components/AdminResolveDialog";
import { AdminSortableHeader } from "@/features/admin/components/AdminSortableHeader";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "Wszystkie" },
  { value: "pending", label: "Oczekujące" },
  { value: "reviewed", label: "Przeglądnięte" },
  { value: "resolved", label: "Rozwiązane" },
  { value: "rejected", label: "Odrzucone" },
];

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return { label: "Oczekujące", cls: "bg-warning/10 text-warning" };
    case "reviewed":
      return { label: "Przeglądnięte", cls: "bg-brand-gold/10 text-brand-gold" };
    case "resolved":
      return { label: "Rozwiązane", cls: "bg-success/10 text-success" };
    case "rejected":
      return { label: "Odrzucone", cls: "bg-error/10 text-error" };
    default:
      return { label: status, cls: "bg-white/10 text-secondary" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function trackLabel(track: string | null) {
  if (track === "lekarski") return "Lekarski";
  if (track === "stomatologia") return "Stomatologia";
  return track ?? "—";
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
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [resolving, setResolving] = useState<AdminReport | null>(null);

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

  return (
    <div className="mt-6">
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

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
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
                <td colSpan={8} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                  Brak zgłoszeń
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const badge = statusBadge(r.status);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="max-w-[250px] truncate px-3 py-3 font-body text-body-sm text-primary">
                      {r.questionTextShort}
                    </td>
                    <td className="px-3 py-3 font-body text-body-sm text-secondary">
                      {r.subjectName ?? "—"}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {r.year != null ? `Rok ${r.year}` : "—"} · {trackLabel(r.track)}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {r.category}
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-pill px-2 py-0.5 font-body text-body-xs", badge.cls)}>
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
                          onClick={() => setResolving(r)}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {resolving && (
        <AdminResolveDialog
          report={resolving}
          open={!!resolving}
          onOpenChange={(open) => !open && setResolving(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}
