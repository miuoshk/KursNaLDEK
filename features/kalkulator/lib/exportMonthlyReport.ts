import type { MonthlyReportData, ProcedureMonthStats } from "@/features/kalkulator/lib/aggregateMonthlyReport";
import { formatYearMonthLabel } from "@/features/kalkulator/lib/aggregateMonthlyReport";
import type { DecisionRecommendation } from "@/features/kalkulator/lib/buildDecisionRecommendation";

function escapeCsv(value: string | number): string {
  const text = String(value);
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatTrend(value: number | null, suffix: string): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
}

export function buildMonthlyReportCsv(
  report: MonthlyReportData,
  recommendations: DecisionRecommendation[],
): string {
  const header = [
    "Procedura",
    "Liczba wykonań",
    "Średnia marża %",
    "Suma marży PLN",
    "Trend marża (pp)",
    "Trend wykonań",
    "Rekomendacja",
  ];

  const recById = new Map(recommendations.map((item) => [item.procedureId, item.message]));

  const lines = report.rows.map((row: ProcedureMonthStats) =>
    [
      row.procedureName,
      row.executionCount,
      row.avgMarginPct,
      row.totalMarginPln,
      formatTrend(row.marginTrendPp, ""),
      formatTrend(row.countTrend, ""),
      recById.get(row.procedureId) ?? "",
    ]
      .map(escapeCsv)
      .join(";"),
  );

  return `\uFEFF${header.join(";")}\n${lines.join("\n")}`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printMonthlyReportPdf(
  practiceName: string,
  report: MonthlyReportData,
  recommendations: DecisionRecommendation[],
) {
  const recById = new Map(recommendations.map((item) => [item.procedureId, item.message]));
  const period = formatYearMonthLabel(report.yearMonth);

  const rowsHtml = report.rows
    .map(
      (row) => `
      <tr>
        <td>${row.procedureName}</td>
        <td>${row.executionCount}</td>
        <td>${row.avgMarginPct}%</td>
        <td>${row.totalMarginPln.toLocaleString("pl-PL")} PLN</td>
        <td>${formatTrend(row.marginTrendPp, " pp")}</td>
        <td>${formatTrend(row.countTrend, "")}</td>
      </tr>
      ${
        recById.get(row.procedureId)
          ? `<tr><td colspan="6" style="font-size:12px;color:#1B4332;padding-top:0">${recById.get(row.procedureId)}</td></tr>`
          : ""
      }`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Raport ${period} — ${practiceName}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1a1a1a; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p { color: #6b7280; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #6b7280; }
    td:nth-child(n+2) { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <h1>Raport miesięczny — ${practiceName}</h1>
  <p>${period} · kursnaldek.pl/kalkulator</p>
  <table>
    <thead>
      <tr>
        <th>Procedura</th>
        <th>Wykonania</th>
        <th>Śr. marża</th>
        <th>Suma marży</th>
        <th>Trend marża</th>
        <th>Trend wyk.</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
