import { TEST_STATEMENT_SET_QUESTION } from "@/features/session/fixtures/statementSetPreview";
import type { SessionAnswer, SessionQuestion } from "@/features/session/types";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";

const SBA_BLOCKS: ExplanationBlocksV2 = {
  version: 2,
  correctReason:
    "Kierunek cięcia wyznacza układ korzeni — to przykład testowy, nie treść podręcznikowa.",
  takeaway: "Cięcie przecina linię łączącą korzenie prostopadle.",
  trap: "Łatwo pomylić oś żuchwy z osią korony.",
  distractors: {
    b: "To idzie wzdłuż korzeni i ich nie rozdziela.",
    c: "Jedno cięcie nie wystarcza w tym przykładzie.",
    d: "Odwrócony kierunek naraża ściany zębodołu.",
  },
};

const LONG_TOPIC =
  "Podstawy chirurgii wyrostka zębodołowego cz. II — bardzo długa nazwa tematu do odczytania na telefonie";

function sbaQuestion(
  id: string,
  extras: Partial<SessionQuestion> = {},
): SessionQuestion {
  return {
    id,
    topicId: "ufo-accept",
    text: "TEST UFO. Wskaż prawidłowy sposób prowadzenia cięcia rozdzielającego korzenie.",
    options: [
      { id: "a", text: "wzdłuż długiej osi trzonu żuchwy" },
      { id: "b", text: "w poprzek długiej osi wyrostka zębodołowego" },
      { id: "c", text: "jedno cięcie równoległe do wyrostka" },
      { id: "d", text: "od ściany zębodołu ku środkowi korony" },
      { id: "e", text: "w poprzek długiej osi trzonu żuchwy" },
    ],
    correctOptionId: "e",
    explanation: "Starsza proza A–E nie powinna wejść, gdy są kompletne bloki SBA.",
    explanationBlocks: SBA_BLOCKS,
    conceptIds: [],
    sourceCode: "UFO-ACCEPT-SBA",
    imageUrl: null,
    topicName: LONG_TOPIC,
    disableOptionShuffle: true,
    ...extras,
  };
}

export const UFO_ACCEPTANCE_QUESTIONS: SessionQuestion[] = [
  sbaQuestion("ufo-accept-sba-wrong"),
  sbaQuestion("ufo-accept-sba-correct", {
    text: "TEST UFO. To samo zagadnienie — wariant z poprawną odpowiedzią.",
  }),
  {
    ...TEST_STATEMENT_SET_QUESTION,
    id: "ufo-accept-set-wrong",
    topicName: LONG_TOPIC,
  },
  {
    ...TEST_STATEMENT_SET_QUESTION,
    id: "ufo-accept-set-correct",
    topicName: LONG_TOPIC,
  },
  sbaQuestion("ufo-accept-legacy", {
    explanationBlocks: null,
    explanation:
      "Starsza proza wyjaśnienia. W tym przykładzie nie ma bloków UFO — student czyta zwykły tekst.",
    topicName: LONG_TOPIC,
  }),
  sbaQuestion("ufo-accept-unavailable", {
    explanationBlocks: null,
    explanationBlocksStatus: "invalid",
    explanationBlocksIssue: {
      code: "key_mismatch",
      detail: "statement_set consistency failed: key_mismatch",
    },
    explanation: "Ta proza nie może wejść do widoku studenta.",
    topicName: LONG_TOPIC,
  }),
  sbaQuestion("ufo-accept-last", {
    text: "TEST UFO. Ostatnie pytanie sesji przykładowej.",
    topicName: LONG_TOPIC,
  }),
];

export const UFO_ACCEPTANCE_ANSWERS: Record<string, SessionAnswer> = {
  "ufo-accept-sba-wrong": {
    questionId: "ufo-accept-sba-wrong",
    selectedOptionId: "a",
    isCorrect: false,
    confidence: "nie_wiedzialem",
    timeSpentSeconds: 12,
  },
  "ufo-accept-sba-correct": {
    questionId: "ufo-accept-sba-correct",
    selectedOptionId: "e",
    isCorrect: true,
    confidence: "troche",
    timeSpentSeconds: 8,
  },
  "ufo-accept-set-wrong": {
    questionId: "ufo-accept-set-wrong",
    selectedOptionId: "a",
    isCorrect: false,
    confidence: "nie_wiedzialem",
    timeSpentSeconds: 20,
  },
  "ufo-accept-set-correct": {
    questionId: "ufo-accept-set-correct",
    selectedOptionId: "b",
    isCorrect: true,
    confidence: "na_pewno",
    timeSpentSeconds: 15,
  },
  "ufo-accept-legacy": {
    questionId: "ufo-accept-legacy",
    selectedOptionId: "a",
    isCorrect: false,
    confidence: null,
    timeSpentSeconds: 9,
  },
  "ufo-accept-unavailable": {
    questionId: "ufo-accept-unavailable",
    selectedOptionId: "b",
    isCorrect: false,
    confidence: null,
    timeSpentSeconds: 7,
  },
  "ufo-accept-last": {
    questionId: "ufo-accept-last",
    selectedOptionId: "e",
    isCorrect: true,
    confidence: "troche",
    timeSpentSeconds: 6,
  },
};
