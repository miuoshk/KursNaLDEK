import {
  getProgressRetrievability,
  stateFromString,
  type MemorySchedulerSettings,
  type ProgressCardInput,
} from "@/features/session/lib/memory/scheduler";

/**
 * Dane wejściowe do obliczenia retrievability (R) dla pojedynczej karty wg FSRS.
 */
export type RetrievabilityInput = Omit<ProgressCardInput, "state"> & {
  state: "new" | "learning" | "review" | "relearning";
};

/**
 * Mapuje tekstowy stan karty na wartość enum `State` z ts-fsrs.
 *
 * @param s — Stan zapisany jako string (np. z API lub bazy).
 * @returns Odpowiadająca wartość `State`; nieznany string jest traktowany jak `New`.
 */
export { stateFromString };

/**
 * Zwraca retrievability R ∈ [0, 1] — szacunkowe prawdopodobieństwo przypomnienia
 * odpowiedzi w chwili `now`, wg parametrów karty i schedulera FSRS.
 *
 * Dla kart nowych lub bez `last_answered_at` zwraca 0 (brak historii powtórek).
 * W razie błędu obliczeń lub wartości niefinitycznej zwraca 0.
 */
export function getRetrievability(
  input: RetrievabilityInput,
  now = new Date(),
  settings?: Partial<MemorySchedulerSettings>,
): number {
  return getProgressRetrievability(input, now, settings);
}
