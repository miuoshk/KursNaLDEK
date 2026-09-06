import assert from "node:assert/strict";
import test from "node:test";
import { NextIntlClientProvider } from "next-intl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { FeedbackVariant } from "@/features/session/lib/adaptiveFeedback";
import type { Confidence, SessionQuestion } from "@/features/session/types";
import type { ExplanationBlocksV2 } from "@/features/shared/lib/explanationBlocks";
import { FeedbackPanel } from "./FeedbackPanel";

const MESSAGES = {
  common: { explanation: "Wyjaśnienie" },
  session: {
    correctAnswer: "Poprawna odpowiedź!",
    incorrectAnswer: "Niepoprawna odpowiedź",
    summaryYourAnswer: "Twoja odpowiedź: {selected} · Poprawna: {correct} · {topic}",
    feedbackPrinciple: "Zasada",
    feedbackFullExplanation: "Pokaż pełne wyjaśnienie",
    feedbackWhyOthers: "Dlaczego nie pozostałe?",
    feedbackWhySelected: "Dlaczego ten wybór był mylący",
    feedbackYourChoice: "Twój wybór",
    feedbackTrap: "Pułapka",
    feedbackContrast: "Kontrast",
    feedbackHypercorrection: "Byłeś pewny — to pytanie wróci szybciej",
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
): SessionQuestion {
  return {
    id: "q-fb",
    topicId: "t-1",
    text: "Pytanie testowe",
    options: [
      { id: "a", text: "Opcja alfa poprawna" },
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
  };
}

function renderPanel(input: {
  variant: FeedbackVariant;
  blocks: ExplanationBlocksV2 | null;
  isCorrect: boolean;
  selectedOptionId?: string;
  confidence?: Confidence | null;
  transferScheduled?: boolean;
}): string {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale: "pl",
      messages: MESSAGES,
      timeZone: "Europe/Warsaw",
      children: createElement(FeedbackPanel, {
        sessionId: "sess-snapshot",
        question: baseQuestion(input.blocks),
        selectedOptionId: input.selectedOptionId ?? (input.isCorrect ? "a" : "b"),
        isCorrect: input.isCorrect,
        variant: input.variant,
        confidence: input.confidence ?? null,
        transferScheduled: input.transferScheduled ?? input.variant === "remedial",
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
  assert.match(shot, /Zasada/);
  assert.match(shot, /TAKEAWAY_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /Pokaż pełne wyjaśnienie/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Opcja beta myląca/);
  assert.match(shot, /DIST_B_TOKEN/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Twój wybór/);
  assert.doesNotMatch(shot, /Byłeś pewny/);
  assert.equal(html.split("Zasada").length - 1, 1);
  assertOrder(html, [
    "Poprawna odpowiedź!",
    "Zasada",
    TAKEAWAY,
    "Pokaż pełne wyjaśnienie",
    MECHANISM,
    CONTRAST_A,
    TRAP,
  ]);
  assert.ok(
    html.lastIndexOf(TAKEAWAY) < html.indexOf("Pokaż pełne wyjaśnienie"),
    "w concise Zasada tylko jako nagłówek, bez duplikatu na dole",
  );
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
  assert.match(shot, /Pokaż pełne wyjaśnienie/);
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
  assert.match(shot, /detailsOpen=true/);
  assert.match(shot, /Wyjaśnienie/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /Dlaczego nie pozostałe\?/);
  assert.match(shot, /Opcja beta myląca/);
  assert.match(shot, /Opcja gamma błędna/);
  assert.match(shot, /Opcja delta błędna/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.match(shot, /Zasada/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Twój wybór/);
  assertOrder(html, [
    MECHANISM,
    "Dlaczego nie pozostałe?",
    CONTRAST_A,
    TRAP,
    TAKEAWAY,
  ]);
  assert.ok(
    html.lastIndexOf("Zasada") > html.lastIndexOf(TRAP),
    "Zasada jest ostatnią sekcją w standard",
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
  assert.doesNotMatch(shot, /Dlaczego nie pozostałe/);
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
  assert.match(shot, /Niepoprawna odpowiedź/);
  assert.match(shot, /MECHANISM_TOKEN/);
  assert.match(shot, /Twój wybór/);
  assert.match(shot, /B · Opcja beta myląca/);
  assert.match(shot, /DIST_B_TOKEN/);
  assert.match(shot, /Dlaczego nie pozostałe\?/);
  assert.match(shot, /C · Opcja gamma błędna/);
  assert.match(shot, /DIST_C_TOKEN/);
  assert.match(shot, /TRAP_TOKEN/);
  assert.match(shot, /CONTRAST_OSTRY/);
  assert.match(shot, /KNOWLEDGE_TOKEN/);
  assert.match(shot, /Za kilka pytań/);
  assert.match(shot, /Zasada/);
  assert.doesNotMatch(shot, /LEGACY_EXPLANATION_PROSE/);
  assert.doesNotMatch(shot, /Byłeś pewny/);
  assertOrder(html, [
    "Niepoprawna odpowiedź",
    MECHANISM,
    "Twój wybór",
    DIST_B,
    "Dlaczego nie pozostałe?",
    DIST_C,
    CONTRAST_A,
    TRAP,
    KNOWLEDGE,
    "Za kilka pytań",
    TAKEAWAY,
  ]);
  assert.ok(
    html.lastIndexOf("Zasada") > html.lastIndexOf("Za kilka pytań"),
    "Zasada jest ostatnią sekcją w remedial",
  );
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
  assert.doesNotMatch(shot, /Dlaczego ten wybór był mylący/);
  assert.doesNotMatch(shot, /MECHANISM_TOKEN/);
});

test("standard × błąd × experiment off: box Twój wybór zawsze", () => {
  const html = renderPanel({
    variant: "standard",
    blocks: FULL_BLOCKS,
    isCorrect: false,
    selectedOptionId: "b",
    confidence: "na_pewno",
  });
  assert.match(html, /Twój wybór/);
  assert.match(html, /B · Opcja beta myląca/);
  assert.match(html, /DIST_B_TOKEN/);
  assert.match(html, /data-feedback-section="your-choice"/);
  assert.doesNotMatch(html, /B · Opcja beta myląca[\s\S]*B · Opcja beta myląca/);
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
  assert.match(shot, /Byłeś pewny — to pytanie wróci szybciej/);
  assertOrder(html, [
    "Niepoprawna odpowiedź",
    "Byłeś pewny — to pytanie wróci szybciej",
    MECHANISM,
  ]);
});
