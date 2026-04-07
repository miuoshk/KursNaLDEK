import type { OsceStation } from "@/features/osce/types";
import { createClient } from "@/lib/supabase/server";

export async function loadOsceSimulationStations(
  examDay: 1 | 2,
): Promise<OsceStation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, short_name, display_order, exam_day, exam_tasks, product")
    .eq("product", "osce")
    .eq("exam_day", examDay)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[loadOsceSimulationStations]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    short_name: row.short_name as string,
    display_order: (row.display_order as number) ?? 0,
    exam_day: (row.exam_day as number | null) ?? null,
    exam_tasks: (row.exam_tasks as string | null) ?? null,
  }));
}
