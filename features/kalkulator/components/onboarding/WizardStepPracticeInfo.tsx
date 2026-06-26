"use client";

import { POLISH_VOIVODESHIPS } from "@/features/kalkulator/data/polishVoivodeships";
import type { WizardFieldErrors, WizardStep1Values } from "@/features/kalkulator/lib/wizardValidation";
import {
  wizardErrorClassName,
  wizardInputClassName,
  wizardLabelClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";

type Props = {
  values: WizardStep1Values;
  errors: WizardFieldErrors<keyof WizardStep1Values>;
  onChange: (patch: Partial<WizardStep1Values>) => void;
};

export function WizardStepPracticeInfo({ values, errors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Podstawowe dane gabinetu. Użyjemy ich w raportach i ustawieniach kosztów.
      </p>

      <div>
        <label htmlFor="practice-name" className={wizardLabelClassName}>
          Nazwa gabinetu
        </label>
        <input
          id="practice-name"
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
          className={wizardInputClassName}
          placeholder="np. Dentica Centrum"
          autoComplete="organization"
        />
        {errors.name ? <p className={wizardErrorClassName}>{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="practice-city" className={wizardLabelClassName}>
          Miasto
        </label>
        <input
          id="practice-city"
          value={values.city}
          onChange={(event) => onChange({ city: event.target.value })}
          className={wizardInputClassName}
          placeholder="np. Kraków"
          autoComplete="address-level2"
        />
        {errors.city ? <p className={wizardErrorClassName}>{errors.city}</p> : null}
      </div>

      <div>
        <label htmlFor="practice-voivodeship" className={wizardLabelClassName}>
          Województwo
        </label>
        <select
          id="practice-voivodeship"
          value={values.voivodeship}
          onChange={(event) => onChange({ voivodeship: event.target.value })}
          className={wizardInputClassName}
        >
          <option value="">Wybierz województwo</option>
          {POLISH_VOIVODESHIPS.map((voivodeship) => (
            <option key={voivodeship} value={voivodeship}>
              {voivodeship}
            </option>
          ))}
        </select>
        {errors.voivodeship ? (
          <p className={wizardErrorClassName}>{errors.voivodeship}</p>
        ) : null}
      </div>
    </div>
  );
}
