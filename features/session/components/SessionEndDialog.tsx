"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

type SessionEndDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  onConfirm: () => void;
};

export function SessionEndDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  onConfirm,
}: SessionEndDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-card p-6 shadow-lg",
          )}
        >
          <Dialog.Title className="font-heading text-heading-sm text-primary">
            Zakończyć sesję?
          </Dialog.Title>
          <Dialog.Description className="mt-2 font-body text-body-sm text-secondary">
            Czy na pewno chcesz zakończyć? Odpowiedziałeś na {answeredCount} z{" "}
            {totalQuestions} pytań.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-btn px-4 py-2 font-body text-body-sm text-secondary hover:text-primary"
              >
                Anuluj
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg"
            >
              Zakończ
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
