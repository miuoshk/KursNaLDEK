"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { AdminReport } from "@/features/admin/server/loadAdminReports";
import { cn } from "@/lib/utils";

type AdminResolveDialogProps = {
  report: AdminReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (status: "resolved" | "rejected" | "reviewed", response: string) => void;
};

export function AdminResolveDialog({
  report,
  open,
  onOpenChange,
  onResolve,
}: AdminResolveDialogProps) {
  const [response, setResponse] = useState(report.adminResponse ?? "");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-6 shadow-xl",
          )}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-heading text-heading-sm text-primary">
              Rozpatrz zgłoszenie
            </Dialog.Title>
            <Dialog.Close className="rounded-btn p-1 text-secondary transition-colors hover:text-white">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-btn bg-brand-bg p-3">
              <p className="font-body text-body-xs text-muted">Pytanie</p>
              <p className="mt-1 font-body text-body-sm text-secondary">
                {report.questionTextShort}
              </p>
            </div>

            <div className="rounded-btn bg-brand-bg p-3">
              <p className="font-body text-body-xs text-muted">
                Kategoria: {report.category}
              </p>
              <p className="mt-1 font-body text-body-sm text-primary">
                {report.description}
              </p>
            </div>

            <div>
              <label className="font-body text-body-xs uppercase tracking-widest text-muted">
                Odpowiedź admina
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
                placeholder="Opcjonalna odpowiedź…"
                className="mt-1 w-full resize-none rounded-btn border border-[color:var(--border-subtle)] bg-brand-bg px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
