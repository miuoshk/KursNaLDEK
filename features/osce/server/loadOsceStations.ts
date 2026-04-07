import { createClient } from "@/lib/supabase/server";
import type { OsceStation } from "@/features/osce/types";

export type LoadOsceStationsResult =
  | { ok: true; stations: OsceStation[] }
  | { ok: false; message: string };

export async function loadOsceStations(): Promise<LoadOsceStationsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, short_name, display_order, exam_day, exam_tasks, product")
      .eq("product", "osce")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[loadOsceStations]", error.message, error.code, error.details);
      return {
        ok: false,
        message: "Nie udało się wczytać stacji OSCE. Spróbuj ponownie później.",
      };
    }

    const stations: OsceStation[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      short_name: row.short_name as string,
      display_order: (row.display_order as number) ?? 0,
      exam_day: (row.exam_day as number | null) ?? null,
      exam_tasks: (row.exam_tasks as string | null) ?? null,
    }));

    return { ok: true, stations };
  } catch (e) {
    console.error("[loadOsceStations] unexpected", e);
    return {
      ok: false,
      message: "Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj później.",
    };
  }
}
