"use server";

import { createClient } from "@/lib/supabase/server";

export type DiscussionComment = {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  upvotes: number;
  hasUpvoted: boolean;
  isOwn: boolean;
  createdAt: string;
};

export type LoadDiscussionResult =
  | { ok: true; comments: DiscussionComment[]; total: number }
  | { ok: false; message: string };

export async function loadDiscussion(
  questionId: string,
): Promise<LoadDiscussionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null;

    const { data: rows, error } = await supabase
      .from("question_discussions")
      .select("id, user_id, content, upvotes, created_at, profiles(display_name)")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[loadDiscussion]", error.message);
      return { ok: false, message: "Nie udało się wczytać dyskusji." };
    }

    const comments: DiscussionComment[] = (rows ?? []).map((r) => {
      const profile = r.profiles as unknown as { display_name: string | null } | null;
      return {
        id: r.id as string,
        userId: r.user_id as string,
        displayName: profile?.display_name ?? "Anonimowy",
        content: r.content as string,
        upvotes: (r.upvotes as number) ?? 0,
        hasUpvoted: false,
        isOwn: userId ? r.user_id === userId : false,
        createdAt: r.created_at as string,
      };
    });

    return { ok: true, comments, total: comments.length };
  } catch (e) {
    console.error("[loadDiscussion]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
