"use client";

import {
  computeStationCostPerHour,
  sumMonthlyStationCosts,
} from "@/features/kalkulator/lib/stationCost";
import type { WizardFieldErrors, WizardStep2Values } from "@/features/kalkulator/lib/wizardValidation";
import { parseWizardStep2Numbers } from "@/features/kalkulator/lib/wizardValidation";
import {
  wizardErrorClassName,
  wizardHintClassName,
  wizardInputClassName,
  wizardLabelClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";

type Props = {
  values: WizardStep2Values;
  errors: WizardFieldErrors<keyof WizardStep2Values>;
  onChange: (patch: Partial<WizardStep2Values>) => void;
};

function CostField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
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
          PLN/msc
        </span>
      </div>
      {hint ? <p className={wizardHintClassName}>{hint}</p> : null}
      {error ? <p className={wizardErrorClassName}>{error}</p> : null}
    </div>
  );
}

export function WizardStepFixedCosts({ values, errors, onChange }: Props) {
  const parsed = parseWizardStep2Numbers(values);
  const monthlyTotal = sumMonthlyStationCosts(parsed);
  const stationCostPerHour = computeStationCostPerHour(
    monthlyTotal,
    parsed.stationHoursPerMonth,
  );

  return (
    <div className="space-y-4">
      <p className="font-body text-sm text-[color:var(--k-muted)]">
        Podaj miesięczne koszty przypisane do stanowiska. Zsumujemy je i policzymy koszt
        godziny unitu.
      </p>

      <CostField
        id="cost-rent"
        label="Ile miesięcznie czynsz?"
        value={values.rent}
        error={errors.rent}
        onChange={(rent) => onChange({ rent })}
      />
      <CostField
        id="cost-utilities"
        label="Media (prąd, woda, ogrzewanie)?"
        value={values.utilities}
        error={errors.utilities}
        onChange={(utilities) => onChange({ utilities })}
      />
      <CostField
        id="cost-amortization"
        label="Amortyzacja sprzętu?"
        hint="Udział miesięczny kosztu unitu, fotelu, RTG itd."
        value={values.amortization}
        error={errors.amortization}
        onChange={(amortization) => onChange({ amortization })}
      />
      <CostField
        id="cost-admin"
        label="Koszty administracji?"
        hint="Recepcja, księgowość, oprogramowanie — udział przypisany do unitu."
        value={values.admin}
        error={errors.admin}
        onChange={(admin) => onChange({ admin })}
      />

      <div className="border-t border-[color:var(--k-border)] pt-4">
        <label htmlFor="station-hours" className={wizardLabelClassName}>
          Ile godzin w miesiącu pracuje unit?
        </label>
        <input
          id="station-hours"
          inputMode="decimal"
          value={values.stationHoursPerMonth}
          onChange={(event) => onChange({ stationHoursPerMonth: event.target.value })}
          className={wizardInputClassName}
        />
        <p className={wizardHintClassName}>
          Domyślnie 160 h (~8 h × 20 dni roboczych). Dostosuj do grafiku gabinetu.
        </p>
        {errors.stationHoursPerMonth ? (
          <p className={wizardErrorClassName}>{errors.stationHoursPerMonth}</p>
        ) : null}
      </div>

      <div className="rounded-[var(--k-radius-btn)] border border-[color:var(--k-primary-light)]/30 bg-[color:var(--k-primary)]/5 px-4 py-4">
        <p className="font-body text-xs uppercase tracking-wide text-[color:var(--k-muted)]">
          Koszt stały unitu / miesiąc
        </p>
        <p className="kalkulator-tabular mt-1 font-body text-2xl font-semibold text-[color:var(--k-primary)]">
          {monthlyTotal.toLocaleString("pl-PL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          PLN
        </p>
        <p className="mt-3 font-body text-xs uppercase tracking-wide text-[color:var(--k-muted)]">
          Koszt godziny stanowiska
        </p>
        <p className="kalkulator-tabular mt-1 font-body text-xl font-semibold text-[color:var(--k-primary-light)]">
          {stationCostPerHour != null
            ? `${stationCostPerHour.toLocaleString("pl-PL", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} PLN/h`
            : "—"}
        </p>
      </div>
    </div>
  );
}
