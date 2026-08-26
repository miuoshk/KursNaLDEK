"use client";

import type { AdminQuestionOption } from "@/features/admin/server/loadAdminQuestionDetail";
import type { StructuredExplanation } from "@/features/session/lib/structuredExplanation";

type Props = {
  value: StructuredExplanation | null;
  options: AdminQuestionOption[];
  correctOptionId: string;
  onChange: (value: StructuredExplanation | null) => void;
};

const inputClass =
  "w-full rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none";

export function AdminStructuredExplanationFields({
  value,
  options,
  correctOptionId,
  onChange,
}: Props) {
  const current: StructuredExplanation = value ?? {
    takeaway: "",
    correctReason: "",
    distractors: {},
  };

  function update(next: StructuredExplanation) {
    const hasContent =
      next.takeaway.trim() ||
      next.correctReason.trim() ||
      Object.values(next.distractors).some((reason) => reason.trim());
    onChange(hasContent ? next : null);
  }

  return (
    <section className="space-y-3 rounded-card border border-border bg-background/40 p-4">
      <div>
        <h3 className="font-body text-body-xs uppercase tracking-widest text-muted">
          Ustrukturyzowany feedback
        </h3>
        <p className="mt-1 font-body text-body-xs text-secondary">
          Pola są opcjonalne. Zwykłe wyjaśnienie pozostaje fallbackiem.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="font-body text-body-xs text-muted">
          Reguła „Zapamiętaj”
        </span>
        <textarea
          rows={2}
          value={current.takeaway}
          onChange={(event) =>
            update({ ...current, takeaway: event.target.value })
          }
          placeholder="Jedno zdanie, które warto odtworzyć na egzaminie."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-body text-body-xs text-muted">
          Dlaczego poprawna odpowiedź jest poprawna
        </span>
        <textarea
          rows={3}
          value={current.correctReason}
          onChange={(event) =>
            update({ ...current, correctReason: event.target.value })
          }
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        <p className="font-body text-body-xs text-muted">
          Dlaczego dystraktory są błędne
        </p>
        {options
          .filter((option) => option.id !== correctOptionId)
          .map((option) => (
            <label key={option.id} className="flex flex-col gap-1">
              <span className="font-body text-body-xs text-secondary">
                {option.id.toUpperCase()}. {option.text.slice(0, 100)}
              </span>
              <textarea
                rows={2}
                value={current.distractors[option.id] ?? ""}
                onChange={(event) =>
                  update({
                    ...current,
                    distractors: {
                      ...current.distractors,
                      [option.id]: event.target.value,
                    },
                  })
                }
                className={inputClass}
              />
            </label>
          ))}
      </div>
    </section>
  );
}
