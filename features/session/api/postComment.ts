"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export type PostCommentResult =
  | { ok: true; commentId: string }
  | { ok: false; message: string };

export async function postComment(
  raw: z.infer<typeof schema>,
): Promise<PostCommentResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Treść komentarza jest wymagana." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Musisz być zalogowany." };
    }

    const { data, error } = await supabase
      .from("question_discussions")
      .insert({
        question_id: parsed.data.questionId,
        user_id: user.id,
        content: parsed.data.content,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[postComment]", error.message);
      return { ok: false, message: "Nie udało się dodać komentarza." };
    }

    return { ok: true, commentId: data.id as string };
  } catch (e) {
    console.error("[postComment]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}

export type DeleteCommentResult = { ok: true } | { ok: false; message: string };

export async function deleteComment(commentId: string): Promise<DeleteCommentResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, message: "Musisz być zalogowany." };

    const { error } = await supabase
      .from("question_discussions")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[deleteComment]", error.message);
      return { ok: false, message: "Nie udało się usunąć komentarza." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[deleteComment]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
