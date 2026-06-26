"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogMaterialAdjustList,
  materialLinesFromProcedure,
} from "@/features/kalkulator/components/log/LogMaterialAdjustList";
import { LogResultCard } from "@/features/kalkulator/components/log/LogResultCard";
import { ProcedureTilePicker } from "@/features/kalkulator/components/log/ProcedureTilePicker";
import {
  wizardHintClassName,
  wizardInputClassName,
  wizardLabelClassName,
  wizardPrimaryButtonClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";
import { computeProcedurePreview } from "@/features/kalkulator/lib/procedureCosting";
import { saveProcedureLog, toLogResultSummary } from "@/features/kalkulator/lib/saveProcedureLog";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import type { MaterialCatalogItem } from "@/features/kalkulator/types/catalog";
import type { LogMaterialLine, LogResultSummary } from "@/features/kalkulator/types/log";
import type { Practice } from "@/features/kalkulator/types/practice";
import type { ProcedureWithMaterials } from "@/features/kalkulator/types/procedure";

const KIOSK_STORAGE_KEY = "kalkulator-kiosk-mode";

type Step = "form" | "done";

type Props = {
  practice: Practice;
  procedures: ProcedureWithMaterials[];
  materials: MaterialCatalogItem[];
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ProcedureLogScreen({ practice, procedures, materials }: Props) {
  const searchParams = useSearchParams();
  const { user } = useKalkulatorAuth();
  const supabase = useMemo(() => createKalkulatorClient(), []);

  const [kiosk, setKiosk] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [performedAt, setPerformedAt] = useState(todayIsoDate);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [materialLines, setMaterialLines] = useState<LogMaterialLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    procedureName: string;
    summary: LogResultSummary;
  } | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("kiosk") === "1";
    const fromStorage =
      typeof window !== "undefined" && sessionStorage.getItem(KIOSK_STORAGE_KEY) === "1";
    setKiosk(fromUrl || fromStorage);
  }, [searchParams]);

  function toggleKiosk() {
    setKiosk((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(KIOSK_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }

  const selectedProcedure = useMemo(
    () => procedures.find((item) => item.id === selectedProcedureId) ?? null,
    [procedures, selectedProcedureId],
  );

  function handleSelectProcedure(id: string) {
    const procedure = procedures.find((item) => item.id === id);
    if (!procedure) return;
    setSelectedProcedureId(id);
    setMaterialLines(materialLinesFromProcedure(procedure));
    setError(null);
  }

  function resetForm() {
    setStep("form");
    setSelectedProcedureId(null);
    setMaterialLines([]);
    setPerformedAt(todayIsoDate());
    setResult(null);
    setError(null);
  }

  async function handleSave() {
    if (!selectedProcedure || !user) {
      setError("Wybierz procedurę przed zapisem.");
      return;
    }

    setSaving(true);
    setError(null);

    const catalogLines = materialLines.map((line) => ({
      material_id: line.material_id,
      default_quantity: line.quantity,
    }));

    const costResult = computeProcedurePreview(
      practice,
      selectedProcedure,
      catalogLines,
      materials,
    );

    const saveResult = await saveProcedureLog(supabase, {
      practiceId: practice.id,
      procedureId: selectedProcedure.id,
      performedAt,
      createdBy: user.id,
      price: Number(selectedProcedure.price),
      costResult,
      materialLines,
    });

    setSaving(false);

    if (!saveResult.ok) {
      setError("Nie udało się zapisać wykonania. Spróbuj ponownie.");
      return;
    }

    setResult({
      procedureName: selectedProcedure.name,
      summary: toLogResultSummary(Number(selectedProcedure.price), costResult),
    });
    setStep("done");
  }

  if (step === "done" && result) {
    return (
      <div className={cn(kiosk && "mx-auto max-w-2xl")}>
        {!kiosk && searchParams.get("kiosk") !== "1" ? (
          <div className="mb-4 flex justify-end">
            <KioskToggle kiosk={kiosk} onToggle={toggleKiosk} />
          </div>
        ) : null}
        <LogResultCard
          procedureName={result.procedureName}
          summary={result.summary}
          onLogAnother={resetForm}
          kiosk={kiosk}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 px-4 sm:px-0", kiosk && "mx-auto max-w-2xl")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className={cn(
              "font-heading text-[color:var(--k-primary)]",
              kiosk ? "text-2xl" : "text-xl",
            )}
          >
            Zaloguj wykonanie
          </h2>
          <p className="mt-1 font-body text-sm text-[color:var(--k-muted)]">
            Wybierz procedurę i skoryguj materiały tylko gdy coś odbiega od szablonu.
          </p>
        </div>
        {searchParams.get("kiosk") !== "1" ? (
          <KioskToggle kiosk={kiosk} onToggle={toggleKiosk} />
        ) : null}
      </div>

      <div className="max-w-xs">
        <label htmlFor="log-date" className={wizardLabelClassName}>
          Data wykonania
        </label>
        <input
          id="log-date"
          type="date"
          value={performedAt}
          onChange={(event) => setPerformedAt(event.target.value)}
          className={cn(wizardInputClassName, kiosk && "py-4 text-lg")}
        />
        <p className={wizardHintClassName}>Domyślnie dziś — zmień tylko gdy logujesz z opóźnieniem.</p>
      </div>

      <div>
        <p className="mb-3 font-body text-sm font-semibold text-[color:var(--k-text)]">Procedura</p>
        <ProcedureTilePicker
          practice={practice}
          procedures={procedures}
          materials={materials}
          selectedId={selectedProcedureId}
          onSelect={handleSelectProcedure}
          kiosk={kiosk}
        />
      </div>

      {selectedProcedure ? (
        <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-4 shadow-sm">
          <p className="font-body text-sm font-semibold text-[color:var(--k-text)]">
            Materiały — korekta od szablonu
          </p>
          <p className="mt-1 font-body text-xs text-[color:var(--k-muted)]">
            Użyj +/− tylko gdy zużycie różni się od domyślnego koszyka.
          </p>
          <div className="mt-4">
            <LogMaterialAdjustList
              lines={materialLines}
              onChange={setMaterialLines}
              kiosk={kiosk}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="kalkulator-log-sticky-cta flex flex-wrap gap-3 sm:static sm:bg-transparent">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!selectedProcedure || saving}
          className={cn(
            wizardPrimaryButtonClassName,
            "w-full sm:w-auto",
            kiosk && "px-8 py-4 text-lg",
            !selectedProcedure && "opacity-50",
          )}
        >
          {saving ? "Zapisywanie…" : "Zapisz wykonanie"}
        </button>
        {selectedProcedure ? (
          <button
            type="button"
            onClick={() => {
              setSelectedProcedureId(null);
              setMaterialLines([]);
            }}
            className={cn(wizardSecondaryButtonClassName, "w-full sm:w-auto")}
          >
            Wyczyść wybór
          </button>
        ) : null}
      </div>
    </div>
  );
}

function KioskToggle({ kiosk, onToggle }: { kiosk: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-[var(--k-radius-btn)] border px-3 py-1.5 font-body text-xs transition",
        kiosk
          ? "border-[color:var(--k-primary-light)] bg-[color:var(--k-primary)]/10 text-[color:var(--k-primary)]"
          : "border-[color:var(--k-border)] text-[color:var(--k-muted)]",
      )}
    >
      {kiosk ? "Tryb kiosk: włączony" : "Tryb kiosk"}
    </button>
  );
}
