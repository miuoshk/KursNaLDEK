"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignCemInboxQuestion,
  suggestCemInboxTopics,
  undoCemInboxAssignment,
} from "@/features/admin/server/cemInboxActions";
import type {
  CemInboxQuestion,
  CemInboxSubject,
  CemInboxSuggestion,
  CemInboxTopic,
} from "@/features/admin/server/loadCemInbox";
import { cn } from "@/lib/utils";

type UndoEntry = {
  question: CemInboxQuestion;
  topicId: string;
};

type CemInboxMapperProps = {
  subjects: CemInboxSubject[];
  subjectId: string;
  inboxId: string;
  topics: CemInboxTopic[];
  initialQuestions: CemInboxQuestion[];
};

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function occurrenceLabel(question: CemInboxQuestion): string {
  const occ = question.occurrences[0];
  if (!occ) return "brak wpisu w arkuszu";
  const nr = occ.number != null ? `nr ${occ.number}` : "nr ?";
  return `${occ.sessionLabel} · ${nr}`;
}

export function CemInboxMapper({
  subjects,
  subjectId,
  inboxId,
  topics,
  initialQuestions,
}: CemInboxMapperProps) {
  const router = useRouter();
  const [queue, setQueue] = useState(initialQuestions);
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id ?? "");
  const [suggestions, setSuggestions] = useState<CemInboxSuggestion[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = queue[0] ?? null;

  useEffect(() => {
    setQueue(initialQuestions);
    setUndoStack([]);
    setSelectedTopicId(topics[0]?.id ?? "");
  }, [initialQuestions, topics]);

  useEffect(() => {
    if (!current) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    void suggestCemInboxTopics(current.id, subjectId).then((rows) => {
      if (!cancelled) setSuggestions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [current, subjectId]);

  const numberedTopics = useMemo(() => topics.slice(0, 9), [topics]);

  const assign = useCallback(
    (topicId: string) => {
      if (!current || pending) return;
      if (!topicId || topicId === inboxId) {
        setMessage("Wybierz temat z listy.");
        return;
      }
      const question = current;
      startTransition(async () => {
        const result = await assignCemInboxQuestion({
          questionId: question.id,
          topicId,
          subjectId,
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        setMessage(null);
        setUndoStack((stack) => [...stack, { question, topicId }]);
        setQueue((q) => q.slice(1));
      });
    },
    [current, inboxId, pending, subjectId],
  );

  const skip = useCallback(() => {
    setQueue((q) => {
      if (q.length <= 1) return q;
      return [...q.slice(1), q[0]];
    });
  }, []);

  const undo = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last || pending) return;
    startTransition(async () => {
      const result = await undoCemInboxAssignment({
        questionId: last.question.id,
        topicId: last.topicId,
        subjectId,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setUndoStack((stack) => stack.slice(0, -1));
      setQueue((q) => [last.question, ...q]);
    });
  }, [pending, subjectId, undoStack]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;

      if (event.key >= "1" && event.key <= "9") {
        event.preventDefault();
        const topic = numberedTopics[Number(event.key) - 1];
        if (topic) assign(topic.id);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        assign(selectedTopicId);
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        skip();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assign, numberedTopics, selectedTopicId, skip, undo]);

  return (
    <div className="space-y-5 font-body">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[240px]">
          <span className="mb-1 block text-body-xs text-muted">Przedmiot</span>
          <select
            className="w-full rounded-btn border border-border bg-card px-3 py-2 text-body-md text-primary"
            value={subjectId}
            onChange={(event) => {
              router.push(`/admin/cem/inbox?subject=${encodeURIComponent(event.target.value)}`);
            }}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.shortName ?? subject.name} ({subject.inboxCount})
              </option>
            ))}
          </select>
        </label>
        <p className="text-body-sm text-secondary">
          Zostało <span className="tabular-nums text-primary">{queue.length}</span>
          {" · "}
          cofnięć {undoStack.length}
        </p>
      </div>

      <p className="text-body-xs text-muted">
        1–9 temat z listy · Enter zapisz i następne · S pomiń · Backspace cofnij
      </p>

      {!current ? (
        <p className="rounded-card border border-border bg-card px-4 py-8 text-center text-secondary">
          Poczekalnia pusta. Zaimportuj arkusz albo zmień przedmiot.
        </p>
      ) : (
        <div className="rounded-card border border-border bg-card p-4 sm:p-5">
          <p className="font-mono text-body-sm text-brand-gold">{current.id}</p>
          <p className="mt-1 text-body-sm text-secondary">{occurrenceLabel(current)}</p>
          <p className="mt-4 text-body-md text-primary">{current.text}</p>
          <ol className="mt-3 space-y-1 text-body-sm text-secondary">
            {current.options.map((opt) => (
              <li key={opt.id}>
                <span className="font-mono text-muted">{opt.id}.</span>{" "}
                {clip(opt.text, 120)}
              </li>
            ))}
          </ol>

          {suggestions.length > 0 && (
            <div className="mt-5">
              <p className="text-body-xs uppercase tracking-wide text-muted">
                Podpowiedzi ts_rank
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((row) => (
                  <button
                    key={row.topicId}
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setSelectedTopicId(row.topicId);
                      assign(row.topicId);
                    }}
                    className="rounded-btn border border-brand-gold/40 bg-brand-gold/10 px-2.5 py-1 text-left text-body-xs text-primary hover:bg-brand-gold/20"
                  >
                    {row.name}{" "}
                    <span className="tabular-nums text-muted">
                      {row.score.toFixed(3)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="min-w-[280px] flex-1">
              <span className="mb-1 block text-body-xs text-muted">Temat</span>
              <select
                className="w-full rounded-btn border border-border bg-background px-3 py-2 text-body-md text-primary"
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
              >
                {topics.length === 0 ? (
                  <option value="">Brak tematów (is_inbox = false)</option>
                ) : (
                  topics.map((topic, index) => (
                    <option key={topic.id} value={topic.id}>
                      {index < 9 ? `${index + 1}. ` : ""}
                      {topic.id} · {topic.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              disabled={pending || !selectedTopicId}
              onClick={() => assign(selectedTopicId)}
              className="rounded-btn bg-brand-gold px-4 py-2 text-body-sm font-medium text-brand-bg disabled:opacity-50"
            >
              Zapisz
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={skip}
              className="rounded-btn border border-border px-4 py-2 text-body-sm text-secondary"
            >
              Pomiń
            </button>
            <button
              type="button"
              disabled={pending || undoStack.length === 0}
              onClick={undo}
              className="rounded-btn border border-border px-4 py-2 text-body-sm text-secondary disabled:opacity-40"
            >
              Cofnij
            </button>
          </div>

          {numberedTopics.length > 0 && (
            <ol className="mt-4 columns-1 gap-x-6 text-body-xs text-muted sm:columns-2">
              {numberedTopics.map((topic, index) => (
                <li key={topic.id} className={cn("break-inside-avoid py-0.5")}>
                  <kbd className="font-mono text-brand-gold">{index + 1}</kbd>{" "}
                  {topic.id} · {topic.name}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {message && <p className="text-body-sm text-brand-gold">{message}</p>}
    </div>
  );
}
