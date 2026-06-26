export type WizardStep1Values = {
  name: string;
  city: string;
  voivodeship: string;
};

export type WizardStep2Values = {
  rent: string;
  utilities: string;
  amortization: string;
  admin: string;
  stationHoursPerMonth: string;
};

export type WizardStep3Values = {
  doctorRatePerHour: string;
  assistantRatePerHour: string;
};

export type WizardFieldErrors<T extends string> = Partial<Record<T, string>>;

function parseNonNegativeAmount(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function parsePositiveAmount(raw: string): number | null {
  const value = parseNonNegativeAmount(raw);
  if (value == null || value <= 0) return null;
  return value;
}

export function validateWizardStep1(
  values: WizardStep1Values,
): WizardFieldErrors<keyof WizardStep1Values> {
  const errors: WizardFieldErrors<keyof WizardStep1Values> = {};

  if (!values.name.trim()) {
    errors.name = "Podaj nazwę gabinetu.";
  }
  if (!values.city.trim()) {
    errors.city = "Podaj miasto.";
  }
  if (!values.voivodeship) {
    errors.voivodeship = "Wybierz województwo.";
  }

  return errors;
}

export function validateWizardStep2(
  values: WizardStep2Values,
): WizardFieldErrors<keyof WizardStep2Values> {
  const errors: WizardFieldErrors<keyof WizardStep2Values> = {};

  const rent = parseNonNegativeAmount(values.rent);
  const utilities = parseNonNegativeAmount(values.utilities);
  const amortization = parseNonNegativeAmount(values.amortization);
  const admin = parseNonNegativeAmount(values.admin);

  if (rent == null) errors.rent = "Podaj kwotę czynszu (0 jeśli brak).";
  if (utilities == null) errors.utilities = "Podaj koszt mediów (0 jeśli brak).";
  if (amortization == null) {
    errors.amortization = "Podaj amortyzację sprzętu (0 jeśli brak).";
  }
  if (admin == null) errors.admin = "Podaj koszty administracji (0 jeśli brak).";

  const hoursRaw = values.stationHoursPerMonth.trim().replace(",", ".");
  const hours = Number(hoursRaw);
  if (!hoursRaw || !Number.isFinite(hours) || hours <= 0) {
    errors.stationHoursPerMonth = "Podaj liczbę godzin pracy unitu w miesiącu.";
  }

  const monthlyTotal =
    (rent ?? 0) + (utilities ?? 0) + (amortization ?? 0) + (admin ?? 0);

  if (
    rent != null &&
    utilities != null &&
    amortization != null &&
    admin != null &&
    monthlyTotal <= 0
  ) {
    errors.rent =
      "Podaj koszt czynszu, żebyśmy policzyli koszt godziny — albo uzupełnij inne koszty stałe.";
  }

  return errors;
}

export function validateWizardStep3(
  values: WizardStep3Values,
): WizardFieldErrors<keyof WizardStep3Values> {
  const errors: WizardFieldErrors<keyof WizardStep3Values> = {};

  const doctor = parsePositiveAmount(values.doctorRatePerHour);
  const assistant = parseNonNegativeAmount(values.assistantRatePerHour);

  if (doctor == null) {
    errors.doctorRatePerHour = "Podaj stawkę kosztową lekarza za godzinę.";
  }
  if (assistant == null) {
    errors.assistantRatePerHour = "Podaj stawkę asysty (0 jeśli pracujesz bez asysty).";
  }

  return errors;
}

export function parseWizardStep2Numbers(values: WizardStep2Values) {
  return {
    rent: parseNonNegativeAmount(values.rent) ?? 0,
    utilities: parseNonNegativeAmount(values.utilities) ?? 0,
    amortization: parseNonNegativeAmount(values.amortization) ?? 0,
    admin: parseNonNegativeAmount(values.admin) ?? 0,
    stationHoursPerMonth: Number(values.stationHoursPerMonth.trim().replace(",", ".")),
  };
}

export function parseWizardStep3Numbers(values: WizardStep3Values) {
  return {
    doctorRatePerHour: parsePositiveAmount(values.doctorRatePerHour) ?? 0,
    assistantRatePerHour: parseNonNegativeAmount(values.assistantRatePerHour) ?? 0,
  };
}
