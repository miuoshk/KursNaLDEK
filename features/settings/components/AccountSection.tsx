"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Lock, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { deleteAccount } from "@/features/settings/api/deleteAccount";
import { requestPasswordReset } from "@/features/settings/api/requestPasswordReset";
import { useToast } from "@/features/shared/components/ToastProvider";
import { cn } from "@/lib/utils";

type Props = { email: string | null };

export function AccountSection({ email }: Props) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onResetPassword() {
    if (!email) {
      toast(t("account.noEmail"), "error");
      return;
    }
    const res = await requestPasswordReset(email);
    if (res.ok) {
      toast(t("account.passwordResetSent"), "success");
    } else toast(res.message, "error");
  }

  async function onConfirmDelete() {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (!res.ok) {
      toast(res.message, "error");
      setOpen(false);
    }
  }

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">{t("account.title")}</h2>
      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={onResetPassword}
          className="flex items-center gap-2 font-body text-body-sm text-secondary transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
        >
          <Lock className="size-4" aria-hidden />
          {t("account.changePassword")}
        </button>
        <div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 font-body text-body-sm text-error/60 transition hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
          >
            <Trash2 className="size-4" aria-hidden />
            {t("account.deleteAccount")}
          </button>
          <p className="mt-1 font-body text-body-xs text-muted">{t("account.deleteIrreversible")}</p>
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[61] w-[min(100vw-2rem,400px)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-card p-6 shadow-xl",
              "focus:outline-none",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="font-heading text-heading-sm text-primary">
                {t("account.deleteConfirmTitle")}
              </Dialog.Title>
              <Dialog.Close
                className="rounded-btn p-1 text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
                aria-label={tCommon("close")}
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-3 font-body text-body-sm text-secondary">
              {t("account.deleteConfirmDescription")}
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-btn border border-border px-4 py-2 font-body text-body-sm text-primary transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)] active:scale-[0.98]"
                >
                  {tCommon("cancel")}
                </button>
              </Dialog.Close>
              <button
                type="button"
                disabled={deleting}
                onClick={onConfirmDelete}
                className="rounded-btn bg-error px-4 py-2 font-body text-body-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
              >
                {t("account.deleteConfirm")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
