"use client";

import { useCallback, useState } from "react";
import { Bookmark, Flag, MessageCircle } from "lucide-react";
import { DiscussionPanel } from "@/features/session/components/DiscussionPanel";
import { ReportErrorDialog } from "@/features/session/components/ReportErrorDialog";

type SessionQuestionActionsProps = {
  questionId: string;
  questionText?: string;
};

export function SessionQuestionActions({
  questionId,
  questionText,
}: SessionQuestionActionsProps) {
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [bookmarkToast, setBookmarkToast] = useState(false);

  const handleBookmark = useCallback(() => {
    setBookmarkToast(true);
    setTimeout(() => setBookmarkToast(false), 2000);
  }, []);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
        <button
          type="button"
          onClick={() => setDiscussionOpen((o) => !o)}
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          Dyskusja
        </button>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        >
          <Flag className="size-4 shrink-0" aria-hidden />
          Zgłoś błąd
        </button>
        <button
          type="button"
          onClick={handleBookmark}
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
        >
          <Bookmark className="size-4 shrink-0" aria-hidden />
          {bookmarkToast ? "Funkcja notatek wkrótce!" : "Zapisz"}
        </button>
      </div>

      <DiscussionPanel questionId={questionId} open={discussionOpen} />

      <ReportErrorDialog
        questionId={questionId}
        questionText={questionText ?? ""}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
