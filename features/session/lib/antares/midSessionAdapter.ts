import type { SessionQuestion } from "@/features/session/types";
import type { RankedQuestion } from "./sessionComposer";

/** Stan bieżącej sesji: dotychczasowe odpowiedzi i jeszcze niepokazane pytania (z kompozytora). */
export type SessionState = {
  answeredSoFar: {
    isCorrect: boolean;
    confidence: string;
    timeSeconds: number;
  }[];
  remainingQuestions: RankedQuestion[];
};

/**
 * `RankedQuestion` z polami pomocniczymi ustawianymi przez {@link adaptRemainingQuestions}.
 */
export type RankedQuestionWithAdaptFlags = RankedQuestion & {
  _needsEasierSwap?: boolean;
  _needsHarderSwap?: boolean;
};

/** Mapuje pytanie z UI na model rankingu ANTARES. */
export function sessionQuestionToRanked(q: SessionQuestion): RankedQuestion {
  return {
    questionId: q.id,
    topicId: q.topicId ?? q.topicName,
    score: 0,
    isLeech: false,
    difficulty: q.difficulty,
  };
}

function rankDiff(d: string): number {
  const x = normalizeDifficulty(d);
  if (x === "latwe") return 1;
  if (x === "srednie") return 2;
  return 3;
}

function normalizeDifficulty(d: string): "latwe" | "srednie" | "trudne" {
  const x = d.trim().toLowerCase();
  if (x === "latwe" || x === "easy" || x === "łatwe") return "latwe";
  if (x === "trudne" || x === "hard") return "trudne";
  return "srednie";
}

function accuracyOf(
  slice: { isCorrect: boolean; confidence: string; timeSeconds: number }[],
): number {
  if (slice.length === 0) return 0;
  return slice.filter((a) => a.isCorrect).length / slice.length;
}

function avgTime(
  slice: { isCorrect: boolean; confidence: string; timeSeconds: number }[],
): number {
  if (slice.length === 0) return 0;
  return (
    slice.reduce((s, a) => s + Math.max(0, a.timeSeconds), 0) / slice.length
  );
}

/**
 * Dostosowuje listę pozostałych pytań: w trybie „flow” (70–85% trafności w ostatnich 5)
 * kolejność i trudność pozostają bez zmian; przy zbyt niskiej lub zbyt wysokiej trafności
 * oznacza pytania do potencjalnej podmiany na łatwiejsze / trudniejsze.
 *
 * Wynik to tablica `RankedQuestion` z opcjonalnymi polami `_needsEasierSwap` / `_needsHarderSwap`.
 */
export function adaptRemainingQuestions(
  state: SessionState,
): RankedQuestionWithAdaptFlags[] {
  const last = state.answeredSoFar.slice(-5);
  if (last.length < 5) {
    return state.remainingQuestions.map((q) => ({ ...q }));
  }

  const recentAccuracy = accuracyOf(last);

  if (recentAccuracy >= 0.7 && recentAccuracy <= 0.85) {
    return state.remainingQuestions.map((q) => ({ ...q }));
  }

  if (recentAccuracy < 0.5) {
    return state.remainingQuestions.map((q) => {
      const lab = normalizeDifficulty(q.difficulty);
      return {
        ...q,
        _needsEasierSwap: lab === "trudne",
      };
    });
  }

  if (recentAccuracy > 0.9) {
    return state.remainingQuestions.map((q) => {
      const lab = normalizeDifficulty(q.difficulty);
      return {
        ...q,
        _needsHarderSwap: lab === "latwe",
      };
    });
  }

  return state.remainingQuestions.map((q) => ({ ...q }));
}

/**
 * Podmienia kolejność pozostałych pytań: dla flag łatwiej/trudniej szuka odpowiedniego kandydata
 * dalej w liście i zamienia miejscami; gdy brak lepszego dopasowania — lista bez zmian.
 */
export function applyDifficultySwapsToRemaining(
  remaining: SessionQuestion[],
  adapted: RankedQuestionWithAdaptFlags[],
): SessionQuestion[] {
  if (remaining.length !== adapted.length) {
    return [...remaining];
  }
  const out = remaining.map((q) => ({ ...q }));
  for (let i = 0; i < out.length; i++) {
    const a = adapted[i];
    if (a._needsEasierSwap) {
      let bestJ = -1;
      let bestRank = rankDiff(out[i].difficulty);
      for (let j = i + 1; j < out.length; j++) {
        const r = rankDiff(out[j].difficulty);
        if (r < bestRank) {
          bestRank = r;
          bestJ = j;
        }
      }
      if (bestJ >= 0) {
        const t = out[i];
        out[i] = out[bestJ];
        out[bestJ] = t;
      }
    } else if (a._needsHarderSwap) {
      let bestJ = -1;
      let bestRank = rankDiff(out[i].difficulty);
      for (let j = i + 1; j < out.length; j++) {
        const r = rankDiff(out[j].difficulty);
        if (r > bestRank) {
          bestRank = r;
          bestJ = j;
        }
      }
      if (bestJ >= 0) {
        const t = out[i];
        out[i] = out[bestJ];
        out[bestJ] = t;
      }
    }
  }
  return out;
}

/**
 * Wykrywa spadek formy (zmęczenie) na podstawie pierwszych vs ostatnich odpowiedzi w sesji.
 */
export function detectFatigue(
  answers: SessionState["answeredSoFar"],
): { isFatigued: boolean; suggestion: string | null } {
  if (answers.length < 15) {
    return { isFatigued: false, suggestion: null };
  }

  const first10 = answers.slice(0, 10);
  const last10 = answers.slice(-10);

  const accFirst = accuracyOf(first10);
  const accLast = accuracyOf(last10);
  const accuracyDrop = accFirst - accLast;

  const avgTimeFirst = avgTime(first10);
  const avgTimeLast = avgTime(last10);
  const timeIncrease =
    avgTimeFirst > 0.001 ? avgTimeLast / avgTimeFirst : avgTimeLast > 0 ? 2 : 1;

  const fatigued = accuracyDrop > 0.2 || timeIncrease > 1.5;

  return {
    isFatigued: fatigued,
    suggestion: fatigued
      ? "Twoja skuteczność spada — rozważ przerwę. Lepiej 2 krótkie sesje niż 1 długa."
      : null,
  };
}
