"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, ArrowRight, Loader2 } from "lucide-react";
import type { SavedQuestionItem } from "@/features/saved/server/loadSavedQuestions";
import { toggleBookmark } from "@/features/session/api/toggleBookmark";
import { resolveCatalogSubjectId } from "@/features/session/lib/resolveCatalogSubjectId";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

function buildCatalogHref(
  item: SavedQuestionItem,
  track: "stomatologia" | "lekarski",
): string | null {
  if (!item.subjectId) return null;
  const subject = resolveCatalogSubjectId(item.subjectId, track);
  const params = new URLSearchParams({
    subject,
    mode: "katalog",
    count: "5000",
    q: item.questionId,
  });
  return `/sesja/new?${params.toString()}`;
}

export function SavedQuestionsList({ items }: { items: SavedQuestionItem[] }) {
  const { currentTrack } = useDashboardUser();
  const [rows, setRows] = useState(items);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleRemove(questionId: string) {
    setBusyId(questionId);
    startTransition(async () => {
      const result = await toggleBookmark(questionId);
      if (result.ok && !result.saved) {
        setRows((prev) => prev.filter((r) => r.questionId !== questionId));
      }
      setBusyId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-gold/10">
          <Bookmark className="size-6 text-brand-gold" aria-hidden />
        </div>
        <h2 className="mt-4 font-heading text-xl font-bold text-primary">
          Brak zapisanych pytań
        </h2>
        <p className="mt-2 font-body text-body-sm text-secondary">
          Podczas sesji lub w katalogu pytań kliknij ikonę zakładki, aby zapisać
          pytanie tutaj.
        </p>
        <Link
          href="/przedmioty"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110"
        >
          Przejdź do przedmiotów
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((item) => {
        const catalogHref = buildCatalogHref(item, currentTrack);
        const isBusy = busyId === item.questionId && pending;
        return (
          <li
            key={item.savedId}
            className={cn(
              "rounded-card border border-border bg-card p-4 transition-colors hover:border-brand-gold/30",
              isBusy && "opacity-60",
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 font-body text-body-xs text-muted">
                {item.subjectShortName ? (
                  <span className="rounded-pill border border-border bg-background/60 px-2 py-0.5 uppercase tracking-wider text-secondary">
                    {item.subjectShortName}
                  </span>
                ) : null}
                {item.topicName ? <span>{item.topicName}</span> : null}
                {item.subjectYear != null ? <span>· Rok {item.subjectYear}</span> : null}
                <span className="ml-auto">Zapisano {formatWhen(item.savedAt)}</span>
              </div>

              <p className="line-clamp-3 font-body text-body-sm text-primary md:text-body-md">
                {item.questionText || "(brak treści pytania)"}
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(item.questionId)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-background/40 px-3 py-1.5 font-body text-body-xs text-secondary transition-colors hover:border-error/30 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Bookmark className="size-3.5" aria-hidden />
                  )}
                  Odepnij
                </button>
                {catalogHref ? (
                  <Link
                    href={catalogHref}
                    className="inline-flex items-center gap-1.5 rounded-btn bg-brand-sage px-3 py-1.5 font-body text-body-xs font-medium text-white transition-colors hover:brightness-110"
                  >
                    Otwórz w katalogu
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
