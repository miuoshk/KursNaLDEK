export function formatOfferAmount(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
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
