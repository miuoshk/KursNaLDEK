"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { updateExamDate } from "@/features/settings/api/updateExamDate";
import { useToast } from "@/features/shared/components/ToastProvider";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full max-w-xs rounded-btn border border-[rgba(255,255,255,0.1)] bg-brand-bg px-4 py-3 font-body text-white transition-colors focus:border-brand-gold focus:outline-none [color-scheme:dark]";

type Props = {
  examDate: string | null;
};

function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Różnica w dniach kalendarzowych (UTC); dodatnia = przyszłość względem „dzisiaj” UTC. */
function daysUntilFuture(iso: string | null): number | null {
  if (!iso) return null;
  const exam = new Date(iso);
  const examUtc = Date.UTC(
    exam.getUTCFullYear(),
    exam.getUTCMonth(),
    exam.getUTCDate(),
  );
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const diff = Math.round((examUtc - todayUtc) / 86400000);
  return diff > 0 ? diff : null;
}

function polishDaysPhrase(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} dni`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n} dzień`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} dni`;
  return `${n} dni`;
}

export function ExamDateSection({ examDate }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(() => isoToDateInput(examDate));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(isoToDateInput(examDate));
  }, [examDate]);

  const daysLeft = useMemo(() => daysUntilFuture(examDate), [examDate]);

  const persist = useCallback(
    async (next: string) => {
      setSaving(true);
      const res = await updateExamDate({ exam_date: next });
      setSaving(false);
      if (res.ok) {
        router.refresh();
      } else {
        toast(res.message, "error");
        setValue(isoToDateInput(examDate));
      }
    },
    [examDate, router, toast],
  );

  return (
    <section>
      <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">
        EGZAMIN
      </h2>
      <div className="mt-6 space-y-2">
        <label htmlFor="exam-date" className="font-body text-body-sm text-secondary">
          Kiedy masz egzamin?
        </label>
        <input
          id="exam-date"
          type="date"
          value={value}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            void persist(next);
          }}
          className={cn(inputClass, saving && "opacity-60")}
        />
        {daysLeft != null ? (
          <p className="font-body text-body-sm text-brand-sage">
            Do egzaminu: {polishDaysPhrase(daysLeft)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {value ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setValue("");
                void persist("");
              }}
              className="font-body text-body-sm text-brand-sage underline-offset-2 transition-colors hover:text-brand-gold hover:underline disabled:opacity-50"
            >
              Usuń datę
            </button>
          ) : null}
        </div>
        <p className="font-body text-body-xs text-muted">
          Pole opcjonalne — pomoże dopasować plan nauki.
        </p>
      </div>
    </section>
  );
}
