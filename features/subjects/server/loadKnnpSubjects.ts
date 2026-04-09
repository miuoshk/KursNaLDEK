import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { buildKnnpSubjectsList } from "@/features/subjects/server/buildKnnpSubjectsList";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";

export type ProfileForSubjects = {
  current_year: number;
  track: string;
};

export type LoadKnnpSubjectsResult =
  | {
      ok: true;
      subjects: SubjectWithProgress[];
      profile: ProfileForSubjects;
      totalQuestionCount: number;
      isSubscribed: boolean;
    }
  | { ok: false; message: string };

const DEFAULT_PROFILE: ProfileForSubjects = {
  current_year: 1,
  track: "Stomatologia",
};

function formatTrackLabel(track: string): string {
  if (!track) return DEFAULT_PROFILE.track;
  return track.charAt(0).toUpperCase() + track.slice(1);
}

export async function loadKnnpSubjectsData(): Promise<LoadKnnpSubjectsResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[loadKnnpSubjects] auth.getUser:", userError.message, userError);
      return { ok: false, message: "Brak aktywnej sesji. Zaloguj się ponownie." };
    }
    if (!user) {
      return { ok: false, message: "Brak aktywnej sesji. Zaloguj się ponownie." };
    }

    const profileRow = await getProfileByUserId(user.id);
    const track = profileRow?.current_track ?? "stomatologia";

    const currentYear = profileRow?.current_year ?? 1;
    const catalog = await getCachedKnnpCatalog(track, currentYear);

    let profile: ProfileForSubjects = { ...DEFAULT_PROFILE };
    if (profileRow) {
      profile = {
        current_year: profileRow.current_year ?? 1,
        track: formatTrackLabel(track),
      };
    } else {
      console.warn(
        "[loadKnnpSubjects] brak wiersza profiles dla użytkownika — używam domyślnych wartości (trigger mógł nie zadziałać)",
        user.id,
      );
    }

    const isSubscribed =
      profileRow?.subscription_status === "active" ||
      profileRow?.subscription_status === "trialing";

    if (catalog.subjectRows.length === 0) {
      console.warn(
        "[loadKnnpSubjects] tabela subjects jest pusta dla product=knnp — uruchom seed SQL w Supabase.",
      );
      return { ok: true, subjects: [], profile, totalQuestionCount: 0, isSubscribed };
    }

    const { data: progressRows } = await supabase
      .from("session_answers")
      .select("question_id, questions!inner(topic_id, topics!inner(subject_id))")
      .eq("is_correct", true)
      .in(
        "session_id",
        (await supabase.from("study_sessions").select("id").eq("user_id", user.id)).data?.map(
          (r) => r.id,
        ) ?? [],
      );

    const answeredPerSubject = new Map<string, Set<string>>();
    for (const row of progressRows ?? []) {
      const q = row.questions as unknown as { topic_id: string; topics: { subject_id: string } } | null;
      const subjectId = q?.topics?.subject_id;
      if (!subjectId) continue;
      if (!answeredPerSubject.has(subjectId)) answeredPerSubject.set(subjectId, new Set());
      answeredPerSubject.get(subjectId)!.add(row.question_id);
    }

    const { subjects, totalQuestionCount } = buildKnnpSubjectsList(catalog, answeredPerSubject);
    return { ok: true, subjects, profile, totalQuestionCount, isSubscribed };
  } catch (e) {
    console.error("[loadKnnpSubjects] unexpected:", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
