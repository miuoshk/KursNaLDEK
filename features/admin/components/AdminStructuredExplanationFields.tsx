"use client";

import { useEffect, useRef, useState } from "react";
import { previewExplanationBlocks } from "@/features/admin/server/adminActions";
import type { AdminQuestionOption } from "@/features/admin/server/loadAdminQuestionDetail";
import {
  EXPLANATION_BLOCKS_LIMITS,
  contrastToGfm,
  parseContrastGfm,
  type ExplanationBlocksV2,
} from "@/features/shared/lib/explanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";

type Props = {
  questionId: string;
  value: ExplanationBlocksV2 | null;
  options: AdminQuestionOption[];
  correctOptionId: string;
  onChange: (value: ExplanationBlocksV2 | null) => void;
};

const inputClass =
  "w-full rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none";

function CharCount({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span
      className={
        over
          ? "font-body text-body-xs text-error"
          : "font-body text-body-xs text-muted"
      }
    >
      {value.length}/{limit}
    </span>
  );
}

export function AdminStructuredExplanationFields({
  questionId,
  value,
  options,
  correctOptionId,
  onChange,
}: Props) {
  const [takeaway, setTakeaway] = useState(value?.takeaway ?? "");
  const [correctReason, setCorrectReason] = useState(
    value?.correctReason ?? "",
  );
  const [trap, setTrap] = useState(value?.trap ?? "");
  const [distractors, setDistractors] = useState<Record<string, string>>(
    value?.distractors ?? {},
  );
  const [contrastText, setContrastText] = useState(
    value?.contrast ? contrastToGfm(value.contrast) : "",
  );
  const [preview, setPreview] = useState("");
  const contrastTextRef = useRef(contrastText);
  contrastTextRef.current = contrastText;

  useEffect(() => {
    setTakeaway(value?.takeaway ?? "");
    setCorrectReason(value?.correctReason ?? "");
    setTrap(value?.trap ?? "");
    setDistractors(value?.distractors ?? {});
    if (value == null) {
      setContrastText("");
      return;
    }
    const incoming = value.contrast;
    const parsed = parseContrastGfm(contrastTextRef.current);
    if (JSON.stringify(incoming ?? null) !== JSON.stringify(parsed ?? null)) {
      setContrastText(incoming ? contrastToGfm(incoming) : "");
    }
  }, [value]);

  function emit(next: {
    takeaway: string;
    correctReason: string;
    trap: string;
    distractors: Record<string, string>;
    contrastText: string;
  }) {
    const blocks: ExplanationBlocksV2 = {
      version: 2,
      correctReason: next.correctReason,
    };
    if (next.takeaway.trim()) blocks.takeaway = next.takeaway;
    if (next.trap.trim()) blocks.trap = next.trap;

    const nextDistractors: Record<string, string> = {};
    for (const option of options) {
      if (option.id === correctOptionId) continue;
      const reason = next.distractors[option.id] ?? "";
      if (reason.trim()) nextDistractors[option.id] = reason;
    }
    if (Object.keys(nextDistractors).length > 0) {
      blocks.distractors = nextDistractors;
    }

    const contrast = parseContrastGfm(next.contrastText);
    if (contrast) blocks.contrast = contrast;

    onChange(blocks);
  }

  function handleClear() {
    if (
      !confirm(
        "Wyczyścić bloki wyjaśnienia? To jedyna droga do usunięcia bloków z tego formularza.",
      )
    ) {
      return;
    }
    onChange(null);
  }

  useEffect(() => {
    if (value == null) {
      setPreview("");
      return;
    }

    const handle = window.setTimeout(() => {
      void previewExplanationBlocks({
        questionId,
        blocks: value,
      }).then((result) => {
        setPreview(result.markdown);
      });
    }, 500);

    return () => window.clearTimeout(handle);
  }, [value, questionId]);

  const otherOptions = options.filter(
    (option) => option.id !== correctOptionId,
  );

  return (
    <section className="space-y-3 rounded-card border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-body text-body-xs uppercase tracking-widest text-muted">
            Bloki wyjaśnienia (v2)
          </h3>
          <p className="mt-1 font-body text-body-xs text-secondary">
            Mechanizm jest obowiązkowy, gdy bloki istnieją. Puste pola nie
            zerują kolumny — do NULL służy wyłącznie „Wyczyść bloki”.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={value == null}
          className="rounded-btn border border-border px-3 py-1.5 font-body text-body-xs text-secondary transition-colors hover:text-white disabled:opacity-40"
        >
          Wyczyść bloki
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-body text-body-xs text-muted">Zasada</span>
          <CharCount
            value={takeaway}
            limit={EXPLANATION_BLOCKS_LIMITS.takeaway}
          />
        </span>
        <textarea
          rows={2}
          value={takeaway}
          onChange={(event) => {
            const next = event.target.value;
            setTakeaway(next);
            emit({
              takeaway: next,
              correctReason,
              trap,
              distractors,
              contrastText,
            });
          }}
          placeholder="Jedna zasada do odtworzenia na egzaminie."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-body text-body-xs text-muted">
            Mechanizm (obowiązkowe)
          </span>
          <CharCount
            value={correctReason}
            limit={EXPLANATION_BLOCKS_LIMITS.correctReason}
          />
        </span>
        <textarea
          rows={4}
          value={correctReason}
          onChange={(event) => {
            const next = event.target.value;
            setCorrectReason(next);
            emit({
              takeaway,
              correctReason: next,
              trap,
              distractors,
              contrastText,
            });
          }}
          placeholder="Dlaczego poprawna odpowiedź jest poprawna."
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        <p className="font-body text-body-xs text-muted">
          Dlaczego nie pozostałe
        </p>
        {otherOptions.map((option) => {
          const field = distractors[option.id] ?? "";
          return (
            <label key={option.id} className="flex flex-col gap-1">
              <span className="flex items-start justify-between gap-2">
                <span className="font-body text-body-xs text-secondary">
                  {option.text.trim() || "(pusta opcja)"}
                </span>
                <CharCount
                  value={field}
                  limit={EXPLANATION_BLOCKS_LIMITS.distractor}
                />
              </span>
              <textarea
                rows={2}
                value={field}
                onChange={(event) => {
                  const nextDistractors = {
                    ...distractors,
                    [option.id]: event.target.value,
                  };
                  setDistractors(nextDistractors);
                  emit({
                    takeaway,
                    correctReason,
                    trap,
                    distractors: nextDistractors,
                    contrastText,
                  });
                }}
                className={inputClass}
              />
            </label>
          );
        })}
      </div>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-body text-body-xs text-muted">Pułapka</span>
          <CharCount value={trap} limit={EXPLANATION_BLOCKS_LIMITS.trap} />
        </span>
        <textarea
          rows={2}
          value={trap}
          onChange={(event) => {
            const next = event.target.value;
            setTrap(next);
            emit({
              takeaway,
              correctReason,
              trap: next,
              distractors,
              contrastText,
            });
          }}
          placeholder="Co najczęściej myli zdającego."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-body text-body-xs text-muted">
            Kontrast (tabela GFM)
          </span>
          <span className="font-body text-body-xs text-muted">
            ≤ {EXPLANATION_BLOCKS_LIMITS.contrastCols} kol. · ≤{" "}
            {EXPLANATION_BLOCKS_LIMITS.contrastRows} wierszy · komórka ≤{" "}
            {EXPLANATION_BLOCKS_LIMITS.contrastCell}
          </span>
        </span>
        <textarea
          rows={5}
          value={contrastText}
          onChange={(event) => {
            const next = event.target.value;
            setContrastText(next);
            emit({
              takeaway,
              correctReason,
              trap,
              distractors,
              contrastText: next,
            });
          }}
          placeholder={
            "| cecha | ostre | przewlekłe |\n| --- | --- | --- |\n| czas | dni | miesiące |"
          }
          className={`${inputClass} font-mono`}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="font-body text-body-xs uppercase tracking-widest text-muted">
          Podgląd renderu
        </span>
        <div className="rounded-btn border border-border bg-card px-4 py-3">
          {preview.trim().length > 0 ? (
            markdownBlock(preview)
          ) : (
            <p className="font-body text-body-sm text-muted">
              Podgląd pojawi się po uzupełnieniu poprawnego mechanizmu.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
