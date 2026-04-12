import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { buildKnnpSubjectsList } from "@/features/subjects/server/buildKnnpSubjectsList";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";

export type ProfileForSubjects = {
  current_year: number;
  track: string;
};

export type OverallProgressData = {
  answered: number;
  mastered: number;
  reviewing: number;
};

export type LoadKnnpSubjectsResult =
  | {
      ok: true;
      subjects: SubjectWithProgress[];
      profile: ProfileForSubjects;
      totalQuestionCount: number;
      overallProgress: OverallProgressData;
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

    // TODO: podpiąć Stripe — tymczasowo odblokowane dla wszystkich
    const isSubscribed = true;

    if (catalog.subjectRows.length === 0) {
      console.warn(
        "[loadKnnpSubjects] tabela subjects jest pusta dla product=knnp — uruchom seed SQL w Supabase.",
      );
      return {
        ok: true,
        subjects: [],
        profile,
        totalQuestionCount: 0,
        overallProgress: { answered: 0, mastered: 0, reviewing: 0 },
        isSubscribed,
      };
    }

    const topicToSubject = new Map<string, string>();
    for (const t of catalog.topicRows) {
      topicToSubject.set(t.id, t.subject_id);
    }
    const topicIds = catalog.topicRows.map((t) => t.id);

    const answeredPerSubject = new Map<string, Set<string>>();
    let overallMastered = 0;
    let overallAnswered = 0;

    if (topicIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, topic_id")
        .in("topic_id", topicIds)
        .eq("is_active", true);

      const questionToSubject = new Map<string, string>();
      for (const q of qRows ?? []) {
        const subjectId = topicToSubject.get(q.topic_id as string);
        if (subjectId) questionToSubject.set(q.id as string, subjectId);
      }

      const qids = (qRows ?? []).map((q) => q.id as string);
      if (qids.length > 0) {
        const { data: uqpRows } = await supabase
          .from("user_question_progress")
          .select("question_id, state, times_answered")
          .eq("user_id", user.id)
          .in("question_id", qids);

        for (const row of uqpRows ?? []) {
          if (Number(row.times_answered ?? 0) === 0) continue;

          const subjectId = questionToSubject.get(row.question_id as string);
          if (!subjectId) continue;

          if (!answeredPerSubject.has(subjectId)) answeredPerSubject.set(subjectId, new Set());
          answeredPerSubject.get(subjectId)!.add(row.question_id as string);

          overallAnswered += 1;
          if ((row.state as string) === "review") overallMastered += 1;
        }
      }
    }

    const subjectIds = catalog.subjectRows.map((s) => s.id);
    const lastStudiedPerSubject = new Map<string, string>();

    if (subjectIds.length > 0) {
      const { data: sessionRows } = await supabase
        .from("study_sessions")
        .select("subject_id, started_at")
        .eq("user_id", user.id)
        .in("subject_id", subjectIds)
        .order("started_at", { ascending: false });

      for (const row of sessionRows ?? []) {
        const sid = row.subject_id as string;
        if (!lastStudiedPerSubject.has(sid)) {
          lastStudiedPerSubject.set(sid, row.started_at as string);
        }
      }
    }

    const { subjects, totalQuestionCount } = buildKnnpSubjectsList(
      catalog,
      answeredPerSubject,
      lastStudiedPerSubject,
    );
    return {
      ok: true,
      subjects,
      profile,
      totalQuestionCount,
      overallProgress: {
        answered: overallAnswered,
        mastered: overallMastered,
        reviewing: overallAnswered - overallMastered,
      },
      isSubscribed,
    };
  } catch (e) {
    console.error("[loadKnnpSubjects] unexpected:", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
