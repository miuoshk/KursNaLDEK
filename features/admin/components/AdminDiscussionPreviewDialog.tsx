"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { fetchAdminDiscussionThread } from "@/features/admin/server/adminDiscussionActions";
import type { AdminDiscussionThread } from "@/features/admin/server/loadAdminDiscussions";
import { cn } from "@/lib/utils";

type AdminDiscussionPreviewDialogProps = {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuestion?: (questionId: string) => void;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; thread: AdminDiscussionThread }
  | { status: "error"; message: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminDiscussionPreviewDialog({
  questionId,
  open,
  onOpenChange,
  onOpenQuestion,
}: AdminDiscussionPreviewDialogProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    if (!open || !questionId) {
      setLoadState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setLoadState({ status: "loading" });

    fetchAdminDiscussionThread({ questionId })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setLoadState({ status: "error", message: res.message });
          return;
        }
        setLoadState({ status: "ready", thread: res.thread });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState({ status: "error", message: "Nie udało się wczytać dyskusji." });
      });

    return () => {
      cancelled = true;
    };
  }, [open, questionId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "max-h-[88vh] overflow-hidden rounded-card border border-border bg-card shadow-xl",
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-heading text-heading-sm text-primary">
                Dyskusja pod pytaniem
              </Dialog.Title>
              {loadState.status === "ready" && (
                <p className="mt-2 font-body text-body-sm text-secondary">
                  {loadState.thread.questionText}
                </p>
              )}
            </div>
            <Dialog.Close className="shrink-0 rounded-btn p-1 text-secondary transition-colors hover:text-white">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loadState.status === "loading" && (
              <div className="flex items-center gap-2 py-8 font-body text-body-sm text-secondary">
                <Loader2 className="size-4 animate-spin text-brand-gold" aria-hidden />
                Wczytuję wątek…
              </div>
            )}

            {loadState.status === "error" && (
              <div className="rounded-btn border border-error/40 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
                {loadState.message}
              </div>
            )}

            {loadState.status === "ready" && loadState.thread.comments.length === 0 && (
              <p className="font-body text-body-sm text-muted">Brak komentarzy pod tym pytaniem.</p>
            )}

            {loadState.status === "ready" && loadState.thread.comments.length > 0 && (
              <div className="divide-y divide-border">
                {loadState.thread.comments.map((comment) => (
                  <article key={comment.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-body text-body-sm font-medium text-primary">
                        {comment.userName}
                      </span>
                      <span className="font-body text-body-xs text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap font-body text-body-sm text-secondary">
                      {comment.content}
                    </p>
                    {comment.upvotes > 0 && (
                      <p className="mt-1 font-body text-body-xs text-muted">
                        {comment.upvotes} głosów
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {questionId && (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
              {onOpenQuestion ? (
                <button
                  type="button"
                  onClick={() => onOpenQuestion(questionId)}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-body text-body-sm text-brand-gold transition-colors hover:text-white"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Edytuj pytanie
                </button>
              ) : (
                <Link
                  href={`/admin/pytania?q=${encodeURIComponent(questionId)}`}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-body text-body-sm text-brand-gold transition-colors hover:text-white"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Edytuj pytanie
                </Link>
              )}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
