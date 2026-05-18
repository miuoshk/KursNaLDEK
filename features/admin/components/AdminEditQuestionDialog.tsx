"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { fetchQuestionForAdmin } from "@/features/admin/server/adminActions";
import type {
  AdminQuestionDetail,
  QuestionEditLogEntry,
} from "@/features/admin/server/loadAdminQuestionDetail";
import { AdminQuestionEditor } from "@/features/admin/components/AdminQuestionEditor";
import { cn } from "@/lib/utils";

type AdminEditQuestionDialogProps = {
  questionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; question: AdminQuestionDetail; history: QuestionEditLogEntry[] }
  | { status: "error"; message: string };

export function AdminEditQuestionDialog({
  questionId,
  open,
  onOpenChange,
  onSaved,
}: AdminEditQuestionDialogProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open || !questionId) {
      setLoadState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setLoadState({ status: "loading" });

    fetchQuestionForAdmin(questionId)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setLoadState({ status: "error", message: res.message });
          return;
        }
        setLoadState({
          status: "ready",
          question: res.question,
          history: res.history,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[AdminEditQuestionDialog]", err);
        setLoadState({
          status: "error",
          message: "Nie udało się pobrać pytania.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [open, questionId, reloadKey]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "max-h-[92vh] overflow-hidden rounded-card border border-border bg-card shadow-xl",
          )}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
            <div>
              <Dialog.Title className="font-heading text-heading-sm text-primary">
                Edycja pytania
              </Dialog.Title>
              <p className="font-body text-body-xs text-muted">
                Zmiany są logowane w historii (kto, kiedy, jakie pola).
              </p>
            </div>
            <Dialog.Close className="rounded-btn p-1 text-secondary transition-colors hover:text-white">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 [overflow-anchor:none]">
            {loadState.status === "loading" && (
              <div className="flex items-center gap-2 py-10 font-body text-body-sm text-secondary">
                <Loader2 className="size-4 animate-spin text-brand-gold" aria-hidden />
                Wczytuję pytanie…
              </div>
            )}

            {loadState.status === "error" && (
              <div className="rounded-btn border border-error/40 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
                {loadState.message}
              </div>
            )}

            {loadState.status === "ready" && (
              <AdminQuestionEditor
                question={loadState.question}
                history={loadState.history}
                onSaved={() => {
                  setReloadKey((k) => k + 1);
                  onSaved?.();
                }}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
