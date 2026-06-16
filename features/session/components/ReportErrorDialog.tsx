"use client";

import { useCallback, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { reportError } from "@/features/session/api/reportError";
import { cn } from "@/lib/utils";

const CATEGORY_VALUES = [
  "wrong_answer",
  "question_text",
  "explanation",
  "outdated",
  "other",
] as const;

type Category = (typeof CATEGORY_VALUES)[number];

const CATEGORY_KEYS: Record<Category, string> = {
  wrong_answer: "reportCategoryWrongAnswer",
  question_text: "reportCategoryQuestionText",
  explanation: "reportCategoryExplanation",
  outdated: "reportCategoryOutdated",
  other: "reportCategoryOther",
};

type ReportErrorDialogProps = {
  questionId: string;
  questionText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideExplanationCategory?: boolean;
};

export function ReportErrorDialog({
  questionId,
  questionText,
  open,
  onOpenChange,
  hideExplanationCategory = false,
}: ReportErrorDialogProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const categories = useMemo(
    () =>
      (hideExplanationCategory
        ? CATEGORY_VALUES.filter((c) => c !== "explanation")
        : CATEGORY_VALUES
      ).map((value) => ({
        value,
        label: t(CATEGORY_KEYS[value]),
      })),
    [hideExplanationCategory, t],
  );
  const [category, setCategory] = useState<Category>("wrong_answer");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (description.trim().length < 10 || submitting) return;
    setSubmitting(true);
    const res = await reportError({ questionId, category, description: description.trim() });
    setSubmitting(false);
    if (res.ok) {
      setResult(t("reportErrorSuccess"));
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
        setDescription("");
      }, 1500);
    } else {
      setResult(res.message);
    }
  }, [questionId, category, description, submitting, onOpenChange, t]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-card border border-border bg-card p-6 shadow-xl",
          )}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-heading text-heading-sm text-primary">
              {t("reportErrorTitle")}
            </Dialog.Title>
            <Dialog.Close className="rounded-btn p-1 text-secondary transition-colors hover:text-primary">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>

          <p className="mt-3 line-clamp-2 rounded-btn bg-background p-3 font-body text-body-xs text-secondary">
            {questionText}
          </p>

          <div className="mt-4">
            <label className="font-body text-body-xs uppercase tracking-widest text-muted">
              {t("reportErrorCategory")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="font-body text-body-xs uppercase tracking-widest text-muted">
              {t("reportErrorDescribe")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("reportErrorPlaceholder")}
              rows={3}
              className="mt-1 w-full resize-none rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
            />
          </div>

          {result && (
            <p className="mt-3 font-body text-body-sm text-brand-gold">{result}</p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="rounded-btn border border-border px-4 py-2 font-body text-body-sm text-secondary transition-colors hover:text-primary">
              {tCommon("cancel")}
            </Dialog.Close>
            <button
              type="button"
              disabled={description.trim().length < 10 || submitting}
              onClick={() => void handleSubmit()}
              className="rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? t("reportErrorSending") : t("reportErrorSubmit")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
