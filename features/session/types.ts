import type { StructuredExplanation } from "@/features/session/lib/structuredExplanation";

export type KnnpSessionMode = "inteligentna" | "przeglad" | "katalog";
export type SessionMode = KnnpSessionMode;

/** Filtr puli pytań — nie tryb nauki. `reference` rozwija się przez referenceSources(product). */
export type SourceFilter = "all" | "reference" | "own";

export type Confidence = "nie_wiedzialem" | "troche" | "na_pewno";

/** Stan karty pytania u usera — przekazywany do sesji (ANTARES). */
export type SessionQuestionMeta = {
  retrievability: number;
  fsrsDifficulty: number;
  isLeech: boolean;
  isNew: boolean;
  priorAccuracy: number | null;
  avgTimeSeconds: number | null;
  topicMastery: number;
};

export interface SessionQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  explanationBlocks?: StructuredExplanation | null;
  sourceCode: string | null;
  imageUrl?: string | null;
  topicName: string;
  /** Krótka karta wiedzy tematu, używana wyłącznie w remediacji. */
  knowledgeCard?: string | null;
  /** Id tematu z bazy (ANTARES); opcjonalne dla starszych payloadów. */
  topicId?: string;
  /** Kontrolowany słownik pojęć używany do transferu i remediacji. */
  conceptIds?: string[];
  /** Metadane ANTARES per user; tylko tryb inteligentna. */
  antares?: SessionQuestionMeta;
  /** Ręczny zakaz shuffle opcji (admin) lub wykryta kombinatoryka — opcje w stałej kolejności. */
  disableOptionShuffle?: boolean;
  source?: string;
  repeatCount?: number;
  firstSeenSession?: string | null;
  sourceExam?: string | null;
  cemSessionLabel?: string | null;
  cemQuestionNumber?: number | null;
}

export interface SessionState {
  sessionId: string;
  questions: SessionQuestion[];
  currentIndex: number;
  answers: SessionAnswer[];
  mode: SessionMode;
  isShowingFeedback: boolean;
  selectedOptionId: string | null;
}

export interface SessionAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  confidence: Confidence | null;
  timeSpentSeconds: number;
}
