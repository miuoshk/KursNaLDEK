"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  History,
  Search as SearchIcon,
  ShieldCheck,
} from "lucide-react";
import type { AdminQuestionEditEntry } from "@/features/admin/server/loadAdminQuestionEdits";
import { AdminEditQuestionDialog } from "@/features/admin/components/AdminEditQuestionDialog";
import { cn } from "@/lib/utils";

type EditorOption = { id: string; name: string; count: number };

type AdminQuestionEditsTableProps = {
  entries: AdminQuestionEditEntry[];
  total: number;
  page: number;
  perPage: number;
  editors: EditorOption[];
};

const FIELD_LABEL: Record<string, string> = {
  text: "Treść pytania",
  options: "Opcje odpowiedzi",
  correct_option_id: "Poprawna odpowiedź",
  explanation: "Wyjaśnienie",
  is_active: "Aktywne",
  source_exam: "Termin egzaminu",
  source_code: "Numer pytania",
  image_url: "Obraz",
  topic_id: "Temat",
  theme_label: "Theme label",
  subtheme_label: "Subtheme label",
  batch_label: "Batch label",
  learning_outcome: "Learning outcome",
};

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} dni temu`;
  const months = Math.floor(days / 30);
  return `${months} mies. temu`;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "boolean") return value ? "Tak" : "Nie";
  if (typeof value === "number") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isMultilineValue(value: unknown): boolean {
  if (typeof value === "string") return value.length > 80 || value.includes("\n");
  return typeof value === "object" && value !== null;
}

export function AdminQuestionEditsTable({
  entries,
  total,
  page,
  perPage,
  editors,
}: AdminQuestionEditsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") ?? "";
  const currentEditor = searchParams.get("editor") ?? "";

  const [search, setSearch] = useState(currentSearch);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  const pushQuery = useCallback(
    (next: { q?: string; editor?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams);
      const trimmedQ = (next.q ?? search).trim();
      if (trimmedQ) params.set("q", trimmedQ);
      else params.delete("q");

      const editor = next.editor ?? currentEditor;
      if (editor) params.set("editor", editor);
      else params.delete("editor");

      params.set("page", String(next.page ?? 1));

      startTransition(() => {
        router.push(`/admin/historia-pytan?${params.toString()}`);
      });
    },
    [router, searchParams, search, currentEditor],
  );

  const handleSearch = useCallback(() => {
    pushQuery({ page: 1 });
  }, [pushQuery]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const buildPageHref = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      return `/admin/historia-pytan?${params.toString()}`;
    },
    [searchParams],
  );

  const pagerWindow = useMemo(() => {
    const window = 5;
    const start = Math.max(1, page - Math.floor(window / 2));
    const end = Math.min(totalPages, start + window - 1);
    const realStart = Math.max(1, end - window + 1);
    return Array.from({ length: end - realStart + 1 }, (_, i) => realStart + i);
  }, [page, totalPages]);

  return (
    <div className="mt-6 flex flex-col gap-4">
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
              placeholder={'Szukaj po ID pytania, treści lub edytorze'}
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

        {editors.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-body-xs uppercase tracking-widest text-muted">
              Edytor:
            </span>
            <button
              type="button"
              onClick={() => pushQuery({ editor: "", page: 1 })}
              className={cn(
                "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                currentEditor === ""
                  ? "bg-brand-gold text-brand-bg font-medium"
                  : "bg-background text-secondary hover:text-white",
              )}
            >
              Wszyscy
            </button>
            {editors.map((editor) => {
              const active = currentEditor === editor.id;
              return (
                <button
                  key={editor.id}
                  type="button"
                  onClick={() => pushQuery({ editor: editor.id, page: 1 })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                    active
                      ? "bg-brand-gold text-brand-bg font-medium"
                      : "bg-background text-secondary hover:text-white",
                  )}
                >
                  {editor.name}
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-body text-[10px] tabular-nums",
                      active ? "bg-black/20 text-brand-bg" : "bg-white/5 text-muted",
                    )}
                  >
                    {editor.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between font-body text-body-xs text-muted">
        <span>
          Pokazuję {showingFrom}–{showingTo} z {total} edycji
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {entries.length === 0 ? (
          <li className="rounded-card border border-border bg-card p-6 text-center font-body text-body-sm text-muted">
            Brak edycji w tym filtrze.
          </li>
        ) : (
          entries.map((entry) => {
            const isExpanded = expanded.has(entry.id);
            return (
              <li
                key={entry.id}
                className="rounded-card border border-border bg-card transition-colors"
              >
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-btn bg-brand-gold/15 text-brand-gold">
                      <History className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-body-sm text-primary">
                        <span className="font-medium">{entry.editorName}</span>
                        <span className="text-muted"> zmienił{" "}</span>
                        <span className="font-medium tabular-nums">
                          {entry.changedFields.length}{" "}
                          {entry.changedFields.length === 1
                            ? "pole"
                            : entry.changedFields.length < 5
                              ? "pola"
                              : "pól"}
                        </span>
                        <span className="text-muted"> w pytaniu </span>
                        <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[12px] text-brand-gold">
                          {entry.questionId}
                        </code>
                      </p>
                      <p className="mt-1 line-clamp-1 font-body text-body-xs text-secondary">
                        {entry.questionPreview || "(brak treści)"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-body-xs text-muted">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5",
                            entry.editorRole === "admin"
                              ? "bg-brand-gold/15 text-brand-gold"
                              : "bg-brand-sage/20 text-brand-sage",
                          )}
                        >
                          <ShieldCheck className="size-3" aria-hidden />
                          {entry.editorRole}
                        </span>
                        <span title={formatDateTime(entry.createdAt)}>
                          {formatRelative(entry.createdAt)}
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(entry.createdAt)}</span>
                        {entry.reportId && (
                          <Link
                            href={`/admin/bledy`}
                            className="rounded-pill bg-warning/15 px-2 py-0.5 text-warning hover:underline"
                          >
                            ze zgłoszenia
                          </Link>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.changedFields.map((field) => (
                          <span
                            key={field}
                            className="rounded-pill bg-white/5 px-2 py-0.5 font-body text-[11px] text-secondary"
                          >
                            {fieldLabel(field)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenQuestionId(entry.questionId)}
                      className="inline-flex items-center gap-1 rounded-btn border border-brand-gold/30 px-2 py-1 font-body text-body-xs text-brand-gold transition-colors hover:bg-brand-gold/10"
                      title="Otwórz pytanie w edytorze"
                    >
                      <Eye className="size-3" aria-hidden /> Pytanie
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(entry.id)}
                      className="inline-flex items-center gap-1 rounded-btn border border-border px-2 py-1 font-body text-body-xs text-secondary transition-colors hover:text-white"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3" aria-hidden /> Zwiń
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" aria-hidden /> Diff
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-background/40 px-4 py-3">
                    <ul className="flex flex-col gap-3">
                      {entry.changes.map((change) => (
                        <li key={change.field}>
                          <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                            {fieldLabel(change.field)}
                          </p>
                          <DiffPair before={change.before} after={change.after} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1">
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
        questionId={openQuestionId}
        open={openQuestionId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenQuestionId(null);
        }}
        onSaved={() => {
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}

function DiffPair({ before, after }: { before: unknown; after: unknown }) {
  const multiline = isMultilineValue(before) || isMultilineValue(after);
  return (
    <div
      className={cn(
        "mt-1 grid gap-2",
        multiline ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      <div className="rounded-btn border border-error/30 bg-error/[0.06] p-2">
        <p className="font-body text-[10px] uppercase tracking-widest text-error/80">
          Przed
        </p>
        <pre
          className={cn(
            "mt-1 whitespace-pre-wrap break-words font-body text-body-xs text-secondary",
            multiline ? "max-h-[180px] overflow-auto" : "",
          )}
        >
          {formatValue(before)}
        </pre>
      </div>
      <div className="rounded-btn border border-success/30 bg-success/[0.06] p-2">
        <p className="font-body text-[10px] uppercase tracking-widest text-success/80">
          Po
        </p>
        <pre
          className={cn(
            "mt-1 whitespace-pre-wrap break-words font-body text-body-xs text-primary",
            multiline ? "max-h-[180px] overflow-auto" : "",
          )}
        >
          {formatValue(after)}
        </pre>
      </div>
    </div>
  );
}
