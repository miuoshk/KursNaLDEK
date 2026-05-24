/** Kalendarzowe YYYY-MM-DD w strefie Europe/Warsaw (en-CA = ISO date). */
export function warsawYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Początek bieżącego dnia w Warszawie, ~50 h wstecz — pokrywa DST i późne sesje. */
export function recentWarsawDayCutoffIso(hoursBack = 50): string {
  return new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();
}
