"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleQuestionActive } from "@/features/admin/server/adminActions";
import type { AdminQuestion } from "@/features/admin/server/loadAdminQuestions";
import { cn } from "@/lib/utils";

type AdminQuestionsTableProps = {
  questions: AdminQuestion[];
  total: number;
  page: number;
  perPage: number;
};

export function AdminQuestionsTable({
  questions,
  total,
  page,
  perPage,
}: AdminQuestionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (search) params.set("search", search);
      else params.delete("search");
      params.set("page", "1");
      router.push(`/admin/pytania?${params.toString()}`);
    });
  }, [search, searchParams, router]);

  const handleToggle = useCallback(
    async (qId: string, isActive: boolean) => {
      await toggleQuestionActive({ questionId: qId, isActive: !isActive });
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
          placeholder="Szukaj po treści pytania…"
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
                ID
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Temat
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Treść
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Aktywne
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Odpowiedzi
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Trafność
              </th>
              <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr
                key={q.id}
                className="border-b border-border transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3 font-mono text-body-xs text-secondary">
                  {q.id.slice(0, 8)}…
                </td>
                <td className="max-w-[140px] truncate px-3 py-3 font-body text-body-sm text-secondary">
                  {q.topicName}
                </td>
                <td className="max-w-[300px] truncate px-3 py-3 font-body text-body-sm text-primary">
                  {q.text}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "rounded-pill px-2 py-0.5 font-body text-body-xs",
                      q.isActive
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error",
                    )}
                  >
                    {q.isActive ? "Tak" : "Nie"}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-body-sm text-secondary">
                  {q.timesAnswered}
                </td>
                <td className="px-3 py-3 font-mono text-body-sm text-secondary">
                  {q.accuracy}%
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => void handleToggle(q.id, q.isActive)}
                    className="font-body text-body-xs text-secondary transition-colors hover:text-brand-gold"
                  >
                    {q.isActive ? "Dezaktywuj" : "Aktywuj"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = i + 1;
            return (
              <Link
                key={p}
                href={`/admin/pytania?page=${p}${search ? `&search=${search}` : ""}`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-btn font-mono text-body-xs transition-colors",
                  p === page
                    ? "bg-brand-gold text-brand-bg"
                    : "bg-card text-secondary hover:text-white",
                )}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
