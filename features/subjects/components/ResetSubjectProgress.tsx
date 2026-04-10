"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { resetSubjectProgress } from "@/features/subjects/server/resetSubjectProgress";
import { useToast } from "@/features/shared/components/ToastProvider";
import { cn } from "@/lib/utils";

type Props = {
  subjectId: string;
  subjectName: string;
};

export function ResetSubjectProgress({ subjectId, subjectName }: Props) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleReset = useCallback(async () => {
    setResetting(true);
    const res = await resetSubjectProgress({ subjectId });
    setResetting(false);

    if (!res.ok) {
      toast(res.message, "error");
      return;
    }

    setOpen(false);
    toast("Postęp wyzerowany", "success");
    router.refresh();
  }, [subjectId, toast, router]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-body text-body-xs text-red-400/70 transition-colors hover:text-red-400"
        >
          <Trash2 className="size-3.5 shrink-0" aria-hidden />
          Zresetuj postęp
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100%,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-card p-6 shadow-lg",
          )}
        >
          <Dialog.Title className="font-heading text-heading-sm text-primary">
            Zresetuj postęp
          </Dialog.Title>
          <Dialog.Description className="mt-2 font-body text-body-sm text-secondary">
            Czy na pewno chcesz wyzerować cały postęp w{" "}
            <span className="font-semibold text-primary">{subjectName}</span>?
            Ta operacja jest nieodwracalna — usunięte zostaną wszystkie
            odpowiedzi, statystyki i mastery.
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={resetting}
                className="rounded-btn px-4 py-2 font-body text-body-sm text-secondary hover:text-primary"
              >
                Anuluj
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={resetting}
              onClick={handleReset}
              className={cn(
                "rounded-btn bg-red-500/90 px-4 py-2 font-body text-body-sm font-semibold text-white transition-colors hover:bg-red-500",
                resetting && "cursor-not-allowed opacity-60",
              )}
            >
              {resetting ? "Resetowanie…" : "Zresetuj"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
