"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  aggregateMonthlyReport,
  currentYearMonth,
  monthDateRange,
  shiftYearMonth,
  type MonthlyReportData,
  type ProcedureLogSnapshot,
} from "@/features/kalkulator/lib/aggregateMonthlyReport";
import { buildDecisionRecommendation } from "@/features/kalkulator/lib/buildDecisionRecommendation";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";

export function useMonthlyReport(practiceId: string, procedures: Array<{ id: string; name: string; price: number }>) {
  const supabase = useMemo(() => createKalkulatorClient(), []);
  const [yearMonth, setYearMonth] = useState(currentYearMonth);
  const [logs, setLogs] = useState<ProcedureLogSnapshot[]>([]);
  const [hasAnyLogsEver, setHasAnyLogsEver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const prevMonth = shiftYearMonth(yearMonth, -1);
    const currentRange = monthDateRange(yearMonth);
    const prevRange = monthDateRange(prevMonth);

    const [logsRes, countRes] = await Promise.all([
      supabase
        .from("procedure_logs")
        .select(
          `
        id,
        procedure_id,
        performed_at,
        snap_margin_pct,
        snap_margin_pln,
        snap_price,
        procedures ( id, name, price )
      `,
        )
        .eq("practice_id", practiceId)
        .gte("performed_at", prevRange.start)
        .lte("performed_at", currentRange.end)
        .order("performed_at", { ascending: false }),
      supabase
        .from("procedure_logs")
        .select("id", { count: "exact", head: true })
        .eq("practice_id", practiceId),
    ]);

    if (logsRes.error) {
      setError("Nie udało się wczytać raportu.");
      setLogs([]);
    } else {
      const normalized = (logsRes.data ?? []).map((row) => {
        const related = row.procedures as
          | { id: string; name: string; price: number }
          | { id: string; name: string; price: number }[]
          | null;
        const procedure = Array.isArray(related) ? related[0] ?? null : related;

        return {
          id: row.id as string,
          procedure_id: row.procedure_id as string,
          performed_at: row.performed_at as string,
          snap_margin_pct: Number(row.snap_margin_pct),
          snap_margin_pln: Number(row.snap_margin_pln),
          snap_price: Number(row.snap_price),
          procedures: procedure,
        } satisfies ProcedureLogSnapshot;
      });

      setLogs(normalized);
    }

    setHasAnyLogsEver((countRes.count ?? 0) > 0);

    setLoading(false);
  }, [practiceId, supabase, yearMonth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const report: MonthlyReportData = useMemo(() => {
    const aggregated = aggregateMonthlyReport(logs, procedures, yearMonth);
    return { ...aggregated, hasAnyLogsEver };
  }, [hasAnyLogsEver, logs, procedures, yearMonth]);

  const recommendations = useMemo(
    () =>
      report.rows
        .map((row) =>
          buildDecisionRecommendation({
            procedureId: row.procedureId,
            procedureName: row.procedureName,
            avgMarginPct: row.avgMarginPct,
            currentPrice: row.currentPrice,
          }),
        )
        .filter((item): item is NonNullable<typeof item> => item != null),
    [report.rows],
  );

  return {
    yearMonth,
    setYearMonth,
    report,
    recommendations,
    loading,
    error,
    reload,
  };
}
