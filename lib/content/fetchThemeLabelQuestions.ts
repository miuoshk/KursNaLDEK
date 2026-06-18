import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";
import { fetchVisibleTopicIds } from "@/features/session/server/questionSelection";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import type { QuestionTopicRow } from "@/lib/content/fetchActiveQuestionsForTopics";

const PAGE_SIZE = 1000;

/** Aktywne pytania przedmiotu z danym `theme_label` (bez zmiany `topic_id`). */
export async function fetchActiveQuestionsForThemeLabel(
  supabase: SupabaseClient,
  contentSubjectId: string,
  themeLabel: string,
  track?: StudyTrack,
): Promise<QuestionTopicRow[]> {
  const topicIds = await fetchVisibleTopicIds(
    supabase,
    getSubjectScopeIds(contentSubjectId),
    track,
  );
  if (topicIds.length === 0) return [];

  const all: QuestionTopicRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("questions")
      .select("id, topic_id")
      .in("topic_id", topicIds)
      .eq("theme_label", themeLabel)
      .eq("is_active", true)
      .range(from, from + PAGE_SIZE - 1);

    if (track) {
      query = query.or(questionTracksOrFilter(track));
    }

    const { data, error } = await query;
    if (error) {
      console.error("[fetchActiveQuestionsForThemeLabel]", error.message);
      break;
    }

    const batch = (data ?? []) as QuestionTopicRow[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function fetchThemeLabelQuestionIds(
  supabase: SupabaseClient,
  contentSubjectId: string,
  themeLabel: string,
  track?: StudyTrack,
): Promise<string[]> {
  const rows = await fetchActiveQuestionsForThemeLabel(
    supabase,
    contentSubjectId,
    themeLabel,
    track,
  );
  return rows.map((row) => row.id);
}
