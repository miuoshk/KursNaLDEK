"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Bold, Italic, List, Eye, Pencil } from "lucide-react";
import { markdownBlock } from "@/features/shared/lib/markdownBlock";
import { cn } from "@/lib/utils";

type ViewMode = "edit" | "preview" | "split";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  label?: string;
  hint?: string;
};

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder: string,
): { next: string; cursorStart: number; cursorEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = textarea.value;
  const selected = current.slice(start, end);
  const inner = selected.length > 0 ? selected : placeholder;
  const next =
    current.slice(0, start) + before + inner + after + current.slice(end);
  const cursorStart = start + before.length;
  const cursorEnd = cursorStart + inner.length;
  return { next, cursorStart, cursorEnd };
}

function prefixLines(
  textarea: HTMLTextAreaElement,
  prefix: string,
): { next: string; cursorStart: number; cursorEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = textarea.value;
  const block = current.slice(start, end) || "element listy";
  const lines = block.split("\n");
  const prefixed = lines.map((line) => {
    const t = line.trim();
    if (!t) return prefix.trim();
    if (t.startsWith(prefix.trim())) return line;
    return `${prefix}${t}`;
  });
  const inner = prefixed.join("\n");
  const next = current.slice(0, start) + inner + current.slice(end);
  return {
    next,
    cursorStart: start,
    cursorEnd: start + inner.length,
  };
}

export function MarkdownExplanationEditor({
  value,
  onChange,
  rows = 8,
  label = "Wyjaśnienie",
  hint = "Markdown: **pogrubienie**, *kursywa*, listy (- …). Podgląd jak w sesji nauki.",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  const [view, setView] = useState<ViewMode>("split");

  const applyEdit = useCallback(
    (
      edit: (
        el: HTMLTextAreaElement,
      ) => { next: string; cursorStart: number; cursorEnd: number },
    ) => {
      const el = textareaRef.current;
      if (!el) return;
      const { next, cursorStart, cursorEnd } = edit(el);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [onChange],
  );

  const toolbarBtn =
    "inline-flex size-8 items-center justify-center rounded-btn border border-border bg-card text-secondary transition-colors hover:bg-white/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-body-xs uppercase tracking-widest text-muted">
          {label}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <div
            className="flex items-center gap-0.5 rounded-btn border border-border bg-background/60 p-0.5"
            role="toolbar"
            aria-label="Formatowanie markdown"
          >
            <button
              type="button"
              className={toolbarBtn}
              title="Pogrubienie (**tekst**)"
              aria-label="Pogrubienie"
              onClick={() =>
                applyEdit((el) => wrapSelection(el, "**", "**", "tekst"))
              }
            >
              <Bold className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={toolbarBtn}
              title="Kursywa (*tekst*)"
              aria-label="Kursywa"
              onClick={() =>
                applyEdit((el) => wrapSelection(el, "*", "*", "tekst"))
              }
            >
              <Italic className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={toolbarBtn}
              title="Lista (- element)"
              aria-label="Lista punktowana"
              onClick={() => applyEdit((el) => prefixLines(el, "- "))}
            >
              <List className="size-4" aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-0.5 rounded-btn border border-border bg-background/60 p-0.5">
            {(
              [
                { id: "edit" as const, icon: Pencil, label: "Edycja" },
                { id: "split" as const, icon: Eye, label: "Oba" },
                { id: "preview" as const, icon: Eye, label: "Podgląd" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "rounded-btn px-2.5 py-1 font-body text-body-xs transition-colors",
                  view === tab.id
                    ? "bg-brand-gold/15 text-brand-gold"
                    : "text-secondary hover:text-primary",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p id={hintId} className="font-body text-body-xs text-muted">
        {hint}
      </p>

      <div
        className={cn(
          "grid gap-3",
          view === "split" && "lg:grid-cols-2",
        )}
      >
        {(view === "edit" || view === "split") && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            aria-describedby={hintId}
            spellCheck
            className={cn(
              "min-h-[12rem] w-full resize-y rounded-btn border border-border bg-background px-3 py-2",
              "font-mono text-body-sm leading-relaxed text-primary placeholder:text-muted",
              "focus:border-brand-sage focus:outline-none",
            )}
            placeholder="Treść wyjaśnienia…"
          />
        )}

        {(view === "preview" || view === "split") && (
          <div
            className={cn(
              "min-h-[12rem] overflow-y-auto rounded-btn border border-border bg-card px-4 py-3",
              value.trim().length === 0 && "flex items-center justify-center",
            )}
          >
            {value.trim().length > 0 ? (
              markdownBlock(value)
            ) : (
              <p className="font-body text-body-sm text-muted">
                Podgląd pojawi się tutaj…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
