export type ProcedureLogSnapshot = {
  id: string;
  procedure_id: string;
  performed_at: string;
  snap_margin_pct: number;
  snap_margin_pln: number;
  snap_price: number;
  procedures: { id: string; name: string; price: number } | null;
};

export type ProcedureMonthStats = {
  procedureId: string;
  procedureName: string;
  currentPrice: number;
  executionCount: number;
  avgMarginPct: number;
  totalMarginPln: number;
  prevExecutionCount: number | null;
  prevAvgMarginPct: number | null;
  prevTotalMarginPln: number | null;
  marginTrendPp: number | null;
  countTrend: number | null;
  totalMarginTrendPln: number | null;
};

export type MonthlyReportData = {
  yearMonth: string;
  prevYearMonth: string;
  rows: ProcedureMonthStats[];
  totalExecutions: number;
  hasAnyLogsEver: boolean;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [yearRaw, monthRaw] = yearMonth.split("-");
  return {
    year: Number(yearRaw),
    month: Number(monthRaw),
  };
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const { year, month } = parseYearMonth(yearMonth);
  const date = new Date(year, month - 1 + deltaMonths, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthDateRange(yearMonth: string): { start: string; end: string } {
  const { year, month } = parseYearMonth(yearMonth);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function isDateInYearMonth(dateIso: string, yearMonth: string): boolean {
  return dateIso.startsWith(yearMonth);
}

export function aggregateMonthlyReport(
  logs: ProcedureLogSnapshot[],
  procedures: Array<{ id: string; name: string; price: number }>,
  yearMonth: string,
): MonthlyReportData {
  const prevYearMonth = shiftYearMonth(yearMonth, -1);

  const procedureMeta = new Map(
    procedures.map((procedure) => [
      procedure.id,
      { name: procedure.name, price: Number(procedure.price) },
    ]),
  );

  const currentByProcedure = new Map<string, ProcedureLogSnapshot[]>();
  const prevByProcedure = new Map<string, ProcedureLogSnapshot[]>();

  for (const log of logs) {
    const bucket = isDateInYearMonth(log.performed_at, yearMonth)
      ? currentByProcedure
      : isDateInYearMonth(log.performed_at, prevYearMonth)
        ? prevByProcedure
        : null;

    if (!bucket) continue;
    const list = bucket.get(log.procedure_id) ?? [];
    list.push(log);
    bucket.set(log.procedure_id, list);
  }

  const procedureIds = new Set<string>([
    ...procedures.map((item) => item.id),
    ...currentByProcedure.keys(),
  ]);

  const rows: ProcedureMonthStats[] = [...procedureIds]
    .map((procedureId) => {
      const meta = procedureMeta.get(procedureId);
      const currentLogs = currentByProcedure.get(procedureId) ?? [];
      const prevLogs = prevByProcedure.get(procedureId) ?? [];

      const currentMargins = currentLogs.map((log) => Number(log.snap_margin_pct));
      const prevMargins = prevLogs.map((log) => Number(log.snap_margin_pct));
      const currentMarginPln = currentLogs.map((log) => Number(log.snap_margin_pln));
      const prevMarginPln = prevLogs.map((log) => Number(log.snap_margin_pln));

      const avgMarginPct = currentLogs.length > 0 ? round1(avg(currentMargins)) : 0;
      const prevAvgMarginPct = prevLogs.length > 0 ? round1(avg(prevMargins)) : null;
      const totalMarginPln = round2(sum(currentMarginPln));
      const prevTotalMarginPln = prevLogs.length > 0 ? round2(sum(prevMarginPln)) : null;

      return {
        procedureId,
        procedureName: meta?.name ?? currentLogs[0]?.procedures?.name ?? "Nieznana procedura",
        currentPrice: meta?.price ?? Number(currentLogs[0]?.snap_price ?? 0),
        executionCount: currentLogs.length,
        avgMarginPct,
        totalMarginPln,
        prevExecutionCount: prevLogs.length > 0 ? prevLogs.length : null,
        prevAvgMarginPct,
        prevTotalMarginPln,
        marginTrendPp:
          prevAvgMarginPct != null && currentLogs.length > 0
            ? round1(avgMarginPct - prevAvgMarginPct)
            : null,
        countTrend:
          prevLogs.length > 0 || currentLogs.length > 0
            ? currentLogs.length - prevLogs.length
            : null,
        totalMarginTrendPln:
          prevTotalMarginPln != null && currentLogs.length > 0
            ? round2(totalMarginPln - prevTotalMarginPln)
            : null,
      };
    })
    .filter((row) => row.executionCount > 0 || (row.prevExecutionCount ?? 0) > 0)
    .sort((a, b) => b.totalMarginPln - a.totalMarginPln || a.procedureName.localeCompare(b.procedureName, "pl"));

  const totalExecutions = rows.reduce((acc, row) => acc + row.executionCount, 0);

  return {
    yearMonth,
    prevYearMonth,
    rows: rows.filter((row) => row.executionCount > 0),
    totalExecutions,
    hasAnyLogsEver: logs.length > 0,
  };
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatYearMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}
