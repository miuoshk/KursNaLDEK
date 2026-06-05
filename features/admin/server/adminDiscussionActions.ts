"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/features/admin/server/adminAuth";
import { loadAdminDiscussionThread } from "@/features/admin/server/loadAdminDiscussions";

async function requireAdminOrModerator() {
  await requireAdminAccess();
  const supabase = await createClient();
  return supabase;
}

const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export async function adminDeleteDiscussionComment(
  raw: z.infer<typeof deleteCommentSchema>,
) {
  const parsed = deleteCommentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: "Nieprawidłowe dane." };
  }

  const supabase = await requireAdminOrModerator();
  const { error } = await supabase
    .from("question_discussions")
    .delete()
    .eq("id", parsed.data.commentId);

  if (error) {
    console.error("[adminDeleteDiscussionComment]", error.message);
    return { ok: false as const, message: "Nie udało się usunąć komentarza." };
  }

  return { ok: true as const };
}

const threadSchema = z.object({
  questionId: z.string().min(1),
});

export async function fetchAdminDiscussionThread(
  raw: z.infer<typeof threadSchema>,
) {
  const parsed = threadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: "Nieprawidłowe dane." };
  }

  await requireAdminAccess();
  const thread = await loadAdminDiscussionThread(parsed.data.questionId);
  if (!thread) {
    return { ok: false as const, message: "Nie znaleziono pytania lub dyskusji." };
  }

  return { ok: true as const, thread };
}
