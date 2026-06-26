"use client";

import { useMemo, useState } from "react";
import { MATERIAL_PRICE_DISCLAIMER } from "@/features/kalkulator/data/benchmarks";
import {
  wizardErrorClassName,
  wizardHintClassName,
  wizardInputClassName,
  wizardLabelClassName,
  wizardPrimaryButtonClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import type { MaterialCatalogDraft, MaterialCatalogItem } from "@/features/kalkulator/types/catalog";

type Props = {
  practiceId: string;
  materials: MaterialCatalogItem[];
  onChanged: () => void;
};

const EMPTY_DRAFT: MaterialCatalogDraft = {
  name: "",
  unit_label: "szt",
  unit_cost: "",
};

function draftFromMaterial(material: MaterialCatalogItem): MaterialCatalogDraft {
  return {
    name: material.name,
    unit_label: material.unit_label,
    unit_cost: String(material.unit_cost),
  };
}

export function MaterialCatalogPanel({ practiceId, materials, onChanged }: Props) {
  const supabase = useMemo(() => createKalkulatorClient(), []);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<MaterialCatalogDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setEditingId("new");
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function startEdit(material: MaterialCatalogItem) {
    setEditingId(material.id);
    setDraft(draftFromMaterial(material));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function validate(): boolean {
    if (!draft.name.trim()) {
      setError("Podaj nazwę materiału.");
      return false;
    }
    if (!draft.unit_label.trim()) {
      setError("Podaj jednostkę (np. szt, ml, porcja).");
      return false;
    }
    const cost = Number(draft.unit_cost.replace(",", "."));
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Podaj koszt jednostkowy (0 lub więcej).");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const unitCost = Number(draft.unit_cost.replace(",", "."));

    if (editingId === "new") {
      const { error: insertError } = await supabase.from("material_catalog").insert({
        practice_id: practiceId,
        name: draft.name.trim(),
        unit_label: draft.unit_label.trim(),
        unit_cost: unitCost,
        is_default: false,
      });

      setSaving(false);
      if (insertError) {
        setError("Nie udało się dodać materiału.");
        return;
      }
    } else if (editingId) {
      const { error: updateError } = await supabase
        .from("material_catalog")
        .update({
          name: draft.name.trim(),
          unit_label: draft.unit_label.trim(),
          unit_cost: unitCost,
        })
        .eq("id", editingId);

      setSaving(false);
      if (updateError) {
        setError("Nie udało się zapisać materiału.");
        return;
      }
    }

    cancelEdit();
    onChanged();
  }

  async function handleDelete(material: MaterialCatalogItem) {
    if (!window.confirm(`Usunąć „${material.name}" ze słownika?`)) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("material_catalog")
      .delete()
      .eq("id", material.id);

    setSaving(false);

    if (deleteError) {
      setError(
        "Nie udało się usunąć materiału — może być używany w procedurze. Usuń go z koszyków procedur.",
      );
      return;
    }

    if (editingId === material.id) cancelEdit();
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-sm font-semibold text-[color:var(--k-text)]">
            Słownik materiałów
          </h2>
          <p className="mt-1 font-body text-xs text-[color:var(--k-muted)]">
            {MATERIAL_PRICE_DISCLAIMER}
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] px-3 py-1.5 font-body text-xs"
        >
          Dodaj materiał
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--k-border)] bg-[color:var(--k-page-bg)]">
              {["Nazwa", "Jednostka", "Koszt", ""].map((header) => (
                <th
                  key={header || "actions"}
                  className="px-4 py-2 text-left font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 font-body text-sm text-[color:var(--k-muted)]">
                  Brak materiałów. Dodaj pierwszą pozycję do słownika.
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id} className="border-b border-[color:var(--k-border)]">
                  <td className="px-4 py-3 font-body text-sm text-[color:var(--k-text)]">
                    {material.name}
                    {material.is_default ? (
                      <span className="ml-2 font-body text-[10px] uppercase text-[color:var(--k-muted)]">
                        seed
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-[color:var(--k-muted)]">
                    {material.unit_label}
                  </td>
                  <td className="kalkulator-tabular px-4 py-3 font-body text-sm">
                    {Number(material.unit_cost).toLocaleString("pl-PL")} PLN
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(material)}
                      className="font-body text-xs text-[color:var(--k-primary-light)] hover:underline"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(material)}
                      className="ml-3 font-body text-xs text-[color:var(--k-margin-loss)] hover:underline"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <div className="rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-4">
          <h3 className="font-body text-sm font-semibold text-[color:var(--k-text)]">
            {editingId === "new" ? "Nowy materiał" : "Edycja materiału"}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={wizardLabelClassName}>Nazwa</label>
              <input
                value={draft.name}
                onChange={(event) => setDraft((c) => ({ ...c, name: event.target.value }))}
                className={wizardInputClassName}
              />
            </div>
            <div>
              <label className={wizardLabelClassName}>Jednostka</label>
              <input
                value={draft.unit_label}
                onChange={(event) => setDraft((c) => ({ ...c, unit_label: event.target.value }))}
                className={wizardInputClassName}
                placeholder="szt"
              />
            </div>
            <div>
              <label className={wizardLabelClassName}>Koszt / jednostkę (PLN)</label>
              <input
                inputMode="decimal"
                value={draft.unit_cost}
                onChange={(event) => setDraft((c) => ({ ...c, unit_cost: event.target.value }))}
                className={wizardInputClassName}
              />
              <p className={wizardHintClassName}>Koszt dla gabinetu, nie cena dla pacjenta.</p>
            </div>
          </div>

          {error ? <p className={wizardErrorClassName}>{error}</p> : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={wizardPrimaryButtonClassName}
            >
              {saving ? "Zapisywanie…" : "Zapisz"}
            </button>
            <button type="button" onClick={cancelEdit} className={wizardSecondaryButtonClassName}>
              Anuluj
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
