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

const postCommentSchema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function adminPostDiscussionComment(
  raw: z.infer<typeof postCommentSchema>,
) {
  const parsed = postCommentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, message: "Treść komentarza jest wymagana." };
  }

  const { user } = await requireAdminAccess();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("question_discussions")
    .insert({
      question_id: parsed.data.questionId,
      user_id: user.id,
      content: parsed.data.content.trim(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[adminPostDiscussionComment]", error.message);
    return { ok: false as const, message: "Nie udało się dodać komentarza." };
  }

  return { ok: true as const, commentId: data.id as string };
}
