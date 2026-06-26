"use client";

import { MATERIAL_PRICE_DISCLAIMER, REFERENCE_PROCEDURES } from "@/features/kalkulator/data/benchmarks";

type Props = {
  importReferenceProcedures: boolean;
  onImportChange: (value: boolean) => void;
};

export function WizardStepReferenceImport({ importReferenceProcedures, onImportChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Możesz zacząć od procedur referencyjnych z badania (n=106). Edytujesz je później w
        gabinecie.
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-white p-4">
        <input
          type="checkbox"
          checked={importReferenceProcedures}
          onChange={(event) => onImportChange(event.target.checked)}
          className="mt-1 size-4 accent-[color:var(--k-primary)]"
        />
        <span>
          <span className="block font-body text-sm font-medium text-[color:var(--k-text)]">
            Importuj 4 procedury referencyjne z medianami
          </span>
          <span className="mt-1 block font-body text-xs text-[color:var(--k-muted)]">
            Endo, kompozyt, przegląd i korona — z ceną i czasem z licencjatu.
          </span>
        </span>
      </label>

      {importReferenceProcedures ? (
        <ul className="space-y-2 rounded-[var(--k-radius-btn)] border border-[color:var(--k-border)] bg-[color:var(--k-page-bg)] p-4">
          {REFERENCE_PROCEDURES.map((procedure) => (
            <li
              key={procedure.key}
              className="flex flex-wrap items-baseline justify-between gap-2 font-body text-sm"
            >
              <span className="text-[color:var(--k-text)]">{procedure.name}</span>
              <span className="kalkulator-tabular text-[color:var(--k-muted)]">
                {procedure.price.toLocaleString("pl-PL")} PLN · {procedure.durationMinutes} min
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-[var(--k-radius-btn)] border border-dashed border-[color:var(--k-accent)]/50 bg-[color:var(--k-accent)]/5 px-4 py-3">
        <p className="font-body text-sm font-medium text-[color:var(--k-text)]">
          Słownik materiałów zostanie dodany
        </p>
        <p className="mt-1 font-body text-xs text-[color:var(--k-muted)]">
          10 pozycji startowych (endo + kompozyt). {MATERIAL_PRICE_DISCLAIMER}.
        </p>
      </div>
    </div>
  );
}
