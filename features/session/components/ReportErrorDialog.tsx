"use client";

import { useCallback, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { reportError } from "@/features/session/api/reportError";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "wrong_answer" as const, label: "Błędna poprawna odpowiedź" },
  { value: "question_text" as const, label: "Błąd w treści pytania" },
  { value: "explanation" as const, label: "Błąd w wyjaśnieniu" },
  { value: "outdated" as const, label: "Nieaktualne informacje" },
  { value: "other" as const, label: "Inne" },
];

type Category = (typeof CATEGORIES)[number]["value"];

type ReportErrorDialogProps = {
  questionId: string;
  questionText: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportErrorDialog({
  questionId,
  questionText,
  open,
  onOpenChange,
}: ReportErrorDialogProps) {
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
      setResult("Zgłoszenie zostało wysłane. Dziękujemy!");
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
        setDescription("");
      }, 1500);
    } else {
      setResult(res.message);
    }
  }, [questionId, category, description, submitting, onOpenChange]);

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
              Zgłoś błąd w pytaniu
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
              Kategoria błędu
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="font-body text-body-xs uppercase tracking-widest text-muted">
              Opisz problem
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz co jest nie tak (min. 10 znaków)..."
              rows={3}
              className="mt-1 w-full resize-none rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
            />
          </div>

          {result && (
            <p className="mt-3 font-body text-body-sm text-brand-gold">{result}</p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="rounded-btn border border-border px-4 py-2 font-body text-body-sm text-secondary transition-colors hover:text-primary">
              Anuluj
            </Dialog.Close>
            <button
              type="button"
              disabled={description.trim().length < 10 || submitting}
              onClick={() => void handleSubmit()}
              className="rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
