"use server";

import { z } from "zod";
import { OSCE_SIM_PASS_THRESHOLD } from "@/features/osce/constants/osceSimulation";
import { createClient } from "@/lib/supabase/server";

const stationResultSchema = z.object({
  stationId: z.string().min(1),
  stationOrder: z.number().int().min(0),
  correctCount: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
});

const schema = z.object({
  examDay: z.union([z.literal(1), z.literal(2)]),
  stationResults: z.array(stationResultSchema).min(1),
});

export type SaveOsceSimulationResult =
  | { ok: true; simulationId: string }
  | { ok: false; message: string };

function stationPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return correct / total;
}

export async function saveOsceSimulationComplete(
  raw: z.infer<typeof schema>,
): Promise<SaveOsceSimulationResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane symulacji." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Brak sesji logowania." };
    }

    const { examDay, stationResults } = parsed.data;

    const enriched = stationResults.map((r) => {
      const pct = stationPercent(r.correctCount, r.totalQuestions);
      return {
        ...r,
        percent: pct * 100,
        passed: pct >= OSCE_SIM_PASS_THRESHOLD,
      };
    });

    const passedOverall = enriched.every((r) => r.passed);
    const overallPercent =
      enriched.length > 0
        ? Math.round(
            enriched.reduce((s, r) => s + r.percent, 0) / enriched.length,
          )
        : 0;

    const { data: sim, error: simErr } = await supabase
      .from("osce_simulations")
      .insert({
        user_id: user.id,
        exam_day: examDay,
        completed_at: new Date().toISOString(),
        passed_overall: passedOverall,
        overall_percent: overallPercent,
        station_count: enriched.length,
      })
      .select("id")
      .single();

    if (simErr || !sim?.id) {
      console.error("[saveOsceSimulationComplete] insert", simErr?.message);
      return { ok: false, message: "Nie udało się zapisać symulacji." };
    }

    const simulationId = sim.id as string;

    const rows = enriched.map((r) => ({
      simulation_id: simulationId,
      station_id: r.stationId,
      station_order: r.stationOrder,
      correct_count: r.correctCount,
      total_questions: r.totalQuestions,
      percent: r.percent,
      passed: r.passed,
      duration_seconds: r.durationSeconds,
    }));

    const { error: resErr } = await supabase.from("osce_station_results").insert(rows);

    if (resErr) {
      console.error("[saveOsceSimulationComplete] station results", resErr.message);
      await supabase.from("osce_simulations").delete().eq("id", simulationId);
      return { ok: false, message: "Nie udało się zapisać wyników stacji." };
    }

    return { ok: true, simulationId };
  } catch (e) {
    console.error("[saveOsceSimulationComplete]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
