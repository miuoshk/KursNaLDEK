import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyTrack } from "@/features/access/lib/studyAccess";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";
import { isVirtualThemeTopicId } from "@/lib/content/virtualThemeTopics";
import { isFinalExamTopicId } from "@/lib/content/finalExamTopics";
import { questionTracksOrFilter } from "@/lib/content/topicTrackVisibility";
import type { QuestionTopicRow } from "@/lib/content/fetchActiveQuestionsForTopics";

const PAGE_SIZE = 1000;

/** Wszystkie działy treści (także track-only, np. FARM-19), bez cieni rocznikowych. */
async function fetchContentTopicIds(
  supabase: SupabaseClient,
  contentSubjectId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id")
    .in("subject_id", getSubjectScopeIds(contentSubjectId));
  if (error) {
    console.error("[fetchActiveQuestionsForThemeLabel] topics", error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => row.id as string)
    .filter((id) => !isVirtualThemeTopicId(id) && !isFinalExamTopicId(id));
}

/** Aktywne pytania przedmiotu z danym `theme_label` (bez zmiany `topic_id`). */
export async function fetchActiveQuestionsForThemeLabel(
  supabase: SupabaseClient,
  contentSubjectId: string,
  themeLabel: string,
  track?: StudyTrack,
  topicIdsOverride?: string[],
): Promise<QuestionTopicRow[]> {
  const topicIds =
    topicIdsOverride && topicIdsOverride.length > 0
      ? topicIdsOverride
      : await fetchContentTopicIds(supabase, contentSubjectId);
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
