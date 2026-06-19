import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { buildKnnpSubjectsList } from "@/features/subjects/server/buildKnnpSubjectsList";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getCachedKnnpCatalog } from "@/features/shared/server/knnpCatalogCache";
import { getTrackShellsForContentSubject } from "@/features/session/server/sharedSubjects";
import { hasActiveEntitlementForSelection } from "@/features/access/server/entitlements";
import { normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";

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
  return track === "lekarski" ? "Lekarski" : "Stomatologia";
}

export async function loadKnnpSubjectsData(): Promise<LoadKnnpSubjectsResult> {
  try {
    const supabase = await createClient();

    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, message: "Brak aktywnej sesji. Zaloguj się ponownie." };
    }

    const profileRow = await getProfileByUserId(user.id);
    const track = normalizeTrack(profileRow?.current_track);
    const currentYear = normalizeYear(profileRow?.current_year);
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

    const isSubscribed = await hasActiveEntitlementForSelection(user.id, track, currentYear);

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
    const subjectIds = catalog.subjectRows.map((s) => s.id);

    // Agregacja po stronie bazy: jedno zapytanie zlicza aktywne pytania per
    // topic, drugie liczy due/answered/mastered per topic dla usera —
    // zamiast pobierania wszystkich ID pytań do Node i pętli COUNT po 200.
    const [activeCountRes, statsRes, sessionsRes] = await Promise.all([
      topicIds.length > 0
        ? supabase.rpc("active_question_count_by_topic", {
            p_topic_ids: topicIds,
            p_track: track,
          })
        : Promise.resolve({ data: [], error: null }),
      topicIds.length > 0
        ? supabase.rpc("topic_progress_stats", {
            p_user_id: user.id,
            p_topic_ids: topicIds,
            p_track: track,
          })
        : Promise.resolve({ data: [], error: null }),
      subjectIds.length > 0
        ? supabase
            .from("study_sessions")
            .select("subject_id, started_at")
            .eq("user_id", user.id)
            .in("subject_id", subjectIds)
            .order("started_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (activeCountRes.error) {
      console.error("[loadKnnpSubjects] active counts:", activeCountRes.error.message);
    }
    if (statsRes.error) {
      console.error("[loadKnnpSubjects] topic stats:", statsRes.error.message);
    }

    const visibleCountByTopic = new Map<string, number>();
    for (const row of (activeCountRes.data ?? []) as { topic_id: string; cnt: number }[]) {
      visibleCountByTopic.set(row.topic_id, row.cnt ?? 0);
    }

    // answeredPerSubject trzyma liczbę odpowiedzianych pytań per powłoka
    // (każde pytanie należy do jednego topiku, więc suma po topikach = unikaty).
    const answeredPerSubject = new Map<string, number>();
    const dueReviewsPerSubject = new Map<string, number>();
    let overallMastered = 0;
    let overallAnswered = 0;

    for (const row of (statsRes.data ?? []) as {
      topic_id: string;
      due: number;
      answered: number;
      mastered: number;
    }[]) {
      overallAnswered += row.answered ?? 0;
      overallMastered += row.mastered ?? 0;

      const contentSubjectId = topicToSubject.get(row.topic_id);
      if (!contentSubjectId) continue;

      for (const shellId of getTrackShellsForContentSubject(contentSubjectId)) {
        if (row.answered) {
          answeredPerSubject.set(
            shellId,
            (answeredPerSubject.get(shellId) ?? 0) + row.answered,
          );
        }
        if (row.due) {
          dueReviewsPerSubject.set(
            shellId,
            (dueReviewsPerSubject.get(shellId) ?? 0) + row.due,
          );
        }
      }
    }

    const lastStudiedPerSubject = new Map<string, string>();
    for (const row of (sessionsRes.data ?? []) as {
      subject_id: string;
      started_at: string;
    }[]) {
      const sid = row.subject_id;
      if (!lastStudiedPerSubject.has(sid)) {
        lastStudiedPerSubject.set(sid, row.started_at);
      }
    }

    const catalogForCounts = {
      ...catalog,
      topicRows: catalog.topicRows.map((t) => ({
        ...t,
        question_count: visibleCountByTopic.get(t.id) ?? 0,
      })),
    };

    const { subjects, totalQuestionCount } = buildKnnpSubjectsList(
      catalogForCounts,
      answeredPerSubject,
      lastStudiedPerSubject,
      dueReviewsPerSubject,
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
