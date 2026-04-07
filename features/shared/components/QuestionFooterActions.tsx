"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, MessageCircle } from "lucide-react";
import { toggleBookmark } from "@/features/session/api/toggleBookmark";
import { isQuestionSaved } from "@/features/session/api/isQuestionSaved";

export type QuestionFooterActionsProps = {
  /** Id pytania (np. do zgłoszenia błędu / dyskusji). */
  questionId?: string;
  /** Skrócony kontekst pytania (opcjonalnie). */
  questionText?: string;
  /** Liczba wpisów w dyskusji — domyślnie 0. */
  discussionCount?: number;
};

/**
 * Wspólny pasek akcji pod treścią pytania (sesja LDEK, OSCE, symulacja).
 */
export function QuestionFooterActions({
  questionId,
  discussionCount = 0,
}: QuestionFooterActionsProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(false);
    if (!questionId) return;
    let cancelled = false;
    isQuestionSaved(questionId).then((val) => {
      if (!cancelled) setSaved(val);
    });
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const handleBookmark = useCallback(async () => {
    if (saving || !questionId) return;
    setSaving(true);
    const res = await toggleBookmark(questionId);
    if (res.ok) setSaved(res.saved);
    setSaving(false);
  }, [questionId, saving]);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
      <button
        type="button"
        className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        disabled
        title="Wkrótce"
      >
        <Flag className="size-4 shrink-0" aria-hidden />
        Zgłoś błąd
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        onClick={handleBookmark}
        disabled={saving || !questionId}
      >
        <Bookmark
          className={`size-4 shrink-0 ${saved ? "text-brand-gold" : ""}`}
          aria-hidden
        />
        {saved ? "Zapisano \u2713" : "Zapisz"}
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        disabled
        title="Wkrótce"
      >
        <MessageCircle className="size-4 shrink-0" aria-hidden />
        Dyskusja ({discussionCount})
      </button>
    </div>
  );
}

/** Alias nazwy używanej w module sesji nauki. */
export const SessionQuestionActions = QuestionFooterActions;
