"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAdminOrModerator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!(profile?.role === "admin" || profile?.role === "moderator")) {
    throw new Error("Forbidden");
  }

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
