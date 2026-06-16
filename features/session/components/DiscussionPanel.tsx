"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadDiscussion } from "@/features/session/api/loadDiscussion";
import { deleteComment, postComment } from "@/features/session/api/postComment";
import { DiscussionComment } from "@/features/session/components/DiscussionComment";
import type { DiscussionComment as CommentType } from "@/features/session/api/loadDiscussion";

type DiscussionPanelProps = {
  questionId: string;
  open: boolean;
  onCountChange?: (count: number) => void;
};

export function DiscussionPanel({ questionId, open, onCountChange }: DiscussionPanelProps) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    void loadDiscussion(questionId).then((res) => {
      if (res.ok) {
        setComments(res.comments);
        onCountChange?.(res.total);
      }
      setLoaded(true);
    });
  }, [open, questionId, loaded, onCountChange]);

  const handlePost = useCallback(async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const res = await postComment({ questionId, content: text.trim() });
    setPosting(false);
    if (res.ok) {
      setText("");
      setLoaded(false);
    }
  }, [questionId, text, posting]);

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await deleteComment(id);
      if (res.ok) {
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== id);
          onCountChange?.(next.length);
          return next;
        });
      }
    },
    [onCountChange],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mt-4 rounded-card border border-border bg-background p-4">
            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("discussionPlaceholder")}
                rows={2}
                className="min-h-[60px] flex-1 resize-none rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
              />
              <button
                type="button"
                disabled={!text.trim() || posting}
                onClick={() => void handlePost()}
                className="self-end rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-40"
              >
                {tCommon("send")}
              </button>
            </div>

            {open && !loaded ? (
              <p className="mt-4 font-body text-body-sm text-muted">{tCommon("loading")}</p>
            ) : comments.length === 0 ? (
              <p className="mt-4 font-body text-body-sm text-muted">
                {t("discussionEmpty")}
              </p>
            ) : (
              <div className="mt-2 divide-y divide-[rgba(255,255,255,0.06)]">
                {comments.map((c) => (
                  <DiscussionComment
                    key={c.id}
                    comment={c}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
