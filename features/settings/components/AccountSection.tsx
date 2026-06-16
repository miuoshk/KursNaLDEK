"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Lock, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteAccount } from "@/features/settings/api/deleteAccount";
import { requestPasswordReset } from "@/features/settings/api/requestPasswordReset";
import { updateLocale } from "@/features/settings/api/updateLocale";
import { useToast } from "@/features/shared/components/ToastProvider";
import {
  localeFlags,
  localeLabels,
  localePickerRows,
  type AppLocale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = { email: string | null };

export function AccountSection({ email }: Props) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const { toast } = useToast();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localePending, startLocaleTransition] = useTransition();

  function onSelectLocale(nextLocale: AppLocale) {
    if (nextLocale === locale || localePending) return;
    const formData = new FormData();
    formData.set("locale", nextLocale);
    startLocaleTransition(async () => {
      await updateLocale(formData);
      router.refresh();
    });
  }

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

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-0">
        <div className="flex flex-col">
          <h3 className="font-body text-body-sm font-medium text-primary">
            {t("language.chooseTitle")}
          </h3>
          <div className="mt-3 space-y-2">
            {localePickerRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-2 gap-2">
                {row.map((code) => {
                  const selected = code === locale;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={localePending}
                      onClick={() => onSelectLocale(code)}
                      aria-pressed={selected}
                      aria-label={localeLabels[code]}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-btn border px-3 py-2.5 transition",
                        selected
                          ? "border-brand-gold/60 text-brand-gold"
                          : "border-white/10 text-secondary hover:border-white/25 hover:text-primary",
                        localePending && "opacity-60",
                      )}
                    >
                      <span className="text-lg leading-none" aria-hidden>
                        {localeFlags[code]}
                      </span>
                      <span className="font-body text-body-xs">{localeLabels[code]}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 md:pt-7">
          <button
            type="button"
            onClick={onResetPassword}
            className="flex items-center gap-2 font-body text-body-sm text-secondary transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
          >
            <Lock className="size-4 shrink-0" aria-hidden />
            {t("account.changePassword")}
          </button>
          <div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 font-body text-body-sm text-error/60 transition hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
            >
              <Trash2 className="size-4 shrink-0" aria-hidden />
              {t("account.deleteAccount")}
            </button>
            <p className="mt-1 font-body text-body-xs text-muted">
              {t("account.deleteIrreversible")}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 font-body text-body-xs text-muted">{t("language.contentNotice")}</p>

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
