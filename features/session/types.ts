export type KnnpSessionMode = "inteligentna" | "przeglad" | "katalog";
export type SessionMode = KnnpSessionMode | "osce_topic";

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
  sourceCode: string | null;
  imageUrl?: string | null;
  topicName: string;
  /** Id tematu z bazy (ANTARES); opcjonalne dla starszych payloadów. */
  topicId?: string;
  /** Metadane ANTARES per user; tylko tryb inteligentna. */
  antares?: SessionQuestionMeta;
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
