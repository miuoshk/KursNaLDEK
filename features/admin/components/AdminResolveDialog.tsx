"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Loader2, X } from "lucide-react";
import { fetchQuestionForAdmin } from "@/features/admin/server/adminActions";
import type { AdminReport } from "@/features/admin/server/loadAdminReports";
import type {
  AdminQuestionDetail,
  QuestionEditLogEntry,
} from "@/features/admin/server/loadAdminQuestionDetail";
import { AdminQuestionEditor } from "@/features/admin/components/AdminQuestionEditor";
import { cn } from "@/lib/utils";

type AdminResolveDialogProps = {
  report: AdminReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (
    status: "resolved" | "rejected" | "reviewed",
    response: string,
  ) => void;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; question: AdminQuestionDetail; history: QuestionEditLogEntry[] }
  | { status: "error"; message: string };

export function AdminResolveDialog({
  report,
  open,
  onOpenChange,
  onResolve,
}: AdminResolveDialogProps) {
  const [response, setResponse] = useState(report.adminResponse ?? "");
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setLoadState({ status: "idle" });
      return;
    }
    if (!report.questionId) {
      setLoadState({
        status: "error",
        message: "Zgłoszenie nie jest powiązane z pytaniem.",
      });
      return;
    }

    let cancelled = false;
    setLoadState({ status: "loading" });

    fetchQuestionForAdmin(report.questionId)
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
        console.error("[AdminResolveDialog] fetchQuestionForAdmin", err);
        setLoadState({
          status: "error",
          message: "Nie udało się pobrać pytania.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [open, report.questionId, reloadKey]);

  const handleQuestionSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

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
                Rozpatrz zgłoszenie
              </Dialog.Title>
              <p className="font-body text-body-xs text-muted">
                Edycja pytania i rozstrzygnięcie zgłoszenia w jednym miejscu.
              </p>
            </div>
            <Dialog.Close className="rounded-btn p-1 text-secondary transition-colors hover:text-white">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 [overflow-anchor:none]">
            <section className="rounded-card border border-border bg-background/60 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <InfoBlock label="Kategoria" value={report.category} />
                <InfoBlock label="Zgłosił" value={report.userName} />
                <InfoBlock
                  label="Status"
                  value={statusLabel(report.status)}
                />
              </div>
              <div className="mt-3">
                <p className="font-body text-body-xs uppercase tracking-widest text-muted">
                  Opis od użytkownika
                </p>
                <p className="mt-1 whitespace-pre-wrap font-body text-body-sm text-primary">
                  {report.description}
                </p>
              </div>
            </section>

            <section className="mt-4 rounded-card border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-heading-sm text-primary">
                  Pytanie
                </h3>
                {report.questionId && (
                  <a
                    href={`/admin/pytania?search=${encodeURIComponent(report.questionId)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-body text-body-xs text-brand-gold transition-colors hover:text-white"
                  >
                    Otwórz w liście pytań
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                )}
              </div>

              {loadState.status === "loading" && (
                <div className="flex items-center gap-2 py-6 font-body text-body-sm text-secondary">
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
                  reportId={report.id}
                  onSaved={handleQuestionSaved}
                />
              )}
            </section>

            <section className="mt-4 rounded-card border border-border bg-card p-4">
              <h3 className="font-heading text-heading-sm text-primary">
                Rozstrzygnięcie zgłoszenia
              </h3>
              <label className="mt-3 block">
                <span className="font-body text-body-xs uppercase tracking-widest text-muted">
                  Odpowiedź dla zgłaszającego (opcjonalna)
                </span>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={3}
                  placeholder={"np. „Poprawiono treść opcji B. Dziękujemy!"}
                  className="mt-1 w-full resize-none rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
                />
              </label>
            </section>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-3">
            <button
              type="button"
              onClick={() => onResolve("rejected", response)}
              className="rounded-btn border border-error/30 px-4 py-2 font-body text-body-sm text-error transition-colors hover:bg-error/10"
            >
              Odrzuć
            </button>
            <button
              type="button"
              onClick={() => onResolve("reviewed", response)}
              className="rounded-btn border border-brand-gold/30 px-4 py-2 font-body text-body-sm text-brand-gold transition-colors hover:bg-brand-gold/10"
            >
              Przeglądnięte
            </button>
            <button
              type="button"
              onClick={() => onResolve("resolved", response)}
              className="rounded-btn bg-success/20 px-4 py-2 font-body text-body-sm font-medium text-success transition-colors hover:bg-success/30"
            >
              Rozwiązane
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Oczekuje";
    case "reviewed":
      return "Przeglądnięte";
    case "resolved":
      return "Rozwiązane";
    case "rejected":
      return "Odrzucone";
    default:
      return status;
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-body text-body-sm text-primary">{value}</p>
    </div>
  );
}
