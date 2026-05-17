"use client";

import { useCallback, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminDeleteDiscussionComment } from "@/features/admin/server/adminDiscussionActions";
import type { AdminDiscussionRow } from "@/features/admin/server/loadAdminDiscussions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AdminDiscussionsTableProps = {
  rows: AdminDiscussionRow[];
  currentSearch?: string;
};

export function AdminDiscussionsTable({
  rows,
  currentSearch,
}: AdminDiscussionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      router.push(params.toString() ? `/admin/dyskusje?${params.toString()}` : "/admin/dyskusje");
    });
  }, [router, search, searchParams]);

  const handleDelete = useCallback(
    async (commentId: string) => {
      const ok = window.confirm("Na pewno usunąć ten komentarz?");
      if (!ok) return;
      await adminDeleteDiscussionComment({ commentId });
      router.refresh();
    },
    [router],
  );

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Szukaj po treści, pytaniu lub autorze…"
          className="flex-1 rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm text-white transition hover:brightness-110 disabled:opacity-40"
        >
          Szukaj
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Data
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Pytanie
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Komentarz
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Autor
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Akcja
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                  Brak komentarzy do wyświetlenia.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-3 py-3 font-body text-body-xs text-secondary">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="max-w-[300px] truncate px-3 py-3 font-body text-body-sm text-primary">
                    {row.questionTextShort}
                  </td>
                  <td className="max-w-[520px] truncate px-3 py-3 font-body text-body-sm text-secondary">
                    {row.content}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.userName}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      className="inline-flex items-center gap-1 font-body text-body-xs text-error transition-colors hover:text-white"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Usuń
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
