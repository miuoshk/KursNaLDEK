import assert from "node:assert/strict";
import test from "node:test";
import { NextIntlClientProvider } from "next-intl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import { orderSessionOptions } from "@/features/session/lib/sessionOptionOrder";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";
import { TEST_STATEMENT_SET_QUESTION } from "@/features/session/fixtures/statementSetPreview";
import { FeedbackPanel } from "./FeedbackPanel";

const MESSAGES = {
  common: { explanation: "Wyjaśnienie" },
  session: {
    correctAnswer: "Poprawnie",
    incorrectAnswer: "Niepoprawnie",
    summaryYourAnswer: "Twoja odpowiedź: {selected} · Poprawna: {correct} · {topic}",
    feedbackPrinciple: "Zasada",
    feedbackRemember: "Zapamiętaj",
    feedbackFullExplanation: "Pokaż pełne wyjaśnienie",
    feedbackWhyOthers: "Dlaczego nie pozostałe?",
    feedbackRemaining: "Pozostałe odpowiedzi",
    feedbackWhySelected: "Dlaczego ten wybór był mylący",
    feedbackYourChoice: "Twój wybór",
    feedbackTrap: "Pułapka",
    feedbackConfusion: "Co łatwo pomylić",
    feedbackCorrectOption: "Poprawna odpowiedź",
    feedbackSetSummary: "Twój zestaw: {selected} · Poprawny zestaw: {correct}",
    feedbackSetDiff: "Różnice w zestawie",
    feedbackRemoveFromSet: "Usuń",
    feedbackAddToSet: "Dodaj",
    feedbackRemoveMark: "Do usunięcia z zestawu",
    feedbackAddMark: "Do dodania do zestawu",
    feedbackStatements: "Stwierdzenia",
    feedbackTrue: "Prawda",
    feedbackFalse: "Fałsz",
    feedbackUnavailable: "Wyjaśnienie jest chwilowo niedostępne.",
    feedbackContrast: "Kontrast",
    feedbackHypercorrection: "Błąd przy wysokiej pewności.",
    optionStatusCorrect: "Poprawna",
    optionStatusYours: "Twoja odpowiedź",
    feedbackRemediation: "Krótka remediacja",
    feedbackTransferScheduled:
      "Za kilka pytań sprawdzimy to pojęcie w innym kontekście.",
  },
};

const LEGACY = "LEGACY_EXPLANATION_PROSE";
const TAKEAWAY = "TAKEAWAY_TOKEN";
const MECHANISM = "MECHANISM_TOKEN";
const TRAP = "TRAP_TOKEN";
const DIST_B = "DIST_B_TOKEN";
const DIST_C = "DIST_C_TOKEN";
const DIST_D = "DIST_D_TOKEN";
const OPTION_A = "Opcja alfa poprawna";
const OPTION_B = "Opcja beta myląca";
const OPTION_C = "Opcja gamma błędna";
const OPTION_D = "Opcja delta błędna";
const CONTRAST_A = "CONTRAST_OSTRY";
const CONTRAST_B = "CONTRAST_PRZEWLEKLY";
const KNOWLEDGE = "KNOWLEDGE_TOKEN";

const FULL_BLOCKS: ExplanationBlocksV2 = {
  version: 2,
  correctReason: MECHANISM,
  takeaway: TAKEAWAY,
  trap: TRAP,
  distractors: { b: DIST_B, c: DIST_C, d: DIST_D },
  contrast: [
    ["cecha", "A", "B"],
    ["czas", CONTRAST_A, CONTRAST_B],
  ],
};

const BLOCKS_NO_TAKEAWAY: ExplanationBlocksV2 = {
  version: 2,
  correctReason: MECHANISM,
  trap: TRAP,
  distractors: { b: DIST_B, c: DIST_C, d: DIST_D },
  contrast: [
    ["cecha", "A", "B"],
    ["czas", CONTRAST_A, CONTRAST_B],
  ],
};

function baseQuestion(
  blocks: ExplanationBlocksV2 | null,
  extras: Partial<SessionQuestion> = {},
): SessionQuestion {
  return {
    id: "q-fb",
    topicId: "t-1",
    text: "Pytanie testowe",
    options: [
      { id: "a", text: OPTION_A },
      { id: "b", text: OPTION_B },
      { id: "c", text: OPTION_C },
      { id: "d", text: OPTION_D },
    ],
    correctOptionId: "a",
    explanation: LEGACY,
    explanationBlocks: blocks,
    conceptIds: [],
    sourceCode: null,
    imageUrl: null,
    topicName: "Temat",
    knowledgeCard: KNOWLEDGE,
    disableOptionShuffle: true,
    ...extras,
  };
}

function renderPanel(input: {
  variant: FeedbackVariant;
  blocks: ExplanationBlocksV2 | null;
  isCorrect: boolean;
  selectedOptionId?: string;
  confidence?: Confidence | null;
  transferScheduled?: boolean;
  sessionId?: string;
  question?: SessionQuestion;
  showResult?: boolean;
}): string {
  const question = input.question ?? baseQuestion(input.blocks);
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale: "pl",
      messages: MESSAGES,
      timeZone: "Europe/Warsaw",
      children: createElement(FeedbackPanel, {
        sessionId: input.sessionId ?? "sess-snapshot",
        question,
        selectedOptionId: input.selectedOptionId ?? (input.isCorrect ? "a" : "b"),
        isCorrect: input.isCorrect,
        variant: input.variant,
        confidence: input.confidence ?? null,
        transferScheduled: input.transferScheduled ?? input.variant === "remedial",
        showResult: input.showResult,
      }),
    }),
  );
}

function snapshot(html: string): string {
  const hasBlocks = /data-has-blocks="(true|false)"/.exec(html)?.[1] ?? "?";
  const openDetails = html.includes("<details") && /<details\b[^>]*\bopen\b/.test(html);
  const text = html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `hasBlocks=${hasBlocks}; detailsOpen=${openDetails}; ${text}`;
}

function assertOrder(html: string, tokens: string[]) {
  let cursor = 0;
  for (const token of tokens) {
    const at = html.indexOf(token, cursor);
    assert.ok(at >= 0, `brak tokenu w kolejności: ${token}`);
    cursor = at + token.length;
  }
}

test("snapshot: concise × bloki pełne", () => {
  const html = renderPanel({
    variant: "concise",
    blocks: FULL_BLOCKS,
    isCorrect: true,
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.match(shot, /TAKEAWAY_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /Pozostałe odpowiedzi/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Opcja alfa poprawna/);
  assert.match(shot, /Opcja beta myląca/);
  assert.match(shot, /DIST_B_TOKEN/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.match(shot, /Wyjaśnienie/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Twój wybór/);
  assert.doesNotMatch(shot, /Pokaż pełne wyjaśnienie/);
  assert.doesNotMatch(shot, /Twoja odpowiedź: B · Poprawna: A/);
  assert.equal(html.split(TAKEAWAY).length - 1, 1);
  assertOrder(html, [
    "Poprawnie",
    "Poprawna odpowiedź",
    OPTION_A,
    TAKEAWAY,
    "Wyjaśnienie",
    MECHANISM,
    "Pozostałe odpowiedzi",
    CONTRAST_A,
    TRAP,
  ]);
});

test("snapshot: concise × bloki bez takeaway", () => {
  const html = renderPanel({
    variant: "concise",
    blocks: BLOCKS_NO_TAKEAWAY,
    isCorrect: true,
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.doesNotMatch(shot, /Zasada/);
  assert.doesNotMatch(shot, /TAKEAWAY_TOKEN/);
  assert.match(shot, /Wyjaśnienie/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
});

test("snapshot: concise × brak bloków", () => {
  const html = renderPanel({
    variant: "concise",
    blocks: null,
    isCorrect: true,
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=false/);
  assert.match(shot, /Wyjaśnienie/);
  assert.match(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Zasada/);
  assert.doesNotMatch(shot, /TAKEAWAY_TOKEN/);
  assert.doesNotMatch(shot, /MECHANISM_TOKEN/);
  assert.doesNotMatch(shot, /Pokaż pełne wyjaśnienie/);
});

test("snapshot: standard × bloki pełne", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: FULL_BLOCKS,
    isCorrect: true,
    confidence: "troche",
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.match(shot, /detailsOpen=false/);
  assert.match(shot, /Wyjaśnienie/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /Pozostałe odpowiedzi/);
  assert.match(shot, /Opcja beta myląca/);
  assert.match(shot, /Opcja gamma błędna/);
  assert.match(shot, /Opcja delta błędna/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.match(shot, /TAKEAWAY_TOKEN/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Twój wybór/);
  assert.equal(html.split(TAKEAWAY).length - 1, 1);
  assertOrder(html, [
    TAKEAWAY,
    MECHANISM,
    "Pozostałe odpowiedzi",
    CONTRAST_A,
    TRAP,
  ]);
  assert.ok(
    html.indexOf(TAKEAWAY) < html.indexOf(MECHANISM),
    "Zasada jest nagłówkiem panelu, nie stopką",
  );
});

test("snapshot: standard × bloki bez takeaway", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: BLOCKS_NO_TAKEAWAY,
    isCorrect: true,
    confidence: "na_pewno",
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.match(shot, /detailsOpen=false/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Wyjaśnienie/);
  assert.doesNotMatch(shot, /Zasada/);
  assert.doesNotMatch(shot, /TAKEAWAY_TOKEN/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
});

test("snapshot: standard × brak bloków", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: null,
    isCorrect: true,
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=false/);
  assert.match(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /MECHANISM_TOKEN/);
  assert.doesNotMatch(shot, /Pozostałe odpowiedzi/);
});

test("snapshot: remedial × bloki pełne", () => {
  const html = renderPanel({
    variant: "remedial",
    blocks: FULL_BLOCKS,
    isCorrect: false,
    selectedOptionId: "b",
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.match(shot, /detailsOpen=false/);
  assert.match(shot, /Niepoprawnie/);
  assert.match(shot, /Poprawna odpowiedź/);
  assert.match(shot, /Opcja alfa poprawna/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Twój wybór/);
  assert.match(shot, /Opcja beta myląca/);
  assert.match(shot, /DIST_B_TOKEN/);
  assert.match(shot, /Pozostałe odpowiedzi/);
  assert.match(shot, /Opcja gamma błędna/);
  assert.match(shot, /DIST_C_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.match(shot, /KNOWLEDGE_TOKEN/);
  assert.match(shot, /Za kilka pytań/);
  assert.match(shot, /TAKEAWAY_TOKEN/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Twoja odpowiedź: B · Poprawna: A/);
  assert.doesNotMatch(html, /<em>/);
  assert.equal(html.split(TAKEAWAY).length - 1, 1);
  assert.equal(html.split(OPTION_B).length - 1, 1);
  assertOrder(html, [
    "Niepoprawnie",
    "Poprawna odpowiedź",
    OPTION_A,
    TAKEAWAY,
    "Twój wybór",
    DIST_B,
    MECHANISM,
    "Pozostałe odpowiedzi",
    DIST_C,
    CONTRAST_A,
    TRAP,
    KNOWLEDGE,
    "Za kilka pytań",
  ]);
});

test("snapshot: remedial × bloki bez takeaway", () => {
  const html = renderPanel({
    variant: "remedial",
    blocks: BLOCKS_NO_TAKEAWAY,
    isCorrect: false,
    selectedOptionId: "b",
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=true/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Twój wybór/);
  assert.match(shot, /Wyjaśnienie/);
  assert.doesNotMatch(shot, /Zasada/);
  assert.doesNotMatch(shot, /TAKEAWAY_TOKEN/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
});

test("snapshot: remedial × brak bloków", () => {
  const html = renderPanel({
    variant: "remedial",
    blocks: null,
    isCorrect: false,
    selectedOptionId: "b",
  });
  const shot = snapshot(html);
  assert.match(shot, /hasBlocks=false/);
  assert.match(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.match(shot, /Opcja alfa poprawna/);
  assert.doesNotMatch(shot, /Dlaczego ten wybór był mylący/);
  assert.doesNotMatch(shot, /MECHANISM_TOKEN/);
});

test("standard × błąd: Twój wybór pod Zasadą, bez powtórki opcji", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: FULL_BLOCKS,
    isCorrect: false,
    selectedOptionId: "b",
    confidence: "na_pewno",
  });
  assert.match(html, /Twój wybór/);
  assert.match(html, /Opcja beta myląca/);
  assert.match(html, /DIST_B_TOKEN/);
  assert.match(html, /data-feedback-section="your-choice"/);
  assert.match(html, /Opcja alfa poprawna/);
  assertOrder(html, [TAKEAWAY, "Twój wybór", DIST_B, MECHANISM]);
  assert.doesNotMatch(html, /Opcja beta myląca[\s\S]*Opcja beta myląca/);
});

test("snapshot: remedial × hypercorrection", () => {
  const html = renderPanel({
    variant: "remedial",
    blocks: FULL_BLOCKS,
    isCorrect: false,
    selectedOptionId: "b",
    confidence: "na_pewno",
  });
  const shot = snapshot(html);
  assert.match(shot, /Błąd przy wysokiej pewności/);
  assertOrder(html, [
    "Niepoprawnie",
    "Błąd przy wysokiej pewności.",
    TAKEAWAY,
    "Twój wybór",
    MECHANISM,
  ]);
});

test("concise × błąd: zasada, twój wybór i wyjaśnienie od razu", () => {
  const html = renderPanel({
    variant: "concise",
    blocks: FULL_BLOCKS,
    isCorrect: false,
    selectedOptionId: "b",
  });
  assertOrder(html, [
    "Niepoprawnie",
    OPTION_A,
    TAKEAWAY,
    "Twój wybór",
    DIST_B,
    "Wyjaśnienie",
    MECHANISM,
    "Pozostałe odpowiedzi",
  ]);
});

test("brak opcjonalnych sekcji: nie renderuje pustych nagłówków", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: {
      version: 2,
      correctReason: MECHANISM,
    },
    isCorrect: true,
  });
  assert.match(html, /MECHANISM_TOKEN/);
  assert.doesNotMatch(html, /Zasada/);
  assert.doesNotMatch(html, /Twój wybór/);
  assert.doesNotMatch(html, /Pozostałe odpowiedzi/);
  assert.doesNotMatch(html, /Co łatwo pomylić/);
  assert.doesNotMatch(html, /Kontrast/);
});

test("lista dystraktorów w sesji idzie po literze ekranowej", () => {
  const sessionId = "sess-shuffle-order";
  const question = baseQuestion(FULL_BLOCKS, {
    disableOptionShuffle: false,
    explanation: "Bez odwołań do liter opcji.",
  });
  const ordered = orderSessionOptions(sessionId, question.id, question.options, {
    disableOptionShuffle: false,
    explanation: question.explanation,
  });
  assert.notDeepEqual(
    ordered.map((option) => option.id),
    question.options.map((option) => option.id),
    "ten seed musi przetasować opcje, inaczej test nic nie sprawdza",
  );

  const html = renderPanel({
    variant: "standard",
    blocks: FULL_BLOCKS,
    isCorrect: true,
    confidence: "troche",
    sessionId,
    question,
  });
  const remaining = ordered.filter((option) => option.id !== question.correctOptionId);
  assertOrder(
    html,
    remaining.map((option) => option.text),
  );
});

test("zestawienie: błąd pokazuje różnice i nie powtarza kombinacji A–E", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: TEST_STATEMENT_SET_QUESTION.explanationBlocks ?? null,
    isCorrect: false,
    selectedOptionId: "a",
    question: TEST_STATEMENT_SET_QUESTION,
  });
  assertOrder(html, [
    "Niepoprawnie",
    "Twój zestaw: 1, 2, 3 · Poprawny zestaw: 1, 3, 5",
    "Zasada",
    "Różnice w zestawie",
    "Usuń",
    "Trójkąt ma cztery boki",
    "Dodaj",
    "Pięciokąt foremny ma równe boki",
    "Stwierdzenia",
    "Do usunięcia z zestawu",
    "Do dodania do zestawu",
  ]);
  assert.doesNotMatch(html, /Starsza proza A–E/);
  assert.doesNotMatch(html, /Twój wybór/);
  assert.doesNotMatch(html, /Pozostałe odpowiedzi/);
});

test("sprzeczne bloki: student nie widzi prozy ani korekty", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: null,
    isCorrect: false,
    selectedOptionId: "a",
    question: {
      ...TEST_STATEMENT_SET_QUESTION,
      explanationBlocks: null,
      explanationBlocksStatus: "invalid",
      explanationBlocksIssue: {
        code: "key_mismatch",
        detail: "statement_set consistency failed: key_mismatch",
      },
      explanation: "1) Koło — prawda. Starsza proza A–E nie może wejść.",
    },
  });
  assert.match(html, /Wyjaśnienie jest chwilowo niedostępne/);
  assert.doesNotMatch(html, /Starsza proza A–E/);
  assert.doesNotMatch(html, /key_mismatch/);
  assert.doesNotMatch(html, /Różnice w zestawie/);
});

test("zestawienie: poprawna odpowiedź bez różnic", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: TEST_STATEMENT_SET_QUESTION.explanationBlocks ?? null,
    isCorrect: true,
    selectedOptionId: "b",
    question: TEST_STATEMENT_SET_QUESTION,
  });
  assert.match(html, /Poprawnie/);
  assert.match(html, /Twój zestaw: 1, 3, 5 · Poprawny zestaw: 1, 3, 5/);
  assert.doesNotMatch(html, /Różnice w zestawie/);
  assert.doesNotMatch(html, /Do dodania do zestawu/);
  assert.doesNotMatch(html, /Do usunięcia z zestawu/);
  assert.match(html, /Stwierdzenia/);
});
