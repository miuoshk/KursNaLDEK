import { createClient } from "@/lib/supabase/server";

export type OsceSimulationHistoryRow = {
  id: string;
  examDay: number;
  completedAt: string;
  passedOverall: boolean;
  overallPercent: number;
  stationCount: number;
};

export type LoadOsceSimulationHistoryResult =
  | { ok: true; rows: OsceSimulationHistoryRow[] }
  | { ok: false; message: string };

export async function loadOsceSimulationHistory(): Promise<LoadOsceSimulationHistoryResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: true, rows: [] };
    }

    const { data, error } = await supabase
      .from("osce_simulations")
      .select("id, exam_day, completed_at, passed_overall, overall_percent, station_count")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[loadOsceSimulationHistory]", error.message);
      return {
        ok: false,
        message: "Nie udało się wczytać historii symulacji.",
      };
    }

    const rows: OsceSimulationHistoryRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      examDay: r.exam_day as number,
      completedAt: r.completed_at as string,
      passedOverall: r.passed_overall as boolean,
      overallPercent: Number(r.overall_percent),
      stationCount: r.station_count as number,
    }));

    return { ok: true, rows };
  } catch (e) {
    console.error("[loadOsceSimulationHistory]", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd.",
    };
  }
}
