/**
 * Zliczenia odpowiedzi według poziomu pewności (confidence) używane do oceny kalibracji.
 */
export type CalibrationData = {
  /** Ile razy wybrano „na pewno” i odpowiedź była poprawna. */
  na_pewno_correct: number;
  /** Ile razy łącznie wybrano „na pewno”. */
  na_pewno_total: number;
  /** Ile razy wybrano „nie wiedziałem” i odpowiedź była poprawna. */
  nie_wiedzialem_correct: number;
  /** Ile razy łącznie wybrano „nie wiedziałem”. */
  nie_wiedzialem_total: number;
};

/**
 * Oblicza wskaźnik kalibracji pewności w zakresie [-1, 1].
 *
 * - Ujemne wartości (blisko -1): nadmierna pewność — często „na pewno” przy błędach.
 * - W okolicach 0: dobra kalibracja.
 * - Dodatnie (blisko +1): niedopewnienie — często „nie wiedziałem” przy poprawnych odpowiedziach.
 *
 * Wzór: `underconf - overconf`, gdzie `overconf` to odchylenie trafności przy „na pewno” od ideału,
 * a `underconf` — udział poprawnych przy „nie wiedziałem”.
 */
export function calibrationScore(data: CalibrationData): number {
  const overconf =
    data.na_pewno_total > 0
      ? 1 - data.na_pewno_correct / data.na_pewno_total
      : 0;
  const underconf =
    data.nie_wiedzialem_total > 0
      ? data.nie_wiedzialem_correct / data.nie_wiedzialem_total
      : 0;
  return underconf - overconf;
}
