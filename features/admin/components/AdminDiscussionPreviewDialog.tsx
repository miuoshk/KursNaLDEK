"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Loader2, Pencil, X } from "lucide-react";
import {
  adminPostDiscussionComment,
  fetchAdminDiscussionThread,
} from "@/features/admin/server/adminDiscussionActions";
import type { AdminDiscussionThread } from "@/features/admin/server/loadAdminDiscussions";
import { QuestionTextContent } from "@/features/shared/components/QuestionTextContent";
import { cn } from "@/lib/utils";

type AdminDiscussionPreviewDialogProps = {
  questionId: string | null;
  highlightCommentId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenQuestion?: (questionId: string) => void;
  onCommentPosted?: () => void;
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

function optionLabel(id: string): string {
  return id.toUpperCase();
}

export function AdminDiscussionPreviewDialog({
  questionId,
  highlightCommentId,
  open,
  onOpenChange,
  onOpenQuestion,
  onCommentPosted,
}: AdminDiscussionPreviewDialogProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const highlightRef = useRef<HTMLElement | null>(null);

  const loadThread = useCallback(async (id: string, cancelled: () => boolean) => {
    setLoadState({ status: "loading" });
    const res = await fetchAdminDiscussionThread({ questionId: id });
    if (cancelled()) return;
    if (!res.ok) {
      setLoadState({ status: "error", message: res.message });
      return;
    }
    setLoadState({ status: "ready", thread: res.thread });
  }, []);

  useEffect(() => {
    if (!open || !questionId) {
      setLoadState({ status: "idle" });
      setDraft("");
      setPostError(null);
      return;
    }

    let cancelled = false;
    void loadThread(questionId, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [open, questionId, loadThread, reloadKey]);

  useEffect(() => {
    if (loadState.status !== "ready" || !highlightCommentId) return;
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loadState, highlightCommentId]);

  const handlePost = useCallback(async () => {
    if (!questionId || !draft.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    const res = await adminPostDiscussionComment({
      questionId,
      content: draft.trim(),
    });
    setPosting(false);
    if (!res.ok) {
      setPostError(res.message);
      return;
    }
    setDraft("");
    setReloadKey((k) => k + 1);
    onCommentPosted?.();
  }, [questionId, draft, posting, onCommentPosted]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "max-h-[90vh] overflow-hidden rounded-card border border-border bg-card shadow-xl",
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="font-heading text-heading-sm text-primary">
                Wątek dyskusji
              </Dialog.Title>
              {loadState.status === "ready" && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-body-xs text-muted">
                  <span>{loadState.thread.questionId}</span>
                  {loadState.thread.subjectLabel ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{loadState.thread.subjectLabel}</span>
                    </>
                  ) : null}
                  {loadState.thread.topicName ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{loadState.thread.topicName}</span>
                    </>
                  ) : null}
                </div>
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

            {loadState.status === "ready" && (
              <>
                <section className="rounded-card border border-border bg-background p-4">
                  <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                    Pytanie (widok użytkownika)
                  </p>
                  <QuestionTextContent
                    text={loadState.thread.questionText}
                    className="mt-2 text-body-md"
                  />
                  {loadState.thread.options.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {loadState.thread.options.map((opt) => (
                        <li
                          key={opt.id}
                          className="flex gap-2 font-body text-body-sm text-secondary"
                        >
                          <span className="shrink-0 font-medium text-brand-gold">
                            {optionLabel(opt.id)}.
                          </span>
                          <span>{opt.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="mt-5">
                  <h3 className="font-body text-body-xs uppercase tracking-widest text-muted">
                    Komentarze ({loadState.thread.comments.length})
                  </h3>

                  {loadState.thread.comments.length === 0 ? (
                    <p className="mt-3 font-body text-body-sm text-muted">
                      Brak komentarzy pod tym pytaniem.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-border">
                      {loadState.thread.comments.map((comment) => {
                        const highlighted = comment.id === highlightCommentId;
                        return (
                          <article
                            key={comment.id}
                            ref={highlighted ? highlightRef : undefined}
                            className={cn(
                              "py-3 first:pt-2",
                              highlighted && "rounded-btn bg-brand-sage/10 px-3 -mx-3",
                            )}
                          >
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
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="mt-5 rounded-card border border-border bg-background p-4">
                  <label className="block">
                    <span className="font-body text-body-xs uppercase tracking-widest text-muted">
                      Dodaj komentarz (jako Ty)
                    </span>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      placeholder="Odpowiedz studentowi…"
                      className="mt-2 w-full resize-none rounded-btn border border-border bg-card px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
                    />
                  </label>
                  {postError ? (
                    <p className="mt-2 font-body text-body-xs text-error">{postError}</p>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={!draft.trim() || posting}
                      onClick={() => void handlePost()}
                      className="rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-40"
                    >
                      {posting ? "Wysyłanie…" : "Wyślij komentarz"}
                    </button>
                  </div>
                </section>
              </>
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
                  <Pencil className="size-3.5" aria-hidden />
                  Edytuj pytanie
                </button>
              ) : (
                <a
                  href={`/admin/pytania?q=${encodeURIComponent(questionId)}`}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-body text-body-sm text-brand-gold transition-colors hover:text-white"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Edytuj pytanie
                </a>
              )}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
