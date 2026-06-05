/** Zaokrąglenie bez artefaktów float (np. 629.0999999999999 → 629.1). */
export function roundMetric(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatPlDecimal(value: number, decimals: number): string {
  const rounded = roundMetric(value, decimals);
  if (decimals === 0 || Number.isInteger(rounded)) {
    return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(rounded);
  }
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(rounded);
}

/**
 * Liczby ≥ 1000 → skrót „X,X tys.” / „X,X mln”.
 * Mniejsze → separator tysięcy (np. 999, 472).
 */
export function formatAdminCount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${formatPlDecimal(value / 1_000_000, 1)} mln`;
  }
  if (abs >= 1000) {
    return `${formatPlDecimal(value / 1000, 1)} tys.`;
  }
  return formatPlDecimal(value, 0);
}

/** Godziny — ten sam skrót co liczby, z sufiksem „h”. */
export function formatAdminHours(hours: number): string {
  const abs = Math.abs(hours);
  if (abs >= 1000) {
    return `${formatPlDecimal(hours / 1000, 1)} tys. h`;
  }
  const rounded = roundMetric(hours, 1);
  if (Number.isInteger(rounded)) {
    return `${formatPlDecimal(rounded, 0)} h`;
  }
  return `${formatPlDecimal(rounded, 1)} h`;
}

/** Delta w badge — z prefiksem +/- i tym samym skrótem. */
export function formatAdminDelta(value: number, decimals = 0): string {
  const rounded = roundMetric(value, decimals);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "" : "";
  const abs = Math.abs(rounded);
  if (abs >= 1_000_000) {
    return `${sign}${formatPlDecimal(rounded / 1_000_000, 1)} mln`;
  }
  if (abs >= 1000) {
    return `${sign}${formatPlDecimal(rounded / 1000, 1)} tys.`;
  }
  if (decimals > 0 && !Number.isInteger(rounded)) {
    return `${sign}${formatPlDecimal(rounded, decimals)}`;
  }
  return `${sign}${formatPlDecimal(rounded, 0)}`;
}
