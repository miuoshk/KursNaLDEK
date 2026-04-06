import { createClient } from "@/lib/supabase/server";
import type { SubjectWithProgress } from "@/features/subjects/types";

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

    let profile: ProfileForSubjects = { ...DEFAULT_PROFILE };

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("current_year, track")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[loadKnnpSubjects] profiles (kontynuuję z domyślnym profilem):",
        profileError.message,
        profileError.code,
        profileError.details,
      );
    } else if (profileRow) {
      profile = {
        current_year: profileRow.current_year ?? 1,
        track: formatTrackLabel(profileRow.track ?? "stomatologia"),
      };
    } else {
      console.warn(
        "[loadKnnpSubjects] brak wiersza profiles dla użytkownika — używam domyślnych wartości (trigger mógł nie zadziałać)",
        user.id,
      );
    }

    const { data: subjectRows, error: subjectsError } = await supabase
      .from("subjects")
      .select(
        "id, name, short_name, icon_name, year, track, product, display_order",
      )
      .eq("product", "knnp")
      .order("display_order", { ascending: true });

    if (subjectsError) {
      console.error("[loadKnnpSubjects] subjects:", subjectsError.message, subjectsError);
      return {
        ok: false,
        message: "Nie udało się wczytać przedmiotów. Spróbuj ponownie później.",
      };
    }

    const subjectIds = (subjectRows ?? []).map((s) => s.id);
    if (subjectIds.length === 0) {
      console.warn(
        "[loadKnnpSubjects] tabela subjects jest pusta dla product=knnp — uruchom seed SQL w Supabase.",
      );
      return { ok: true, subjects: [], profile, totalQuestionCount: 0 };
    }

    const { data: topicRows, error: topicsError } = await supabase
      .from("topics")
      .select("subject_id, question_count")
      .in("subject_id", subjectIds);

    if (topicsError) {
      console.error("[loadKnnpSubjects] topics:", topicsError.message, topicsError);
      return {
        ok: false,
        message: "Nie udało się wczytać działów. Spróbuj ponownie później.",
      };
    }

    const agg = new Map<string, { topicCount: number; questionSum: number }>();
    for (const row of topicRows ?? []) {
      const sid = row.subject_id as string;
      const cur = agg.get(sid) ?? { topicCount: 0, questionSum: 0 };
      cur.topicCount += 1;
      cur.questionSum += Number(row.question_count ?? 0);
      agg.set(sid, cur);
    }

    let totalQuestionCount = 0;
    const subjects: SubjectWithProgress[] = (subjectRows ?? []).map((row) => {
      const a = agg.get(row.id);
      const questionCount = a?.questionSum ?? 0;
      const topicCount = a?.topicCount ?? 0;
      totalQuestionCount += questionCount;

      return {
        id: row.id,
        name: row.name,
        short_name: row.short_name,
        icon_name: row.icon_name,
        year: row.year,
        track: row.track,
        product: row.product,
        display_order: row.display_order,
        question_count: questionCount,
        topic_count: topicCount,
        mastery_percentage: 0,
        last_studied_at: null,
        due_reviews: 0,
      };
    });

    return { ok: true, subjects, profile, totalQuestionCount };
  } catch (e) {
    console.error("[loadKnnpSubjects] unexpected:", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
