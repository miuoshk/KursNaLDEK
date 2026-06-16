"use server";

import { getTranslations } from "next-intl/server";
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

function resolvePublicDisplayName(
  profile: {
    display_name: string | null;
    nick: string | null;
  },
  anonymousLabel: string,
): string {
  const display = profile.display_name?.trim();
  if (display) return display;
  const nick = profile.nick?.trim();
  if (nick) return nick;
  return anonymousLabel;
}

export async function loadDiscussion(
  questionId: string,
): Promise<LoadDiscussionResult> {
  const t = await getTranslations("session");
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null;

    const { data: rows, error } = await supabase
      .from("question_discussions")
      .select("id, user_id, content, upvotes, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[loadDiscussion]", error.message);
      return { ok: false, message: t("errors.loadDiscussionFailed") };
    }

    const authorIds = [
      ...new Set((rows ?? []).map((r) => r.user_id as string).filter(Boolean)),
    ];

    const displayNames = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("public_profiles")
        .select("id, display_name, nick")
        .in("id", authorIds);

      if (profileError) {
        console.error("[loadDiscussion] public_profiles", profileError.message);
      } else {
        for (const profile of profiles ?? []) {
          displayNames.set(
            profile.id as string,
            resolvePublicDisplayName(
              {
                display_name: profile.display_name as string | null,
                nick: profile.nick as string | null,
              },
              t("discussionAnonymous"),
            ),
          );
        }
      }
    }

    const comments: DiscussionComment[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      userId: r.user_id as string,
      displayName: displayNames.get(r.user_id as string) ?? t("discussionAnonymous"),
      content: r.content as string,
      upvotes: (r.upvotes as number) ?? 0,
      hasUpvoted: false,
      isOwn: userId ? r.user_id === userId : false,
      createdAt: r.created_at as string,
    }));

    return { ok: true, comments, total: comments.length };
  } catch (e) {
    console.error("[loadDiscussion]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
