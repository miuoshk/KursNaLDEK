/** Zgodne z triggerem DB `calc_station_cost` na tabeli practices. */
export function computeStationCostPerHour(
  monthlyStationCost: number,
  stationHoursPerMonth: number,
): number | null {
  if (stationHoursPerMonth <= 0 || !Number.isFinite(monthlyStationCost)) {
    return null;
  }
  return Math.round((monthlyStationCost / stationHoursPerMonth) * 100) / 100;
}

export function sumMonthlyStationCosts(parts: {
  rent: number;
  utilities: number;
  amortization: number;
  admin: number;
}): number {
  return parts.rent + parts.utilities + parts.amortization + parts.admin;
}
