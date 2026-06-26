"use client";

import { useEffect, useMemo, useState } from "react";
import { CostBreakdownBar } from "@/features/kalkulator/components/dashboard/CostBreakdownBar";
import {
  wizardErrorClassName,
  wizardHintClassName,
  wizardInputClassName,
  wizardLabelClassName,
  wizardPrimaryButtonClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";
import {
  getMarginTone,
  marginToneColor,
} from "@/features/kalkulator/lib/marginTone";
import { computeProcedurePreview } from "@/features/kalkulator/lib/procedureCosting";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import type { MaterialCatalogItem } from "@/features/kalkulator/types/catalog";
import type { Practice } from "@/features/kalkulator/types/practice";
import type {
  ProcedureDraft,
  ProcedureMaterialLine,
  ProcedureWithMaterials,
} from "@/features/kalkulator/types/procedure";

type Props = {
  practice: Practice;
  procedure: ProcedureWithMaterials | null;
  materials: MaterialCatalogItem[];
  onSaved: () => void;
  onCancel: () => void;
  onDeleted?: () => void;
};

function emptyDraft(): ProcedureDraft {
  return {
    name: "",
    price: "",
    duration_minutes: "",
    assistant_share_pct: "100",
    materialLines: [],
  };
}

function draftFromProcedure(procedure: ProcedureWithMaterials): ProcedureDraft {
  return {
    name: procedure.name,
    price: String(procedure.price),
    duration_minutes: String(procedure.duration_minutes),
    assistant_share_pct: String(Math.round(Number(procedure.assistant_share) * 100)),
    materialLines: procedure.procedure_materials.map((line) => ({
      id: line.id,
      material_id: line.material_id,
      default_quantity: Number(line.default_quantity),
    })),
  };
}

function parseDraft(draft: ProcedureDraft) {
  const price = Number(draft.price.replace(",", "."));
  const duration = Number(draft.duration_minutes);
  const assistantSharePct = Number(draft.assistant_share_pct.replace(",", "."));
  const assistantShare = assistantSharePct / 100;

  return { price, duration, assistantShare };
}

export function ProcedureEditor({
  practice,
  procedure,
  materials,
  onSaved,
  onCancel,
  onDeleted,
}: Props) {
  const supabase = useMemo(() => createKalkulatorClient(), []);
  const isNew = procedure == null;

  const [draft, setDraft] = useState<ProcedureDraft>(
    procedure ? draftFromProcedure(procedure) : emptyDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(procedure ? draftFromProcedure(procedure) : emptyDraft());
    setFieldErrors({});
    setError(null);
  }, [procedure]);

  const preview = useMemo(() => {
    const parsed = parseDraft(draft);
    if (!Number.isFinite(parsed.price) || !Number.isFinite(parsed.duration)) {
      return null;
    }

    return computeProcedurePreview(
      practice,
      {
        price: parsed.price,
        duration_minutes: parsed.duration,
        assistant_share: Number.isFinite(parsed.assistantShare) ? parsed.assistantShare : 1,
      },
      draft.materialLines,
      materials,
    );
  }, [draft, materials, practice]);

  const previewPrice = Number(draft.price.replace(",", ".")) || 0;
  const marginTone = preview ? getMarginTone(preview.marginPct) : null;

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors.name = "Podaj nazwę procedury.";
    const price = Number(draft.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) errors.price = "Podaj cenę pobieraną od pacjenta.";
    const duration = Number(draft.duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      errors.duration_minutes = "Podaj czas kliniczny w minutach.";
    }
    const assistantPct = Number(draft.assistant_share_pct.replace(",", "."));
    if (!Number.isFinite(assistantPct) || assistantPct < 0 || assistantPct > 100) {
      errors.assistant_share_pct = "Udział asysty: 0–100%.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const { price, duration, assistantShare } = parseDraft(draft);

    let procedureId = procedure?.id;

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from("procedures")
        .insert({
          practice_id: practice.id,
          name: draft.name.trim(),
          price,
          duration_minutes: duration,
          assistant_share: assistantShare,
        })
        .select("id")
        .single();

      if (insertError || !data) {
        setSaving(false);
        setError("Nie udało się dodać procedury.");
        return;
      }
      procedureId = data.id;
    } else {
      const { error: updateError } = await supabase
        .from("procedures")
        .update({
          name: draft.name.trim(),
          price,
          duration_minutes: duration,
          assistant_share: assistantShare,
        })
        .eq("id", procedure!.id);

      if (updateError) {
        setSaving(false);
        setError("Nie udało się zapisać procedury.");
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("procedure_materials")
      .delete()
      .eq("procedure_id", procedureId!);

    if (deleteError) {
      setSaving(false);
      setError("Nie udało się zaktualizować koszyka materiałów.");
      return;
    }

    const rows = draft.materialLines
      .filter((line) => line.material_id && line.default_quantity > 0)
      .map((line) => ({
        procedure_id: procedureId!,
        material_id: line.material_id,
        default_quantity: line.default_quantity,
      }));

    if (rows.length > 0) {
      const { error: materialsError } = await supabase.from("procedure_materials").insert(rows);
      if (materialsError) {
        setSaving(false);
        setError("Nie udało się zapisać materiałów procedury.");
        return;
      }
    }

    setSaving(false);
    onSaved();
  }

  async function handleDelete() {
    if (!procedure || !onDeleted) return;
    if (!window.confirm(`Usunąć procedurę „${procedure.name}"?`)) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("procedures")
      .delete()
      .eq("id", procedure.id);

    setSaving(false);

    if (deleteError) {
      setError("Nie udało się usunąć procedury. Sprawdź, czy nie ma powiązanych logów.");
      return;
    }

    onDeleted();
  }

  function updateMaterialLine(index: number, patch: Partial<ProcedureMaterialLine>) {
    setDraft((current) => ({
      ...current,
      materialLines: current.materialLines.map((line, i) =>
        i === index ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addMaterialLine() {
    const firstUnused = materials.find(
      (material) => !draft.materialLines.some((line) => line.material_id === material.id),
    );
    if (!firstUnused) return;

    setDraft((current) => ({
      ...current,
      materialLines: [
        ...current.materialLines,
        { material_id: firstUnused.id, default_quantity: 1 },
      ],
    }));
  }

  function removeMaterialLine(index: number) {
    setDraft((current) => ({
      ...current,
      materialLines: current.materialLines.filter((_, i) => i !== index),
    }));
  }

  const unusedMaterials = materials.filter(
    (material) => !draft.materialLines.some((line) => line.material_id === material.id),
  );

  return (
    <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-6 shadow-sm">
      <h2 className="font-heading text-xl text-[color:var(--k-primary)]">
        {isNew ? "Nowa procedura" : "Edycja procedury"}
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={wizardLabelClassName}>Nazwa</label>
          <input
            value={draft.name}
            onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))}
            className={wizardInputClassName}
          />
          {fieldErrors.name ? <p className={wizardErrorClassName}>{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label className={wizardLabelClassName}>Cena (PLN)</label>
          <input
            inputMode="decimal"
            value={draft.price}
            onChange={(event) => setDraft((c) => ({ ...c, price: event.target.value }))}
            className={wizardInputClassName}
          />
          {fieldErrors.price ? <p className={wizardErrorClassName}>{fieldErrors.price}</p> : null}
        </div>

        <div>
          <label className={wizardLabelClassName}>Czas kliniczny (min)</label>
          <input
            inputMode="numeric"
            value={draft.duration_minutes}
            onChange={(event) =>
              setDraft((c) => ({ ...c, duration_minutes: event.target.value }))
            }
            className={wizardInputClassName}
          />
          {fieldErrors.duration_minutes ? (
            <p className={wizardErrorClassName}>{fieldErrors.duration_minutes}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label className={wizardLabelClassName}>Udział asysty (% czasu)</label>
          <input
            inputMode="decimal"
            value={draft.assistant_share_pct}
            onChange={(event) =>
              setDraft((c) => ({ ...c, assistant_share_pct: event.target.value }))
            }
            className={wizardInputClassName}
          />
          <p className={wizardHintClassName}>100% = asysta przez cały czas zabiegu, 0% = bez asysty.</p>
          {fieldErrors.assistant_share_pct ? (
            <p className={wizardErrorClassName}>{fieldErrors.assistant_share_pct}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-body text-sm font-semibold text-[color:var(--k-text)]">
            Koszyk materiałów
          </h3>
          <button
            type="button"
            onClick={addMaterialLine}
            disabled={unusedMaterials.length === 0}
            className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] px-3 py-1.5 font-body text-xs disabled:opacity-50"
          >
            Dodaj materiał
          </button>
        </div>

        {draft.materialLines.length === 0 ? (
          <p className="font-body text-sm text-[color:var(--k-muted)]">
            Brak materiałów w koszyku — marża liczy się bez kosztów materiałowych.
          </p>
        ) : (
          <ul className="space-y-2">
            {draft.materialLines.map((line, index) => {
              const material = materials.find((item) => item.id === line.material_id);
              return (
                <li
                  key={`${line.material_id}-${index}`}
                  className="flex flex-wrap items-end gap-2 rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] p-3"
                >
                  <div className="min-w-[180px] flex-1">
                    <label className="mb-1 block font-body text-xs text-[color:var(--k-muted)]">
                      Materiał
                    </label>
                    <select
                      value={line.material_id}
                      onChange={(event) =>
                        updateMaterialLine(index, { material_id: event.target.value })
                      }
                      className={wizardInputClassName}
                    >
                      {[...(material ? [material] : []), ...unusedMaterials]
                        .filter(
                          (item, i, arr) => arr.findIndex((x) => x.id === item.id) === i,
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit_label})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block font-body text-xs text-[color:var(--k-muted)]">
                      Ilość
                    </label>
                    <input
                      inputMode="decimal"
                      value={line.default_quantity}
                      onChange={(event) =>
                        updateMaterialLine(index, {
                          default_quantity: Number(event.target.value.replace(",", ".")) || 0,
                        })
                      }
                      className={wizardInputClassName}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterialLine(index)}
                    className="rounded-[var(--k-radius-btn)] px-2 py-2 font-body text-xs text-[color:var(--k-margin-loss)]"
                  >
                    Usuń
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 border-t border-[color:var(--k-border)] pt-6">
        <h3 className="font-body text-sm font-semibold text-[color:var(--k-text)]">
          Rozbicie kosztu
        </h3>
        {preview ? (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="kalkulator-tabular font-body text-2xl font-semibold text-[color:var(--k-text)]">
                Marża: {preview.marginPln.toLocaleString("pl-PL")} PLN
              </p>
              <p
                className="kalkulator-tabular font-body text-lg font-medium"
                style={{ color: marginTone ? marginToneColor(marginTone) : undefined }}
              >
                ({preview.marginPct.toLocaleString("pl-PL")}%)
              </p>
            </div>
            <div className="mt-4">
              <CostBreakdownBar price={previewPrice} result={preview} />
            </div>
          </>
        ) : (
          <p className="mt-2 font-body text-sm text-[color:var(--k-muted)]">
            Uzupełnij cenę i czas, żeby zobaczyć kalkulację.
          </p>
        )}
      </div>

      {error ? (
        <p className="mt-4 font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className={wizardPrimaryButtonClassName}
        >
          {saving ? "Zapisywanie…" : "Zapisz procedurę"}
        </button>
        <button type="button" onClick={onCancel} className={wizardSecondaryButtonClassName}>
          Anuluj
        </button>
        {!isNew && onDeleted ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={saving}
            className="ml-auto rounded-[var(--k-radius-btn)] px-4 py-3 font-body text-sm text-[color:var(--k-margin-loss)]"
          >
            Usuń procedurę
          </button>
        ) : null}
      </div>
    </div>
  );
}
