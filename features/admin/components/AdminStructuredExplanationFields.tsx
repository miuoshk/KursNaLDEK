"use client";

import { useEffect, useRef, useState } from "react";
import { previewExplanationBlocks } from "@/features/admin/server/adminActions";
import { AdminStatementSetFields } from "@/features/admin/components/AdminStatementSetFields";
import {
  buildSbaBlocks,
  buildStatementSetBlocks,
  emptyStatementDraft,
  explanationKindFromBlocks,
  optionStatementsFromBlocks,
  statementsFromBlocks,
  type AdminStatementDraft,
  type ExplanationKind,
} from "@/features/admin/lib/explanationBlocksForm";
import type { AdminQuestionOption } from "@/features/admin/server/loadAdminQuestionDetail";
import {
  EXPLANATION_BLOCKS_LIMITS,
  contrastToGfm,
  explanationBlocksIssueMessage,
  parseContrastGfm,
  type ExplanationBlocksIssue,
  type ExplanationBlocksV2,
} from "@/features/shared/lib/explanationBlocks";
import { renderExplanationBlocks } from "@/features/shared/lib/renderExplanationBlocks";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";

type Props = {
  questionId: string;
  value: ExplanationBlocksV2 | null;
  issue?: ExplanationBlocksIssue | null;
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
  issue,
  options,
  correctOptionId,
  onChange,
}: Props) {
  const [kind, setKind] = useState<ExplanationKind>(
    explanationKindFromBlocks(value),
  );
  const [takeaway, setTakeaway] = useState(value?.takeaway ?? "");
  const [correctReason, setCorrectReason] = useState(
    value && "correctReason" in value ? (value.correctReason ?? "") : "",
  );
  const [trap, setTrap] = useState(value?.trap ?? "");
  const [distractors, setDistractors] = useState<Record<string, string>>(
    value && "distractors" in value ? (value.distractors ?? {}) : {},
  );
  const [contrastText, setContrastText] = useState(
    value?.contrast ? contrastToGfm(value.contrast) : "",
  );
  const [statements, setStatements] = useState<AdminStatementDraft[]>(() =>
    statementsFromBlocks(value),
  );
  const [optionStatements, setOptionStatements] = useState<
    Record<string, string[]>
  >(() => optionStatementsFromBlocks(value, options.map((option) => option.id)));
  const [preview, setPreview] = useState("");
  const contrastTextRef = useRef(contrastText);
  contrastTextRef.current = contrastText;

  useEffect(() => {
    setKind(explanationKindFromBlocks(value));
    setTakeaway(value?.takeaway ?? "");
    setCorrectReason(
      value && "correctReason" in value ? (value.correctReason ?? "") : "",
    );
    setTrap(value?.trap ?? "");
    setDistractors(
      value && "distractors" in value ? (value.distractors ?? {}) : {},
    );
    setStatements(statementsFromBlocks(value));
    setOptionStatements(
      optionStatementsFromBlocks(
        value,
        options.map((option) => option.id),
      ),
    );
    if (value == null) {
      setContrastText("");
      return;
    }
    const incoming = value.contrast;
    const parsed = parseContrastGfm(contrastTextRef.current);
    if (JSON.stringify(incoming ?? null) !== JSON.stringify(parsed ?? null)) {
      setContrastText(incoming ? contrastToGfm(incoming) : "");
    }
  }, [value, options]);

  function emitSba(next: {
    takeaway: string;
    correctReason: string;
    trap: string;
    distractors: Record<string, string>;
    contrastText: string;
  }) {
    onChange(
      buildSbaBlocks({
        ...next,
        options,
        correctOptionId,
      }),
    );
  }

  function emitSet(next: {
    takeaway: string;
    trap: string;
    contrastText: string;
    statements: AdminStatementDraft[];
    optionStatements: Record<string, string[]>;
  }) {
    onChange(
      buildStatementSetBlocks({
        ...next,
        options,
      }),
    );
  }

  function handleKindChange(nextKind: ExplanationKind) {
    if (nextKind === kind) return;
    if (value != null) {
      const ok = window.confirm(
        "Zmiana rodzaju wyjaśnienia nie przenosi treści SBA i zestawienia. Kontynuować?",
      );
      if (!ok) return;
    }
    setKind(nextKind);
    if (nextKind === "statement_set") {
      const nextStatements = [
        emptyStatementDraft([]),
        emptyStatementDraft([{ id: "s1" }]),
      ];
      const nextMap = optionStatementsFromBlocks(
        null,
        options.map((option) => option.id),
      );
      setStatements(nextStatements);
      setOptionStatements(nextMap);
      setDistractors({});
      emitSet({
        takeaway,
        trap,
        contrastText,
        statements: nextStatements,
        optionStatements: nextMap,
      });
      return;
    }
    setStatements(statementsFromBlocks(null));
    emitSba({
      takeaway,
      correctReason: correctReason || " ",
      trap,
      distractors: {},
      contrastText,
    });
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

    const local = renderExplanationBlocks(value, options, correctOptionId);
    setPreview(local);

    const handle = window.setTimeout(() => {
      void previewExplanationBlocks({
        questionId,
        blocks: value,
      }).then((result) => {
        if (result.ok && result.markdown.trim()) {
          setPreview(result.markdown);
        }
      });
    }, 500);

    return () => window.clearTimeout(handle);
  }, [value, questionId, options, correctOptionId]);

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

      {issue ? (
        <p className="rounded-btn border border-error/40 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
          {explanationBlocksIssueMessage(issue, questionId)}
        </p>
      ) : null}

      <div
        className="flex gap-1 rounded-btn border border-border p-0.5"
        role="tablist"
        aria-label="Rodzaj wyjaśnienia"
      >
        {(
          [
            { id: "sba" as const, label: "Jednokrotny wybór" },
            { id: "statement_set" as const, label: "Zestawienie" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={kind === tab.id}
            onClick={() => handleKindChange(tab.id)}
            className={
              kind === tab.id
                ? "rounded-btn bg-brand-gold/15 px-3 py-1.5 font-body text-body-xs text-brand-gold"
                : "rounded-btn px-3 py-1.5 font-body text-body-xs text-secondary hover:text-primary"
            }
          >
            {tab.label}
          </button>
        ))}
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
            if (kind === "statement_set") {
              emitSet({
                takeaway: next,
                trap,
                contrastText,
                statements,
                optionStatements,
              });
            } else {
              emitSba({
                takeaway: next,
                correctReason,
                trap,
                distractors,
                contrastText,
              });
            }
          }}
          placeholder="Jedna zasada do odtworzenia na egzaminie."
          className={inputClass}
        />
      </label>

      {kind === "sba" ? (
        <>
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
                emitSba({
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
                      emitSba({
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
        </>
      ) : (
        <AdminStatementSetFields
          options={options}
          correctOptionId={correctOptionId}
          statements={statements}
          optionStatements={optionStatements}
          onChange={(nextStatements, nextMap) => {
            setStatements(nextStatements);
            setOptionStatements(nextMap);
            emitSet({
              takeaway,
              trap,
              contrastText,
              statements: nextStatements,
              optionStatements: nextMap,
            });
          }}
        />
      )}

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
            if (kind === "statement_set") {
              emitSet({
                takeaway,
                trap: next,
                contrastText,
                statements,
                optionStatements,
              });
            } else {
              emitSba({
                takeaway,
                correctReason,
                trap: next,
                distractors,
                contrastText,
              });
            }
          }}
          placeholder="Co zrobić, żeby nie pomylić."
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
            if (kind === "statement_set") {
              emitSet({
                takeaway,
                trap,
                contrastText: next,
                statements,
                optionStatements,
              });
            } else {
              emitSba({
                takeaway,
                correctReason,
                trap,
                distractors,
                contrastText: next,
              });
            }
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
