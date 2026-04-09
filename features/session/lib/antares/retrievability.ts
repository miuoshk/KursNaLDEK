import { fsrs, type Card, State } from "ts-fsrs";

const scheduler = fsrs({ request_retention: 0.9, maximum_interval: 365 });

/**
 * Dane wejściowe do obliczenia retrievability (R) dla pojedynczej karty wg FSRS.
 */
export type RetrievabilityInput = {
  stability: number;
  difficulty_rating: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: "new" | "learning" | "review" | "relearning";
  next_review: string | null;
  last_answered_at: string | null;
};

/**
 * Mapuje tekstowy stan karty na wartość enum `State` z ts-fsrs.
 *
 * @param s — Stan zapisany jako string (np. z API lub bazy).
 * @returns Odpowiadająca wartość `State`; nieznany string jest traktowany jak `New`.
 */
export function stateFromString(s: string): State {
  switch (s) {
    case "new":
      return State.New;
    case "learning":
      return State.Learning;
    case "review":
      return State.Review;
    case "relearning":
      return State.Relearning;
    default:
      return State.New;
  }
}

/**
 * Buduje obiekt `Card` ts-fsrs z danych wejściowych (spójnie z logiką powtórek w aplikacji).
 */
function inputToCard(input: RetrievabilityInput, now: Date): Card {
  return {
    due: input.next_review ? new Date(input.next_review) : now,
    stability: input.stability,
    difficulty: input.difficulty_rating,
    elapsed_days: input.elapsed_days,
    scheduled_days: input.scheduled_days,
    learning_steps: 0,
    reps: input.reps,
    lapses: input.lapses,
    state: stateFromString(input.state),
    last_review: input.last_answered_at
      ? new Date(input.last_answered_at)
      : undefined,
  };
}

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
): number {
  if (input.state === "new" || !input.last_answered_at) {
    return 0;
  }

  try {
    const card = inputToCard(input, now);
    const r = scheduler.get_retrievability(card, now, false);
    return Number.isFinite(r) ? r : 0;
  } catch {
    return 0;
  }
}
