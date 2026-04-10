"use client";

import { ChevronUp, Trash2 } from "lucide-react";
import type { DiscussionComment as CommentType } from "@/features/session/api/loadDiscussion";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "wczoraj";
  return `${days} dni temu`;
}

type DiscussionCommentProps = {
  comment: CommentType;
  onDelete: (id: string) => void;
};

export function DiscussionComment({ comment, onDelete }: DiscussionCommentProps) {
  const initials = comment.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3 py-3">
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-accent-2",
          "font-body text-[10px] font-semibold text-brand-gold",
        )}
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-body text-body-sm font-medium text-primary">
            {comment.displayName}
          </span>
          <span className="font-body text-body-xs text-muted">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 font-body text-body-sm text-secondary">{comment.content}</p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 font-body text-body-xs text-muted transition-colors hover:text-brand-gold"
          >
            <ChevronUp className="size-3.5" aria-hidden />
            {comment.upvotes}
          </button>
          {comment.isOwn && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="inline-flex items-center gap-1 font-body text-body-xs text-muted transition-colors hover:text-error"
            >
              <Trash2 className="size-3" aria-hidden />
              Usuń
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
