export type SessionMode = "inteligentna" | "przeglad" | "katalog";

export type Confidence = "nie_wiedzialem" | "troche" | "na_pewno";

export interface SessionQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  difficulty: string;
  sourceCode: string | null;
  topicName: string;
  /** Id tematu z bazy (ANTARES); opcjonalne dla starszych payloadów. */
  topicId?: string;
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
