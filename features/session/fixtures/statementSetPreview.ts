import type { ExplanationBlocksStatementSet } from "@/features/shared/lib/explanationBlocks";
import type { SessionQuestion } from "@/features/session/types";

/**
 * Wyraźnie testowy przykład zestawienia. To nie jest konwersja pytania
 * podręcznikowego ani wsad produkcyjny.
 */
export const TEST_STATEMENT_SET_BLOCKS: ExplanationBlocksStatementSet = {
  version: 2,
  questionType: "statement_set",
  takeaway: "Najpierw oceń każde stwierdzenie, potem złóż z nich zestaw.",
  statements: [
    {
      id: "s1",
      number: 1,
      text: "Koło ma jedną krawędź",
      isTrue: true,
      rationale: "W tym teście koło liczymy jako jedną zamkniętą krawędź.",
    },
    {
      id: "s2",
      number: 2,
      text: "Trójkąt ma cztery boki",
      isTrue: false,
      rationale: "Trójkąt ma trzy boki, nie cztery.",
      correction: "Trójkąt ma trzy boki.",
    },
    {
      id: "s3",
      number: 3,
      text: "Kwadrat ma cztery kąty proste",
      isTrue: true,
      rationale: "To definicja prostokątności kwadratu.",
    },
    {
      id: "s4",
      number: 4,
      text: "Sześciokąt foremny ma trzy boki",
      isTrue: false,
      rationale: "Sześciokąt ma sześć boków, nie trzy.",
    },
    {
      id: "s5",
      number: 5,
      text: "Pięciokąt foremny ma równe boki",
      isTrue: true,
      rationale: "Foremność oznacza równe boki i kąty.",
    },
  ],
  optionStatements: {
    a: ["s1", "s2", "s3"],
    b: ["s1", "s3", "s5"],
    c: ["s1", "s2", "s5"],
    d: ["s2", "s3", "s5"],
    e: ["s1", "s3"],
  },
  trap: "Łatwo wziąć numer z opcji za numer stwierdzenia po tasowaniu.",
};

export const TEST_STATEMENT_SET_QUESTION: SessionQuestion = {
  id: "ufo-test-statement-set",
  topicId: "ufo-test",
  text: "TEST UFO. Które stwierdzenia są prawdziwe?\n\n1) Koło ma jedną krawędź\n2) Trójkąt ma cztery boki\n3) Kwadrat ma cztery kąty proste\n4) Sześciokąt foremny ma trzy boki\n5) Pięciokąt foremny ma równe boki",
  options: [
    { id: "a", text: "1, 2 i 3" },
    { id: "b", text: "1, 3 i 5" },
    { id: "c", text: "1, 2 i 5" },
    { id: "d", text: "2, 3 i 5" },
    { id: "e", text: "1 i 3" },
  ],
  correctOptionId: "b",
  explanation:
    "Starsza proza A–E nie powinna wejść do nowego widoku, gdy są kompletne bloki zestawienia.",
  explanationBlocks: TEST_STATEMENT_SET_BLOCKS,
  conceptIds: [],
  sourceCode: "UFO-TEST-SET",
  imageUrl: null,
  topicName: "TEST UFO — zestawienie",
  disableOptionShuffle: true,
};
