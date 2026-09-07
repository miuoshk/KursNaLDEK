"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Bookmark, Flag, MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { toggleBookmark } from "@/features/session/api/toggleBookmark";
import { isQuestionSaved } from "@/features/session/api/isQuestionSaved";
import { ReportErrorDialog } from "@/features/session/components/ReportErrorDialog";
import { DiscussionPanel } from "@/features/session/components/DiscussionPanel";
import { loadDiscussion } from "@/features/session/api/loadDiscussion";
import { isExplanationHiddenForSubject } from "@/lib/content/subjectExplanationPolicy";
import { cn } from "@/lib/utils";

export type QuestionFooterActionsProps = {
  questionId?: string;
  questionText?: string;
  discussionCount?: number;
  subjectId?: string;
  variant?: "labels" | "icons";
};

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-btn text-secondary transition-colors",
            "hover:bg-white/5 hover:text-primary",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="rounded-btn border border-border bg-card px-2 py-1 font-body text-body-xs text-primary"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function QuestionFooterActions({
  questionId,
  questionText = "",
  discussionCount = 0,
  subjectId,
  variant = "labels",
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
  const reportLabel = t("questionFooter.reportError");
  const saveLabel = saved ? t("questionFooter.saved") : t("questionFooter.save");
  const discussionLabel = t("questionFooter.discussion", { count: displayCount });

  const dialogs = questionId ? (
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
  ) : null;

  if (variant === "icons") {
    return (
      <div className="flex items-center justify-center gap-1">
        <IconAction
          label={reportLabel}
          disabled={!questionId}
          onClick={() => setReportOpen(true)}
        >
          <Flag className="size-5" aria-hidden />
        </IconAction>
        <IconAction
          label={saveLabel}
          disabled={!isLoaded || saving || !questionId}
          onClick={() => void handleBookmark()}
        >
          <Bookmark
            className={cn("size-5", saved && "fill-current")}
            aria-hidden
          />
        </IconAction>
        <IconAction
          label={discussionLabel}
          disabled={!questionId}
          onClick={() => setDiscussionOpen((prev) => !prev)}
        >
          <MessageCircle className="size-5" aria-hidden />
        </IconAction>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={() => setReportOpen(true)}
          disabled={!questionId}
        >
          <Flag className="size-4 shrink-0" aria-hidden />
          {reportLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={handleBookmark}
          disabled={!isLoaded || saving || !questionId}
        >
          <Bookmark
            className={cn("size-4 shrink-0", saved && "fill-current")}
            aria-hidden
          />
          {saveLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 font-body text-body-sm text-secondary transition-colors hover:text-primary"
          onClick={() => setDiscussionOpen((prev) => !prev)}
          disabled={!questionId}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          {discussionLabel}
        </button>
      </div>
      {dialogs}
    </div>
  );
}

export const SessionQuestionActions = QuestionFooterActions;
