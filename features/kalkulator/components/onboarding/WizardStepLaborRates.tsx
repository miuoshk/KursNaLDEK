"use client";

import type { WizardFieldErrors, WizardStep3Values } from "@/features/kalkulator/lib/wizardValidation";
import {
  wizardErrorClassName,
  wizardHintClassName,
  wizardInputClassName,
  wizardLabelClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";

type Props = {
  values: WizardStep3Values;
  errors: WizardFieldErrors<keyof WizardStep3Values>;
  onChange: (patch: Partial<WizardStep3Values>) => void;
};

function RateField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={wizardLabelClassName}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={wizardInputClassName}
          placeholder="0"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-body text-sm text-[color:var(--k-muted)]">
          PLN/h
        </span>
      </div>
      <p className={wizardHintClassName}>{hint}</p>
      {error ? <p className={wizardErrorClassName}>{error}</p> : null}
    </div>
  );
}

export function WizardStepLaborRates({ values, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Podaj koszt pracy (wynagrodzenie + składki), nie cenę dla pacjenta.
      </p>

      <RateField
        id="doctor-rate"
        label="Stawka lekarza / h"
        hint="Podziel miesięczny koszt lekarza (brutto + ZUS) przez liczbę klinicznych godzin w gabinecie."
        value={values.doctorRatePerHour}
        error={errors.doctorRatePerHour}
        onChange={(doctorRatePerHour) => onChange({ doctorRatePerHour })}
      />

      <RateField
        id="assistant-rate"
        label="Stawka asysty / h"
        hint="Koszt godziny asysty dentystycznej. Wpisz 0, jeśli lekarz pracuje sam."
        value={values.assistantRatePerHour}
        error={errors.assistantRatePerHour}
        onChange={(assistantRatePerHour) => onChange({ assistantRatePerHour })}
      />
    </div>
  );
}
