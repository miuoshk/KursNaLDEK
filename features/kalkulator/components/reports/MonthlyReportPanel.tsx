"use client";

import Link from "next/link";
import { DecisionRecommendationList } from "@/features/kalkulator/components/reports/DecisionRecommendationList";
import { ProcedureReportTable } from "@/features/kalkulator/components/reports/ProcedureReportTable";
import {
  wizardInputClassName,
  wizardLabelClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";
import { useMonthlyReport } from "@/features/kalkulator/hooks/useMonthlyReport";
import { formatYearMonthLabel } from "@/features/kalkulator/lib/aggregateMonthlyReport";
import {
  buildMonthlyReportCsv,
  downloadCsv,
  printMonthlyReportPdf,
} from "@/features/kalkulator/lib/exportMonthlyReport";
import type { Practice } from "@/features/kalkulator/types/practice";
import type { ProcedureWithMaterials } from "@/features/kalkulator/types/procedure";

type Props = {
  practice: Practice;
  procedures: ProcedureWithMaterials[];
};

export function MonthlyReportPanel({ practice, procedures }: Props) {
  const procedureMeta = procedures.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
  }));

  const { yearMonth, setYearMonth, report, recommendations, loading, error } = useMonthlyReport(
    practice.id,
    procedureMeta,
  );

  if (loading) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">Wczytywanie raportu…</p>
    );
  }

  if (error) {
    return (
      <p className="font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
        {error}
      </p>
    );
  }

  if (!report.hasAnyLogsEver) {
    return (
      <div className="rounded-[var(--k-radius-card)] border border-dashed border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-8 text-center">
        <p className="font-body text-sm text-[color:var(--k-muted)]">
          Zaloguj pierwsze wykonanie, żeby zobaczyć realne marże.
        </p>
        <Link
          href="/kalkulator"
          className="mt-4 inline-block rounded-[var(--k-radius-btn)] bg-[color:var(--k-accent)] px-4 py-2 font-body text-sm font-semibold text-[color:var(--k-text)]"
        >
          Przejdź do logowania wykonania
        </Link>
      </div>
    );
  }

  const periodLabel = formatYearMonthLabel(yearMonth);

  function handleExportCsv() {
    const csv = buildMonthlyReportCsv(report, recommendations);
    downloadCsv(`raport-${practice.name}-${yearMonth}.csv`, csv);
  }

  function handleExportPdf() {
    printMonthlyReportPdf(practice.name, report, recommendations);
  }

  return (
    <div className="space-y-6">
      <p className="font-body text-xs text-[color:var(--k-muted)] md:hidden">
        Pełne raporty i eksport CSV/PDF — wygodniej na większym ekranie.
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <h2 className="font-heading text-xl text-[color:var(--k-primary)]">Raport miesięczny</h2>
          <p className="mt-1 font-body text-sm text-[color:var(--k-muted)]">
            {periodLabel} · porównanie z poprzednim miesiącem
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="report-month" className={wizardLabelClassName}>
              Miesiąc
            </label>
            <input
              id="report-month"
              type="month"
              value={yearMonth}
              onChange={(event) => setYearMonth(event.target.value)}
              className={wizardInputClassName}
            />
          </div>
          <button type="button" onClick={handleExportCsv} className={wizardSecondaryButtonClassName}>
            Eksport CSV
          </button>
          <button type="button" onClick={handleExportPdf} className={wizardSecondaryButtonClassName}>
            Eksport PDF
          </button>
        </div>
      </div>

      {report.totalExecutions === 0 ? (
        <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-6">
          <p className="font-body text-sm text-[color:var(--k-muted)]">
            Brak wykonań w {periodLabel.toLowerCase()}. Wybierz inny miesiąc albo zaloguj wizytę.
          </p>
        </div>
      ) : (
        <>
          <ProcedureReportTable rows={report.rows} />
          <DecisionRecommendationList recommendations={recommendations} />
        </>
      )}
    </div>
  );
}
