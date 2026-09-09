"use client";

import { Plus, Trash2 } from "lucide-react";
import { EXPLANATION_BLOCKS_LIMITS } from "@/features/shared/lib/explanationBlocks";
import {
  emptyStatementDraft,
  statementIdsUsedByOptions,
  type AdminStatementDraft,
} from "@/features/admin/lib/explanationBlocksForm";
import type { AdminQuestionOption } from "@/features/admin/server/loadAdminQuestionDetail";

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

type Props = {
  options: AdminQuestionOption[];
  correctOptionId: string;
  statements: AdminStatementDraft[];
  optionStatements: Record<string, string[]>;
  onChange: (
    statements: AdminStatementDraft[],
    optionStatements: Record<string, string[]>,
  ) => void;
};

export function AdminStatementSetFields({
  options,
  correctOptionId,
  statements,
  optionStatements,
  onChange,
}: Props) {
  function updateStatement(index: number, next: AdminStatementDraft) {
    const copy = statements.map((row, rowIndex) =>
      rowIndex === index ? next : row,
    );
    onChange(copy, optionStatements);
  }

  function removeStatement(index: number) {
    const target = statements[index];
    if (!target) return;
    const usedBy = statementIdsUsedByOptions(optionStatements, target.id);
    if (usedBy.length > 0) {
      window.alert(
        `Nie można usunąć „${target.id}”: jest w kombinacjach ${usedBy
          .map((id) => id.toUpperCase())
          .join(", ")}. Najpierw odznacz te powiązania.`,
      );
      return;
    }
    onChange(
      statements.filter((_, rowIndex) => rowIndex !== index),
      optionStatements,
    );
  }

  function addStatement() {
    if (statements.length >= EXPLANATION_BLOCKS_LIMITS.statements) return;
    onChange([...statements, emptyStatementDraft(statements)], optionStatements);
  }

  function toggleMapping(optionId: string, statementId: string) {
    const current = optionStatements[optionId] ?? [];
    const next = current.includes(statementId)
      ? current.filter((id) => id !== statementId)
      : [...current, statementId];
    onChange(statements, { ...optionStatements, [optionId]: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-body text-body-xs text-muted">
          Stwierdzenia (trwałe id, nie litery opcji)
        </p>
        <button
          type="button"
          onClick={addStatement}
          disabled={statements.length >= EXPLANATION_BLOCKS_LIMITS.statements}
          className="inline-flex items-center gap-1 rounded-btn border border-border px-2 py-1 font-body text-body-xs text-secondary hover:text-white disabled:opacity-40"
        >
          <Plus className="size-3" aria-hidden />
          Dodaj stwierdzenie
        </button>
      </div>

      <div className="space-y-3">
        {statements.map((statement, index) => (
          <article
            key={`${statement.id}-${index}`}
            className="space-y-2 rounded-btn border border-border bg-card/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">
                <span className="font-body text-body-xs text-muted">id</span>
                <input
                  value={statement.id}
                  onChange={(event) =>
                    updateStatement(index, {
                      ...statement,
                      id: event.target.value,
                    })
                  }
                  className={`${inputClass} w-24`}
                />
              </label>
              <label className="flex items-center gap-1">
                <span className="font-body text-body-xs text-muted">nr</span>
                <input
                  value={statement.number}
                  onChange={(event) =>
                    updateStatement(index, {
                      ...statement,
                      number: event.target.value,
                    })
                  }
                  className={`${inputClass} w-16`}
                />
              </label>
              <label className="flex items-center gap-2 font-body text-body-xs text-secondary">
                <input
                  type="checkbox"
                  checked={statement.isTrue}
                  onChange={(event) =>
                    updateStatement(index, {
                      ...statement,
                      isTrue: event.target.checked,
                      correction: event.target.checked
                        ? ""
                        : statement.correction,
                    })
                  }
                />
                Prawda
              </label>
              {statements.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeStatement(index)}
                  className="ml-auto rounded-btn p-1 text-muted hover:bg-error/10 hover:text-error"
                  aria-label={`Usuń stwierdzenie ${statement.id}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            <label className="flex flex-col gap-1">
              <span className="flex justify-between">
                <span className="font-body text-body-xs text-muted">Treść</span>
                <CharCount
                  value={statement.text}
                  limit={EXPLANATION_BLOCKS_LIMITS.statementText}
                />
              </span>
              <textarea
                rows={2}
                value={statement.text}
                onChange={(event) =>
                  updateStatement(index, {
                    ...statement,
                    text: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="flex justify-between">
                <span className="font-body text-body-xs text-muted">
                  Uzasadnienie
                </span>
                <CharCount
                  value={statement.rationale}
                  limit={EXPLANATION_BLOCKS_LIMITS.statementRationale}
                />
              </span>
              <textarea
                rows={2}
                value={statement.rationale}
                onChange={(event) =>
                  updateStatement(index, {
                    ...statement,
                    rationale: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>
            {!statement.isTrue ? (
              <label className="flex flex-col gap-1">
                <span className="flex justify-between">
                  <span className="font-body text-body-xs text-muted">
                    Korekta (opcjonalnie)
                  </span>
                  <CharCount
                    value={statement.correction}
                    limit={EXPLANATION_BLOCKS_LIMITS.statementCorrection}
                  />
                </span>
                <textarea
                  rows={2}
                  value={statement.correction}
                  onChange={(event) =>
                    updateStatement(index, {
                      ...statement,
                      correction: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </label>
            ) : null}
          </article>
        ))}
      </div>

      <div className="space-y-2">
        <p className="font-body text-body-xs text-muted">
          Mapowanie opcji — klucze to stałe id opcji (a, b, c…), nie litera po
          tasowaniu.
        </p>
        {options.map((option) => {
          const selected = new Set(optionStatements[option.id] ?? []);
          return (
            <div
              key={option.id}
              className="rounded-btn border border-border px-3 py-2"
            >
              <p className="font-body text-body-xs text-secondary">
                <span className="font-semibold uppercase">{option.id}</span>
                {option.id === correctOptionId ? " · klucz" : ""} —{" "}
                {option.text.trim() || "(pusta opcja)"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {statements.map((statement) => (
                  <label
                    key={`${option.id}-${statement.id}`}
                    className="inline-flex items-center gap-1 rounded-btn border border-border px-2 py-1 font-body text-body-xs text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(statement.id)}
                      onChange={() => toggleMapping(option.id, statement.id)}
                    />
                    {statement.number || statement.id}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
