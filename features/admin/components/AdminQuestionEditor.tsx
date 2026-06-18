"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Check, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  fetchAdminTopicCatalog,
  updateQuestionFull,
} from "@/features/admin/server/adminActions";
import { AdminQuestionImageField } from "@/features/admin/components/AdminQuestionImageField";
import { AdminTopicAssignmentFields } from "@/features/admin/components/AdminTopicAssignmentFields";
import { MarkdownExplanationEditor } from "@/features/admin/components/MarkdownExplanationEditor";
import type {
  AdminQuestionDetail,
  AdminQuestionOption,
  QuestionEditLogEntry,
} from "@/features/admin/server/loadAdminQuestionDetail";
import type { AdminTopicCatalog } from "@/features/admin/server/loadAdminTopicCatalog";
import { cn } from "@/lib/utils";

type AdminQuestionEditorProps = {
  question: AdminQuestionDetail;
  history?: QuestionEditLogEntry[];
  reportId?: string;
  onSaved?: () => void;
};

type EditableState = {
  text: string;
  options: AdminQuestionOption[];
  correctOptionId: string;
  explanation: string;
  isActive: boolean;
  sourceExam: string;
  sourceCode: string;
  imageUrl: string;
  topicId: string;
  themeLabel: string;
  subthemeLabel: string;
  batchLabel: string;
  learningOutcome: string;
  disableOptionShuffle: boolean;
};

function toState(q: AdminQuestionDetail): EditableState {
  return {
    text: q.text,
    options: q.options.map((opt) => ({ ...opt })),
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
    isActive: q.isActive,
    sourceExam: q.sourceExam ?? "",
    sourceCode: q.sourceCode ?? "",
    imageUrl: q.imageUrl ?? "",
    topicId: q.topicId ?? "",
    themeLabel: q.themeLabel ?? "",
    subthemeLabel: q.subthemeLabel ?? "",
    batchLabel: q.batchLabel ?? "",
    learningOutcome: q.learningOutcome ?? "",
    disableOptionShuffle: q.disableOptionShuffle,
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const NEXT_OPTION_ID = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function AdminQuestionEditor({
  question,
  history,
  reportId,
  onSaved,
}: AdminQuestionEditorProps) {
  const initial = useMemo(() => toState(question), [question]);
  const [state, setState] = useState<EditableState>(initial);
  const [feedback, setFeedback] = useState<
    | { tone: "success" | "error" | "info"; message: string }
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [catalog, setCatalog] = useState<AdminTopicCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminTopicCatalog()
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setCatalogError(res.message);
          return;
        }
        setCatalog(res.catalog);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[AdminQuestionEditor] fetchAdminTopicCatalog", err);
        setCatalogError("Nie udało się wczytać katalogu tematów.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const topicSummary = useMemo(() => {
    if (state.topicId && catalog) {
      const topic = catalog.topics.find((entry) => entry.id === state.topicId);
      if (topic) return `${topic.name} (${topic.id})`;
    }
    if (question.topicName && question.topicId) {
      return `${question.topicName} (${question.topicId})`;
    }
    return question.topicId ?? "—";
  }, [state.topicId, catalog, question.topicId, question.topicName]);

  const dirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(initial),
    [state, initial],
  );

  const updateOption = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      options: prev.options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt,
      ),
    }));
  }, []);

  const addOption = useCallback(() => {
    setState((prev) => {
      if (prev.options.length >= 8) return prev;
      const used = new Set(prev.options.map((o) => o.id));
      const nextId =
        NEXT_OPTION_ID.find((c) => !used.has(c)) ??
        `o${prev.options.length + 1}`;
      return {
        ...prev,
        options: [...prev.options, { id: nextId, text: "" }],
      };
    });
  }, []);

  const removeOption = useCallback((id: string) => {
    setState((prev) => {
      if (prev.options.length <= 2) return prev;
      const next = prev.options.filter((o) => o.id !== id);
      const correctStillExists = next.some(
        (o) => o.id === prev.correctOptionId,
      );
      return {
        ...prev,
        options: next,
        correctOptionId: correctStillExists
          ? prev.correctOptionId
          : (next[0]?.id ?? ""),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initial);
    setFeedback(null);
  }, [initial]);

  const handleSave = useCallback(async () => {
    setFeedback(null);

    if (state.text.trim().length === 0) {
      setFeedback({ tone: "error", message: "Treść pytania nie może być pusta." });
      return;
    }
    if (state.options.some((opt) => opt.text.trim().length === 0)) {
      setFeedback({
        tone: "error",
        message: "Wszystkie opcje muszą mieć treść.",
      });
      return;
    }
    if (!state.options.some((opt) => opt.id === state.correctOptionId)) {
      setFeedback({
        tone: "error",
        message: "Wybierz poprawną odpowiedź.",
      });
      return;
    }
    if (!state.topicId.trim()) {
      setFeedback({
        tone: "error",
        message: "Wybierz dział (temat) w sekcji przypisania tematycznego.",
      });
      return;
    }

    setIsSaving(true);
    const result = await updateQuestionFull({
      questionId: question.id,
      reportId,
      text: state.text,
      options: state.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
      correctOptionId: state.correctOptionId,
      explanation: state.explanation,
      isActive: state.isActive,
      sourceExam: emptyToNull(state.sourceExam),
      sourceCode: emptyToNull(state.sourceCode),
      imageUrl: emptyToNull(state.imageUrl),
      topicId: emptyToNull(state.topicId),
      themeLabel: emptyToNull(state.themeLabel),
      subthemeLabel: emptyToNull(state.subthemeLabel),
      batchLabel: emptyToNull(state.batchLabel),
      learningOutcome: emptyToNull(state.learningOutcome),
      disableOptionShuffle: state.disableOptionShuffle,
    });
    setIsSaving(false);

    if (!result.ok) {
      setFeedback({ tone: "error", message: result.message });
      return;
    }

    if (result.changedFields.length === 0) {
      setFeedback({ tone: "info", message: "Brak zmian — nie zapisano." });
      return;
    }

    setFeedback({
      tone: "success",
      message: `Zapisano (${result.changedFields.length} ${
        result.changedFields.length === 1 ? "pole" : "pól"
      }).`,
    });

    startTransition(() => {
      onSaved?.();
    });
  }, [state, question.id, reportId, onSaved]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 rounded-btn bg-background/60 px-3 py-2 text-body-xs text-secondary">
        <Meta label="ID" value={question.id} />
        <Meta label="Typ" value={question.questionType ?? "—"} />
        <Meta label="Temat" value={topicSummary} />
      </div>

      <Field label="Treść pytania">
        <textarea
          value={state.text}
          onChange={(e) => setState((p) => ({ ...p, text: e.target.value }))}
          rows={3}
          className={inputClass}
        />
      </Field>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="font-body text-body-xs uppercase tracking-widest text-muted">
            Opcje odpowiedzi
          </label>
          {state.options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 rounded-btn border border-border bg-card px-2 py-1 font-body text-body-xs text-secondary transition-colors hover:text-white"
            >
              <Plus className="size-3" aria-hidden /> Dodaj opcję
            </button>
          )}
        </div>
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Poprawna odpowiedź"
        >
          {state.options.map((opt) => {
            const isCorrect = opt.id === state.correctOptionId;
            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-start gap-2 rounded-btn border px-2 py-2",
                  isCorrect
                    ? "border-success/40 bg-success/[0.06]"
                    : "border-border bg-background",
                )}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isCorrect}
                  onClick={(event) => {
                    event.preventDefault();
                    setState((p) => ({ ...p, correctOptionId: opt.id }));
                  }}
                  title={
                    isCorrect ? "Aktualnie poprawna" : "Oznacz jako poprawną"
                  }
                  className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    "font-body text-body-xs font-medium uppercase",
                    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60",
                    isCorrect
                      ? "bg-success text-brand-bg"
                      : "bg-card text-secondary hover:bg-white/10",
                  )}
                >
                  {opt.id.toUpperCase()}
                </button>
                <textarea
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  rows={2}
                  className="min-w-0 flex-1 resize-none rounded-btn border border-border bg-background px-2 py-1.5 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
                />
                {state.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="mt-1 rounded-btn p-1 text-muted transition-colors hover:bg-error/10 hover:text-error"
                    title="Usuń opcję"
                    aria-label={`Usuń opcję ${opt.id.toUpperCase()}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <MarkdownExplanationEditor
        value={state.explanation}
        onChange={(explanation) => setState((p) => ({ ...p, explanation }))}
      />

      {catalogError ? (
        <div className="rounded-btn border border-error/40 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
          {catalogError}
        </div>
      ) : catalog ? (
        <AdminTopicAssignmentFields
          catalog={catalog}
          topicId={state.topicId}
          themeLabel={state.themeLabel}
          subthemeLabel={state.subthemeLabel}
          initialSubjectId={question.subjectId}
          onTopicIdChange={(topicId) => setState((p) => ({ ...p, topicId }))}
          onThemeLabelChange={(themeLabel) =>
            setState((p) => ({ ...p, themeLabel }))
          }
          onSubthemeLabelChange={(subthemeLabel) =>
            setState((p) => ({ ...p, subthemeLabel }))
          }
        />
      ) : (
        <div className="flex items-center gap-2 rounded-card border border-border bg-background/40 px-3 py-4 font-body text-body-sm text-secondary">
          <Loader2 className="size-4 animate-spin text-brand-gold" aria-hidden />
          Wczytuję katalog tematów…
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Termin egzaminu (source_exam)">
          <input
            type="text"
            value={state.sourceExam}
            placeholder="np. LDEK wiosna 2024"
            onChange={(e) =>
              setState((p) => ({ ...p, sourceExam: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Numer pytania (source_code)">
          <input
            type="text"
            value={state.sourceCode}
            placeholder="np. 12"
            onChange={(e) =>
              setState((p) => ({ ...p, sourceCode: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <AdminQuestionImageField
          questionId={question.id}
          value={state.imageUrl}
          onChange={(imageUrl) => setState((p) => ({ ...p, imageUrl }))}
        />
        <Field label="Batch label">
          <input
            type="text"
            value={state.batchLabel}
            onChange={(e) =>
              setState((p) => ({ ...p, batchLabel: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Learning outcome">
          <input
            type="text"
            value={state.learningOutcome}
            onChange={(e) =>
              setState((p) => ({ ...p, learningOutcome: e.target.value }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 rounded-btn border border-border bg-background/60 px-3 py-2">
        <label className="flex items-center gap-2 font-body text-body-sm text-primary">
          <input
            type="checkbox"
            checked={state.disableOptionShuffle}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                disableOptionShuffle: e.target.checked,
              }))
            }
            className="size-4 accent-brand-sage"
          />
          Zablokuj mieszanie opcji (A–E) w sesji
        </label>
        <p className="font-body text-body-xs text-muted">
          Opcje pozostają w kolejności z bazy. Włącz, gdy pytanie ma meta-opcje
          (np. „A i B", „wszystkie prawidłowe"), odwołania (A)–(E) w wyjaśnieniu
          lub inne przypadki, których automatyczna detekcja nie wychwyciła.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-btn border border-border bg-background/60 px-3 py-2">
        <label className="flex items-center gap-2 font-body text-body-sm text-primary">
          <input
            type="checkbox"
            checked={state.isActive}
            onChange={(e) =>
              setState((p) => ({ ...p, isActive: e.target.checked }))
            }
            className="size-4 accent-brand-sage"
          />
          Pytanie aktywne (dostępne w sesjach)
        </label>
        {!state.isActive && (
          <span className="rounded-pill bg-error/10 px-2 py-0.5 font-body text-body-xs text-error">
            Zostanie ukryte
          </span>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-btn border px-3 py-2 font-body text-body-sm",
            feedback.tone === "success" &&
              "border-success/40 bg-success/10 text-success",
            feedback.tone === "error" &&
              "border-error/40 bg-error/10 text-error",
            feedback.tone === "info" &&
              "border-border bg-card/60 text-secondary",
          )}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={!dirty || isSaving}
          className="inline-flex items-center gap-1 rounded-btn border border-border px-3 py-1.5 font-body text-body-sm text-secondary transition-colors hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isSaving || isPending}
          className="inline-flex items-center gap-2 rounded-btn bg-brand-sage px-4 py-1.5 font-body text-body-sm font-medium text-white transition-colors hover:bg-brand-sage/90 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Zapisz pytanie
        </button>
      </div>

      {history && history.length > 0 && (
        <details className="rounded-card border border-border bg-background/50">
          <summary className="cursor-pointer select-none px-3 py-2 font-body text-body-xs uppercase tracking-widest text-muted">
            Historia zmian ({history.length})
          </summary>
          <ul className="flex flex-col gap-2 px-3 pb-3 pt-1">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-btn bg-card px-3 py-2 font-body text-body-xs text-secondary"
              >
                <div className="flex flex-wrap items-center gap-2 text-secondary">
                  <span className="text-primary">{entry.editorName}</span>
                  <span className="text-muted">·</span>
                  <span className="rounded-pill bg-white/5 px-2 py-0.5 text-body-xs">
                    {entry.editorRole}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{formatDateTime(entry.createdAt)}</span>
                </div>
                <div className="mt-1 text-muted">
                  Zmienione pola: {entry.changedFields.join(", ") || "—"}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

const inputClass = cn(
  "w-full rounded-btn border border-border bg-background px-3 py-2",
  "font-body text-body-sm text-primary placeholder:text-muted",
  "focus:border-brand-sage focus:outline-none",
);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="truncate font-body text-body-sm text-primary" title={value}>
        {value}
      </span>
    </div>
  );
}
