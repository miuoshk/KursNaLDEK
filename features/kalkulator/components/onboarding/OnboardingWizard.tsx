"use client";

import { useMemo, useState } from "react";
import { WizardProgress } from "@/features/kalkulator/components/onboarding/WizardProgress";
import { WizardStepFixedCosts } from "@/features/kalkulator/components/onboarding/WizardStepFixedCosts";
import { WizardStepLaborRates } from "@/features/kalkulator/components/onboarding/WizardStepLaborRates";
import { WizardStepPracticeInfo } from "@/features/kalkulator/components/onboarding/WizardStepPracticeInfo";
import { WizardStepReferenceImport } from "@/features/kalkulator/components/onboarding/WizardStepReferenceImport";
import {
  wizardPrimaryButtonClassName,
  wizardSecondaryButtonClassName,
} from "@/features/kalkulator/components/onboarding/wizardStyles";
import { useKalkulatorAuth } from "@/features/kalkulator/context/AuthContext";
import { seedPracticeDefaults } from "@/features/kalkulator/lib/seedPracticeDefaults";
import { sumMonthlyStationCosts } from "@/features/kalkulator/lib/stationCost";
import { createKalkulatorClient } from "@/features/kalkulator/lib/supabase";
import {
  parseWizardStep2Numbers,
  parseWizardStep3Numbers,
  validateWizardStep1,
  validateWizardStep2,
  validateWizardStep3,
  type WizardStep1Values,
  type WizardStep2Values,
  type WizardStep3Values,
} from "@/features/kalkulator/lib/wizardValidation";

type Props = {
  onComplete: () => void;
};

const INITIAL_STEP1: WizardStep1Values = {
  name: "",
  city: "",
  voivodeship: "",
};

const INITIAL_STEP2: WizardStep2Values = {
  rent: "",
  utilities: "",
  amortization: "",
  admin: "",
  stationHoursPerMonth: "160",
};

const INITIAL_STEP3: WizardStep3Values = {
  doctorRatePerHour: "",
  assistantRatePerHour: "",
};

export function OnboardingWizard({ onComplete }: Props) {
  const { user } = useKalkulatorAuth();
  const supabase = useMemo(() => createKalkulatorClient(), []);

  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState(INITIAL_STEP1);
  const [step2, setStep2] = useState(INITIAL_STEP2);
  const [step3, setStep3] = useState(INITIAL_STEP3);
  const [importReferenceProcedures, setImportReferenceProcedures] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [step1Errors, setStep1Errors] = useState(validateWizardStep1(step1));
  const [step2Errors, setStep2Errors] = useState(validateWizardStep2(step2));
  const [step3Errors, setStep3Errors] = useState(validateWizardStep3(step3));

  function goNext() {
    if (step === 1) {
      const errors = validateWizardStep1(step1);
      setStep1Errors(errors);
      if (Object.keys(errors).length > 0) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      const errors = validateWizardStep2(step2);
      setStep2Errors(errors);
      if (Object.keys(errors).length > 0) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      const errors = validateWizardStep3(step3);
      setStep3Errors(errors);
      if (Object.keys(errors).length > 0) return;
      setStep(4);
    }
  }

  function goBack() {
    setSubmitError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleFinish() {
    if (!user) {
      setSubmitError("Brak sesji. Zaloguj się ponownie.");
      return;
    }

    const errors = validateWizardStep3(step3);
    setStep3Errors(errors);
    if (Object.keys(errors).length > 0) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const costs = parseWizardStep2Numbers(step2);
    const rates = parseWizardStep3Numbers(step3);
    const monthlyStationCost = sumMonthlyStationCosts(costs);

    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .insert({
        owner_id: user.id,
        name: step1.name.trim(),
        city: step1.city.trim(),
        voivodeship: step1.voivodeship,
        monthly_station_cost: monthlyStationCost,
        station_hours_per_month: costs.stationHoursPerMonth,
        doctor_rate_per_hour: rates.doctorRatePerHour,
        assistant_rate_per_hour: rates.assistantRatePerHour,
      })
      .select("*")
      .single();

    if (practiceError || !practice) {
      setSubmitting(false);
      setSubmitError("Nie udało się zapisać gabinetu. Spróbuj ponownie.");
      return;
    }

    const seedResult = await seedPracticeDefaults(supabase, practice.id, {
      includeMaterials: true,
      includeProcedures: importReferenceProcedures,
    });

    setSubmitting(false);

    if (!seedResult.ok) {
      setSubmitError("Gabinet zapisany, ale seed danych nie powiódł się. Odśwież stronę.");
      return;
    }

    onComplete();
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <p className="font-body text-xs font-medium uppercase tracking-wide text-[color:var(--k-muted)]">
        kursnaldek.pl · konfiguracja TD-ABC
      </p>

      <div className="mt-6 rounded-[var(--k-radius-card)] border border-[color:var(--k-border)] bg-[color:var(--k-card-bg)] p-6 shadow-sm md:p-8">
        <WizardProgress step={step} />

        {step === 1 ? (
          <WizardStepPracticeInfo
            values={step1}
            errors={step1Errors}
            onChange={(patch) => {
              const next = { ...step1, ...patch };
              setStep1(next);
              setStep1Errors(validateWizardStep1(next));
            }}
          />
        ) : null}

        {step === 2 ? (
          <WizardStepFixedCosts
            values={step2}
            errors={step2Errors}
            onChange={(patch) => {
              const next = { ...step2, ...patch };
              setStep2(next);
              setStep2Errors(validateWizardStep2(next));
            }}
          />
        ) : null}

        {step === 3 ? (
          <WizardStepLaborRates
            values={step3}
            errors={step3Errors}
            onChange={(patch) => {
              const next = { ...step3, ...patch };
              setStep3(next);
              setStep3Errors(validateWizardStep3(next));
            }}
          />
        ) : null}

        {step === 4 ? (
          <WizardStepReferenceImport
            importReferenceProcedures={importReferenceProcedures}
            onImportChange={setImportReferenceProcedures}
          />
        ) : null}

        {submitError ? (
          <p className="mt-4 font-body text-sm text-[color:var(--k-margin-loss)]" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className={wizardSecondaryButtonClassName}
            >
              Wstecz
            </button>
          ) : null}

          {step < 4 ? (
            <button type="button" onClick={goNext} className={wizardPrimaryButtonClassName}>
              Dalej
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={submitting}
              className={wizardPrimaryButtonClassName}
            >
              {submitting ? "Zapisywanie…" : "Zapisz i przejdź do kalkulatora"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
