"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/features/admin/server/adminAuth";

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
