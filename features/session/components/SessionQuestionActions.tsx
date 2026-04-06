"use client";

import { Bookmark, Flag, MessageCircle } from "lucide-react";

export function SessionQuestionActions() {
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
        disabled
        title="Wkrótce"
      >
        <Bookmark className="size-4 shrink-0" aria-hidden />
        Zapisz
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        disabled
        title="Wkrótce"
      >
        <MessageCircle className="size-4 shrink-0" aria-hidden />
        Dyskusja (0)
      </button>
    </div>
  );
}
