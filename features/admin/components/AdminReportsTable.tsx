"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveReport } from "@/features/admin/server/adminActions";
import type { AdminReport } from "@/features/admin/server/loadAdminReports";
import { AdminResolveDialog } from "@/features/admin/components/AdminResolveDialog";
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

type AdminReportsTableProps = {
  reports: AdminReport[];
  currentStatus?: string;
};

export function AdminReportsTable({ reports, currentStatus }: AdminReportsTableProps) {
  const router = useRouter();
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

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/bledy?status=${f.value}` : "/admin/bledy"}
            className={cn(
              "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
              (currentStatus ?? "") === f.value
                ? "bg-brand-gold text-brand-bg font-medium"
                : "bg-brand-card-1 text-secondary hover:text-white",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-[color:var(--border-subtle)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[color:var(--border-subtle)] bg-brand-card-1">
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Data
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Pytanie
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Kategoria
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Status
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
                <td colSpan={6} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                  Brak zgłoszeń
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const badge = statusBadge(r.status);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-[color:var(--border-subtle)] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="max-w-[250px] truncate px-3 py-3 font-body text-body-sm text-primary">
                      {r.questionTextShort}
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
                      <button
                        type="button"
                        onClick={() => setResolving(r)}
                        className="font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                      >
                        Rozpatrz
                      </button>
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
