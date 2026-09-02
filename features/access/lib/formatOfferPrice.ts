export function formatOfferAmount(unitAmount: number, currency: string): string {
  const hasGrosze = unitAmount % 100 !== 0;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasGrosze ? 2 : 0,
    maximumFractionDigits: hasGrosze ? 2 : 0,
  }).format(unitAmount / 100);
}

export function formatPricePerDay(
  unitAmount: number,
  days: number,
  currency: string,
): string | undefined {
  if (!(days > 0) || !(unitAmount > 0)) return undefined;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(unitAmount / 100 / days);
}
