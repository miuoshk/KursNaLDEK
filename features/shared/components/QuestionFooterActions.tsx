"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toggleBookmark } from "@/features/session/api/toggleBookmark";
import { isQuestionSaved } from "@/features/session/api/isQuestionSaved";
import { ReportErrorDialog } from "@/features/session/components/ReportErrorDialog";
import { DiscussionPanel } from "@/features/session/components/DiscussionPanel";
import { loadDiscussion } from "@/features/session/api/loadDiscussion";
import { isExplanationHiddenForSubject } from "@/lib/content/subjectExplanationPolicy";

export type QuestionFooterActionsProps = {
  questionId?: string;
  questionText?: string;
  discussionCount?: number;
  subjectId?: string;
};

export function QuestionFooterActions({
  questionId,
  questionText = "",
  discussionCount = 0,
  subjectId,
}: QuestionFooterActionsProps) {
  const t = useTranslations("shared");
  const hideExplanationCategory = subjectId
    ? isExplanationHiddenForSubject(subjectId)
    : false;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [discussionCountState, setDiscussionCountState] = useState(discussionCount);
  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    Promise.all([isQuestionSaved(questionId), loadDiscussion(questionId)]).then(
      ([savedValue, discussionRes]) => {
        if (cancelled) return;
        setSaved(savedValue);
        if (discussionRes.ok) setDiscussionCountState(discussionRes.total);
        setLoadedQuestionId(questionId);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [questionId, discussionCount]);

  const isLoaded = Boolean(questionId) && loadedQuestionId === questionId;

  const handleBookmark = useCallback(async () => {
    if (saving || !questionId) return;
    setSaving(true);
    const res = await toggleBookmark(questionId);
    if (res.ok) setSaved(res.saved);
    setSaving(false);
  }, [questionId, saving]);

  const displayCount = isLoaded ? discussionCountState : discussionCount;

  return (
    <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={() => setReportOpen(true)}
          disabled={!questionId}
        >
          <Flag className="size-4 shrink-0" aria-hidden />
          {t("questionFooter.reportError")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={handleBookmark}
          disabled={!isLoaded || saving || !questionId}
        >
          <Bookmark
            className={`size-4 shrink-0 ${saved ? "text-brand-gold" : ""}`}
            aria-hidden
          />
          {saved ? t("questionFooter.saved") : t("questionFooter.save")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={() => setDiscussionOpen((prev) => !prev)}
          disabled={!questionId}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          {t("questionFooter.discussion", { count: displayCount })}
        </button>
      </div>
      {questionId ? (
        <>
          <ReportErrorDialog
            key={`report-${questionId}`}
            questionId={questionId}
            questionText={questionText}
            open={reportOpen}
            onOpenChange={setReportOpen}
            hideExplanationCategory={hideExplanationCategory}
          />
          <DiscussionPanel
            key={`discussion-${questionId}`}
            questionId={questionId}
            open={discussionOpen}
            onCountChange={setDiscussionCountState}
          />
        </>
      ) : null}
    </div>
  );
}

export const SessionQuestionActions = QuestionFooterActions;
