"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MaterialCatalogPanel } from "@/features/kalkulator/components/dashboard/MaterialCatalogPanel";
import { ProcedureEditor } from "@/features/kalkulator/components/dashboard/ProcedureEditor";
import { ProcedureList } from "@/features/kalkulator/components/dashboard/ProcedureList";
import { KalkulatorLogPanel } from "@/features/kalkulator/components/log/KalkulatorLogPanel";
import { ProductTourCallout } from "@/features/kalkulator/components/onboarding/ProductTourCallout";
import { MonthlyReportPanel } from "@/features/kalkulator/components/reports/MonthlyReportPanel";
import { PRODUCT_TOUR_STEPS, type ProductTourTab } from "@/features/kalkulator/data/productTour";
import { usePracticeDashboard } from "@/features/kalkulator/hooks/usePracticeDashboard";
import { useProductTour } from "@/features/kalkulator/hooks/useProductTour";
import type { Practice } from "@/features/kalkulator/types/practice";

type Tab = ProductTourTab;

type Props = {
  practice: Practice;
};

export function KalkulatorDashboard({ practice }: Props) {
  const { procedures, materials, loading, error, reload } = usePracticeDashboard(practice.id);
  const [tab, setTab] = useState<Tab>("log");
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  const tour = useProductTour(!loading && !error);

  useEffect(() => {
    if (!tour.active) return;
    const step = PRODUCT_TOUR_STEPS[tour.stepIndex];
    if (step) setTab(step.tab);
  }, [tour.active, tour.stepIndex]);

  const selectedProcedure = useMemo(
    () => procedures.find((item) => item.id === selectedProcedureId) ?? null,
    [procedures, selectedProcedureId],
  );

  const editorOpen = creatingProcedure || selectedProcedureId != null;

  function openCreateProcedure() {
    setCreatingProcedure(true);
    setSelectedProcedureId(null);
    setTab("procedures");
  }

  function closeEditor() {
    setCreatingProcedure(false);
    setSelectedProcedureId(null);
  }

  function handleSaved() {
    closeEditor();
    void reload();
  }

  if (loading) {
    return (
      <p className="font-body text-sm text-[color:var(--k-muted)]">Wczytywanie procedur…</p>
    );
  }

  if (error) {
    return (
      <p className="font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-4 shadow-sm">
        <p className="font-body text-xs text-[color:var(--k-muted)]">Parametry TD-ABC gabinetu</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="font-body text-[10px] uppercase text-[color:var(--k-muted)]">Stanowisko</p>
            <p className="kalkulator-tabular font-body text-sm font-medium">
              {practice.station_cost_per_hour != null
                ? `${Number(practice.station_cost_per_hour).toLocaleString("pl-PL")} PLN/h`
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] uppercase text-[color:var(--k-muted)]">Lekarz</p>
            <p className="kalkulator-tabular font-body text-sm font-medium">
              {practice.doctor_rate_per_hour != null
                ? `${Number(practice.doctor_rate_per_hour).toLocaleString("pl-PL")} PLN/h`
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-body text-[10px] uppercase text-[color:var(--k-muted)]">Asysta</p>
            <p className="kalkulator-tabular font-body text-sm font-medium">
              {practice.assistant_rate_per_hour != null
                ? `${Number(practice.assistant_rate_per_hour).toLocaleString("pl-PL")} PLN/h`
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {tour.active ? (
        <ProductTourCallout
          stepIndex={tour.stepIndex}
          onNext={tour.next}
          onDismiss={tour.dismiss}
          onGoToTab={setTab}
        />
      ) : null}

      <div
        className="kalkulator-scroll-tabs -mx-4 overflow-x-auto border-b border-[color:var(--k-border)] px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Sekcje kalkulatora"
      >
        <div className="flex min-w-max gap-1 sm:gap-2">
          {(
            [
              ["log", "Zaloguj wykonanie"],
              ["reports", "Raporty"],
              ["procedures", "Procedury"],
              ["materials", "Materiały"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              id={`kalkulator-tab-${key}`}
              aria-controls={`kalkulator-panel-${key}`}
              onClick={() => setTab(key)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 font-body text-sm transition sm:px-4",
                tab === key
                  ? "border-[color:var(--k-primary-light)] text-[color:var(--k-primary)]"
                  : "border-transparent text-[color:var(--k-muted)] hover:text-[color:var(--k-text)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`kalkulator-panel-${tab}`} aria-labelledby={`kalkulator-tab-${tab}`}>
      {tab === "log" ? (
        <KalkulatorLogPanel practice={practice} />
      ) : tab === "reports" ? (
        <MonthlyReportPanel practice={practice} procedures={procedures} />
      ) : tab === "procedures" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ProcedureList
            practice={practice}
            procedures={procedures}
            materials={materials}
            selectedId={selectedProcedureId}
            onSelect={(id) => {
              setCreatingProcedure(false);
              setSelectedProcedureId(id);
            }}
            onCreate={openCreateProcedure}
          />

          {editorOpen ? (
            <ProcedureEditor
              practice={practice}
              procedure={creatingProcedure ? null : selectedProcedure}
              materials={materials}
              onSaved={handleSaved}
              onCancel={closeEditor}
              onDeleted={handleSaved}
            />
          ) : (
            <div className="hidden rounded-[var(--k-radius-card)] border border-dashed border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-8 lg:flex lg:items-center lg:justify-center">
              <p className="max-w-xs text-center font-body text-sm text-[color:var(--k-muted)]">
                Wybierz procedurę z listy albo dodaj nową, żeby edytować koszyk i zobaczyć marżę.
              </p>
            </div>
          )}
        </div>
      ) : (
        <MaterialCatalogPanel practiceId={practice.id} materials={materials} onChanged={reload} />
      )}
      </div>
    </div>
  );
}
