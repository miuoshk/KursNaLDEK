"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search as SearchIcon,
} from "lucide-react";
import { toggleQuestionActive } from "@/features/admin/server/adminActions";
import type { AdminQuestion } from "@/features/admin/server/loadAdminQuestions";
import { AdminEditQuestionDialog } from "@/features/admin/components/AdminEditQuestionDialog";
import { cn } from "@/lib/utils";

type SearchIn = "text" | "explanation" | "both";
type ActiveFilter = "all" | "active" | "inactive";

type AdminQuestionsTableProps = {
  questions: AdminQuestion[];
  total: number;
  page: number;
  perPage: number;
};

const SEARCH_IN_OPTIONS: ReadonlyArray<{ value: SearchIn; label: string }> = [
  { value: "both", label: "Treść + wyjaśnienie" },
  { value: "text", label: "Tylko treść" },
  { value: "explanation", label: "Tylko wyjaśnienie" },
];

const ACTIVE_OPTIONS: ReadonlyArray<{ value: ActiveFilter; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "active", label: "Aktywne" },
  { value: "inactive", label: "Nieaktywne" },
];

function highlight(text: string, term: string): React.ReactNode {
  const trimmed = term.trim();
  if (!trimmed) return text;
  const safe = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${safe})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark
        key={i}
        className="rounded-[2px] bg-brand-gold/30 px-0.5 text-primary"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AdminQuestionsTable({
  questions,
  total,
  page,
  perPage,
}: AdminQuestionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const currentSearchIn = ((): SearchIn => {
    const v = searchParams.get("searchIn");
    return v === "text" || v === "explanation" ? v : "both";
  })();
  const currentActive = ((): ActiveFilter => {
    const v = searchParams.get("active");
    return v === "active" || v === "inactive" ? v : "all";
  })();

  const [search, setSearch] = useState(currentSearch);
  const [searchIn, setSearchIn] = useState<SearchIn>(currentSearchIn);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(currentActive);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pushQuery = useCallback(
    (next: {
      search?: string;
      searchIn?: SearchIn;
      active?: ActiveFilter;
      page?: number;
    }) => {
      const params = new URLSearchParams(searchParams);
      const trimmed = (next.search ?? search).trim();
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");

      const nextSearchIn = next.searchIn ?? searchIn;
      if (nextSearchIn !== "both") params.set("searchIn", nextSearchIn);
      else params.delete("searchIn");

      const nextActive = next.active ?? activeFilter;
      if (nextActive !== "all") params.set("active", nextActive);
      else params.delete("active");

      params.set("page", String(next.page ?? 1));

      startTransition(() => {
        router.push(`/admin/pytania?${params.toString()}`);
      });
    },
    [router, searchParams, search, searchIn, activeFilter],
  );

  const handleSearch = useCallback(() => {
    pushQuery({ page: 1 });
  }, [pushQuery]);

  const handleToggle = useCallback(
    async (qId: string, isActive: boolean) => {
      await toggleQuestionActive({ questionId: qId, isActive: !isActive });
      router.refresh();
    },
    [router],
  );

  const pagerWindow = useMemo(() => {
    const window = 5;
    const start = Math.max(1, page - Math.floor(window / 2));
    const end = Math.min(totalPages, start + window - 1);
    const realStart = Math.max(1, end - window + 1);
    return Array.from({ length: end - realStart + 1 }, (_, i) => realStart + i);
  }, [page, totalPages]);

  const buildPageHref = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      return `/admin/pytania?${params.toString()}`;
    },
    [searchParams],
  );

  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={'Szukaj słów kluczowych… (np. „diagnoza różnicowa")'}
              className="w-full rounded-btn border border-border bg-background pl-9 pr-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isPending}
            className="rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:bg-brand-sage/90 disabled:opacity-40"
          >
            Szukaj
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-body-xs uppercase tracking-widest text-muted">
            Gdzie szukać:
          </span>
          {SEARCH_IN_OPTIONS.map((opt) => {
            const isActive = searchIn === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSearchIn(opt.value);
                  pushQuery({ searchIn: opt.value, page: 1 });
                }}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                  isActive
                    ? "bg-brand-gold text-brand-bg font-medium"
                    : "bg-background text-secondary hover:text-white",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-body-xs uppercase tracking-widest text-muted">
            Status:
          </span>
          {ACTIVE_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setActiveFilter(opt.value);
                  pushQuery({ active: opt.value, page: 1 });
                }}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                  isActive
                    ? "bg-brand-sage text-white font-medium"
                    : "bg-background text-secondary hover:text-white",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between font-body text-body-xs text-muted">
        <span>
          Pokazuję {showingFrom}–{showingTo} z {total} pytań
        </span>
        {currentSearch && (
          <span>
            Filtr: „{currentSearch}" ({searchIn === "text"
              ? "treść"
              : searchIn === "explanation"
                ? "wyjaśnienie"
                : "treść + wyjaśnienie"})
          </span>
        )}
      </div>

      <div className="mt-2 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
              <Th>ID</Th>
              <Th>Temat</Th>
              <Th className="min-w-[260px]">Treść</Th>
              <Th className="min-w-[200px]">Wyjaśnienie</Th>
              <Th>Aktywne</Th>
              <Th>Odp.</Th>
              <Th>Trafność</Th>
              <Th className="text-right">Akcje</Th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center font-body text-body-sm text-muted"
                >
                  Brak pytań spełniających kryteria.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-3 font-body text-body-xs text-secondary">
                    <span title={q.id}>{q.id}</span>
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-3 font-body text-body-sm text-secondary">
                    {q.topicName}
                  </td>
                  <td className="max-w-[360px] px-3 py-3 font-body text-body-sm text-primary">
                    <div className="line-clamp-2">
                      {highlight(q.text, currentSearch)}
                    </div>
                  </td>
                  <td className="max-w-[280px] px-3 py-3 font-body text-body-xs text-secondary">
                    <div className="line-clamp-2">
                      {highlight(q.explanationSnippet, currentSearch)}
                    </div>
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
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {q.timesAnswered}
                  </td>
                  <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                    {q.accuracy}%
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(q.id)}
                        className="inline-flex items-center gap-1 rounded-btn border border-brand-gold/30 px-2 py-1 font-body text-body-xs text-brand-gold transition-colors hover:bg-brand-gold/10"
                      >
                        <Pencil className="size-3" aria-hidden /> Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggle(q.id, q.isActive)}
                        className="rounded-btn border border-border px-2 py-1 font-body text-body-xs text-secondary transition-colors hover:text-white"
                      >
                        {q.isActive ? "Dezaktywuj" : "Aktywuj"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <Link
            href={buildPageHref(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={cn(
              "flex size-8 items-center justify-center rounded-btn bg-card text-secondary transition-colors hover:text-white",
              page === 1 && "pointer-events-none opacity-40",
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          {pagerWindow[0] && pagerWindow[0] > 1 && (
            <>
              <Link
                href={buildPageHref(1)}
                className="flex size-8 items-center justify-center rounded-btn bg-card font-body text-body-xs text-secondary hover:text-white"
              >
                1
              </Link>
              {pagerWindow[0] > 2 && (
                <span className="px-1 text-body-xs text-muted">…</span>
              )}
            </>
          )}
          {pagerWindow.map((p) => (
            <Link
              key={p}
              href={buildPageHref(p)}
              className={cn(
                "flex size-8 items-center justify-center rounded-btn font-body text-body-xs transition-colors",
                p === page
                  ? "bg-brand-gold text-brand-bg font-medium"
                  : "bg-card text-secondary hover:text-white",
              )}
            >
              {p}
            </Link>
          ))}
          {pagerWindow[pagerWindow.length - 1] !== undefined &&
            pagerWindow[pagerWindow.length - 1]! < totalPages && (
              <>
                {pagerWindow[pagerWindow.length - 1]! < totalPages - 1 && (
                  <span className="px-1 text-body-xs text-muted">…</span>
                )}
                <Link
                  href={buildPageHref(totalPages)}
                  className="flex size-8 items-center justify-center rounded-btn bg-card font-body text-body-xs text-secondary hover:text-white"
                >
                  {totalPages}
                </Link>
              </>
            )}
          <Link
            href={buildPageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={cn(
              "flex size-8 items-center justify-center rounded-btn bg-card text-secondary transition-colors hover:text-white",
              page === totalPages && "pointer-events-none opacity-40",
            )}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      <AdminEditQuestionDialog
        questionId={editingId}
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        onSaved={() => {
          startTransition(() => {
            router.refresh();
          });
        }}
      />
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}
