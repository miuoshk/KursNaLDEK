/** Liczba kolejnych błędnych odpowiedzi, po której pytanie staje się leechem. */
export const LEECH_THRESHOLD = 3;

/** Liczba kolejnych poprawnych odpowiedzi potrzebnych, aby zdjąć status leecha. */
export const LEECH_RESET_STREAK = 2;

/**
 * Aktualizuje status leecha na podstawie bieżących serii odpowiedzi i stanu wcześniejszego.
 *
 * Leech: pytanie z ≥ {@link LEECH_THRESHOLD} błędami z rzędu.
 * Reset: gdy student ma ≥ {@link LEECH_RESET_STREAK} poprawnych z rzędu — leech jest zdejmowany,
 * licznik `leechCount` (ile razy pytanie było leechem) pozostaje bez zmian.
 *
 * @param wrongStreak — liczba kolejnych niepoprawnych odpowiedzi
 * @param correctStreak — liczba kolejnych poprawnych odpowiedzi
 * @param currentIsLeech — czy pytanie jest obecnie oznaczone jako leech
 * @param currentLeechCount — skumulowana liczba „wejść” w stan leecha (historia)
 */
export function updateLeechStatus(
  wrongStreak: number,
  correctStreak: number,
  currentIsLeech: boolean,
  currentLeechCount: number,
): { isLeech: boolean; leechCount: number } {
  if (!currentIsLeech && wrongStreak >= LEECH_THRESHOLD) {
    return { isLeech: true, leechCount: currentLeechCount + 1 };
  }
  if (currentIsLeech && correctStreak >= LEECH_RESET_STREAK) {
    return { isLeech: false, leechCount: currentLeechCount };
  }
  return { isLeech: currentIsLeech, leechCount: currentLeechCount };
}
