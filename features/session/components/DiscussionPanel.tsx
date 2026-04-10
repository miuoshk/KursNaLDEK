"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { loadDiscussion } from "@/features/session/api/loadDiscussion";
import { deleteComment, postComment } from "@/features/session/api/postComment";
import { DiscussionComment } from "@/features/session/components/DiscussionComment";
import type { DiscussionComment as CommentType } from "@/features/session/api/loadDiscussion";

type DiscussionPanelProps = {
  questionId: string;
  open: boolean;
};

export function DiscussionPanel({ questionId, open }: DiscussionPanelProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    void loadDiscussion(questionId).then((res) => {
      if (res.ok) setComments(res.comments);
      setLoading(false);
      setLoaded(true);
    });
  }, [open, questionId, loaded]);

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
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    },
    [],
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
                placeholder="Dodaj komentarz..."
                rows={2}
                className="min-h-[60px] flex-1 resize-none rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
              />
              <button
                type="button"
                disabled={!text.trim() || posting}
                onClick={() => void handlePost()}
                className="self-end rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-40"
              >
                Wyślij
              </button>
            </div>

            {loading ? (
              <p className="mt-4 font-body text-body-sm text-muted">Ładowanie…</p>
            ) : comments.length === 0 ? (
              <p className="mt-4 font-body text-body-sm text-muted">
                Brak komentarzy. Bądź pierwszy!
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
