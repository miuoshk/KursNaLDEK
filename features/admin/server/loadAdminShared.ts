import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Współdzielone, deduplikowane na poziomie żądania loadery dla panelu /admin.
 *
 * Używamy `createAdminClient` (service-role) zamiast klienta z cookies,
 * ponieważ:
 *   1) wszystkie te zapytania to globalne agregaty — nie potrzebujemy
 *      tożsamości użytkownika,
 *   2) klient service-role pozwala uniknąć kosztu odczytu sesji i ominąć
 *      potencjalne wąskie gardło policy RLS dla dużych skanów,
 *   3) router /admin jest już bramkowany przez `getAdminAccessContext`
 *      w layoutcie, więc tylko admin/moderator może w ogóle tu trafić.
 *
 * Wrapper `react.cache` daje deduplikację na poziomie pojedynczego żądania —
 * `loadAdminDashboard` i `loadAdminInvestor` mogą się dzielić wynikami
 * bez podwójnych skanów Supabase.
 */

const MS_DAY = 86400000;
const PAGE_SIZE = 1000;

type PaginatedResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/** Supabase/PostgREST zwraca domyślnie max 1000 wierszy — paginujemy do końca. */
async function fetchAllPaginated<T>(
  label: string,
  buildQuery: (from: number, to: number) => Promise<PaginatedResult<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error(`[loadAdminShared] ${label}`, error.message);
      break;
    }
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export type SharedSessionRow = {
  id: string;
  user_id: string | null;
  subject_id: string | null;
  mode: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  accuracy: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  is_completed: boolean | null;
};

export type SharedProfileRow = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  current_track: string | null;
  current_year: number | null;
  xp: number | null;
  current_streak: number | null;
  subscription_status: string | null;
  created_at: string | null;
};

export type SegmentProfileRow = {
  id: string;
  current_track: string | null;
  current_year: number | null;
};

/** Lekki odczyt profili pod wykres segmentów (kierunek × rok). */
export const getProfilesForSegments = cache(async (): Promise<SegmentProfileRow[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, current_track, current_year");
  if (error) {
    console.error("[loadAdminShared] segment profiles error", error.message);
    return [];
  }
  return (data ?? []) as SegmentProfileRow[];
});

export type SharedSubjectRow = {
  id: string;
  name: string | null;
  short_name: string | null;
  track: string | null;
  year: number | null;
};

export type SharedEntitlementRow = {
  user_id: string;
  track: string | null;
  year: number | null;
  access_type: string | null;
  active: boolean | null;
  granted_at: string | null;
};

export type SharedErrorReportRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  resolved_at: string | null;
};

/** Sesje z 90 dni — pokrywa wszystkie zakresy używane na pulpicie (7/14/30/90). */
export const getStudySessionsLast90d = cache(async (): Promise<SharedSessionRow[]> => {
  const admin = createAdminClient();
  const since90Iso = new Date(Date.now() - 90 * MS_DAY).toISOString();
  return fetchAllPaginated<SharedSessionRow>("study_sessions", async (from, to) =>
    admin
      .from("study_sessions")
      .select(
        "id, user_id, subject_id, mode, total_questions, correct_answers, accuracy, duration_seconds, started_at, completed_at, is_completed",
      )
      .gte("started_at", since90Iso)
      .order("started_at", { ascending: true })
      .range(from, to),
  );
});

/** Sesje z 30 dni — wystarczają dla KPI i analityki dashboardu. */
export const getStudySessionsLast30d = cache(async (): Promise<SharedSessionRow[]> => {
  const admin = createAdminClient();
  const since30Iso = new Date(Date.now() - 30 * MS_DAY).toISOString();
  return fetchAllPaginated<SharedSessionRow>("study_sessions_30d", async (from, to) =>
    admin
      .from("study_sessions")
      .select(
        "id, user_id, subject_id, mode, total_questions, correct_answers, accuracy, duration_seconds, started_at, completed_at, is_completed",
      )
      .gte("started_at", since30Iso)
      .order("started_at", { ascending: true })
      .range(from, to),
  );
});

export const getTotalUsersCount = cache(async (): Promise<number> => {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("[loadAdminShared] profiles count", error.message);
    return 0;
  }
  return count ?? 0;
});

export const getPaidUsersCount = cache(async (): Promise<number> => {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("subscription_status", "active");
  if (error) {
    console.error("[loadAdminShared] paid profiles count", error.message);
    return 0;
  }
  return count ?? 0;
});

export const getNewRegistrationsCountSince = cache(
  async (sinceIso: string): Promise<number> => {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso);
    if (error) {
      console.error("[loadAdminShared] registrations count", error.message);
      return 0;
    }
    return count ?? 0;
  },
);

export const getPendingReportsCount = cache(async (): Promise<number> => {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("error_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) {
    console.error("[loadAdminShared] pending reports count", error.message);
    return 0;
  }
  return count ?? 0;
});

/** Liczba faktycznych odpowiedzi (session_answers) od podanej daty. */
export const getSessionAnswersCountSince = cache(
  async (sinceIso: string): Promise<number> => {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("session_answers")
      .select("id", { count: "exact", head: true })
      .gte("answered_at", sinceIso);
    if (error) {
      console.error("[loadAdminShared] session_answers count", error.message);
      return 0;
    }
    return count ?? 0;
  },
);

export const getAllProfiles = cache(async (): Promise<SharedProfileRow[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, display_name, full_name, current_track, current_year, xp, current_streak, subscription_status, created_at",
    );
  if (error) {
    console.error("[loadAdminShared] profiles error", error.message);
    return [];
  }
  return (data ?? []) as SharedProfileRow[];
});

export const getAllSubjects = cache(async (): Promise<SharedSubjectRow[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subjects")
    .select("id, name, short_name, track, year");
  if (error) {
    console.error("[loadAdminShared] subjects error", error.message);
    return [];
  }
  return (data ?? []) as SharedSubjectRow[];
});

export const getAllEntitlements = cache(async (): Promise<SharedEntitlementRow[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_year_entitlements")
    .select("user_id, track, year, access_type, active, granted_at");
  if (error) {
    console.error("[loadAdminShared] entitlements error", error.message);
    return [];
  }
  return (data ?? []) as SharedEntitlementRow[];
});

export const getAllErrorReports = cache(async (): Promise<SharedErrorReportRow[]> => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("error_reports")
    .select("id, status, created_at, resolved_at");
  if (error) {
    console.error("[loadAdminShared] error_reports error", error.message);
    return [];
  }
  return (data ?? []) as SharedErrorReportRow[];
});

/** Liczniki dla KPI „totalQuestions” — head-only, więc szybkie. */
export const getTotalQuestionsCount = cache(async (): Promise<number> => {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error("[loadAdminShared] questions count error", error.message);
    return 0;
  }
  return count ?? 0;
});

/**
 * Zagregowane metryki sesji liczone po stronie bazy (funkcja RPC
 * `admin_dashboard_session_aggregates`). Jeden round-trip + jeden skan
 * `study_sessions` z 30 dni zamiast ~73 stronicowanych zapytań i agregacji
 * w JS. Kubełki kalendarzowe (godzina / dzień tygodnia / dzień) liczone w
 * strefie Europe/Warsaw — spójnie z resztą aplikacji.
 */
export type AggUserStat = {
  userId: string;
  sessions30: number;
  sessions7: number;
  sessionsPrev7: number;
  completedTests30: number;
  questions30: number;
  durationSec30: number;
  accSum30: number;
  testSessions30: number;
  testDurationSec30: number;
};

export type AggHourBucket = {
  hour: number;
  sessions: number;
  questions: number;
  accSum: number;
};

export type AggDowBucket = {
  dow: number;
  sessions: number;
  questions: number;
  accSum: number;
};

export type AggHeatCell = { dow: number; hour: number; sessions: number };

export type AggSubjectBucket = {
  subjectId: string;
  sessions: number;
  questions: number;
  accSum: number;
};

export type AggModeBucket = {
  mode: string;
  sessions: number;
  accSum: number;
  durationSec: number;
};

export type AggDailyPoint = {
  day: string;
  sessions: number;
  users: number;
  questions: number;
  durationSec: number;
  accSum: number;
};

export type DashboardSessionAggregates = {
  generatedAt: string;
  sessionsToday: number;
  sessions7d: number;
  sessions30d: number;
  sessionsPrev7d: number;
  durationSec7d: number;
  durationSec30d: number;
  durationSecPrev7d: number;
  accSum7d: number;
  accSum30d: number;
  completedTests7d: number;
  answers7d: number;
  answers14d: number;
  answers30d: number;
  perUser: AggUserStat[];
  hour: AggHourBucket[];
  dow: AggDowBucket[];
  heatmap: AggHeatCell[];
  subject: AggSubjectBucket[];
  mode7d: AggModeBucket[];
  dailyTrend14d: AggDailyPoint[];
};

const EMPTY_AGGREGATES: DashboardSessionAggregates = {
  generatedAt: new Date(0).toISOString(),
  sessionsToday: 0,
  sessions7d: 0,
  sessions30d: 0,
  sessionsPrev7d: 0,
  durationSec7d: 0,
  durationSec30d: 0,
  durationSecPrev7d: 0,
  accSum7d: 0,
  accSum30d: 0,
  completedTests7d: 0,
  answers7d: 0,
  answers14d: 0,
  answers30d: 0,
  perUser: [],
  hour: [],
  dow: [],
  heatmap: [],
  subject: [],
  mode7d: [],
  dailyTrend14d: [],
};

export const getDashboardSessionAggregates = cache(
  async (): Promise<DashboardSessionAggregates> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_dashboard_session_aggregates");
    if (error) {
      console.error("[loadAdminShared] dashboard aggregates", error.message);
      return EMPTY_AGGREGATES;
    }
    if (!data) return EMPTY_AGGREGATES;
    return data as unknown as DashboardSessionAggregates;
  },
);
