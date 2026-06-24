import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasCombinatorialOptions,
  isCombinatorialOptionText,
} from "@/features/session/lib/combinatorialOptions";
import { hasFixedOptionLetterRefsInExplanation } from "@/features/session/lib/explanationOptionRefs";
import {
  orderSessionOptions,
  sessionOptionLetter,
  shouldKeepFixedOptionOrder,
  type SessionOption,
} from "@/features/session/lib/sessionOptionOrder";

const PLAIN_OPTIONS: SessionOption[] = [
  { id: "a", text: "2 ATP" },
  { id: "b", text: "4 ATP" },
  { id: "c", text: "30-32 ATP" },
  { id: "d", text: "36-38 ATP" },
  { id: "e", text: "24 ATP" },
];

const COMBO_OPTIONS: SessionOption[] = [
  { id: "a", text: "Leży w dole zażuchwowym" },
  { id: "b", text: "języka" },
  { id: "c", text: "prawidłowe B i C" },
  { id: "d", text: "prawidłowe A i B" },
  { id: "e", text: "gardła" },
];

describe("isCombinatorialOptionText", () => {
  it("wykrywa meta-opcje LDEK", () => {
    assert.equal(isCombinatorialOptionText("prawidłowe A i B"), true);
    assert.equal(isCombinatorialOptionText("wszystkie prawidłowe"), true);
    assert.equal(isCombinatorialOptionText("A i B"), true);
    assert.equal(isCombinatorialOptionText("A, C"), true);
    assert.equal(isCombinatorialOptionText("b, d oraz f poprawne"), true);
    assert.equal(isCombinatorialOptionText("a, c, f, g"), true);
    assert.equal(isCombinatorialOptionText("wszystkie z wymienionych"), true);
  });

  it("nie flaguje zwykłej treści merytorycznej", () => {
    assert.equal(isCombinatorialOptionText("Leży w dole zażuchwowym"), false);
    assert.equal(
      isCombinatorialOptionText("Kompleks A i B mitochondrium"),
      false,
    );
    assert.equal(isCombinatorialOptionText("B"), false);
    assert.equal(
      isCombinatorialOptionText(
        "są stosowane w leczeniu zespołu Zollingera-Ellisona",
      ),
      false,
    );
  });
});

describe("hasFixedOptionLetterRefsInExplanation", () => {
  it("wykrywa odwołania (A)–(E) w wyjaśnieniu", () => {
    assert.equal(
      hasFixedOptionLetterRefsInExplanation(
        "Dystraktor (B) jest błędny, poprawna (D).",
      ),
      true,
    );
    assert.equal(
      hasFixedOptionLetterRefsInExplanation("Opcja (A) opisuje nerki."),
      true,
    );
  });

  it("ignoruje inne nawiasy niż wielkie A–E", () => {
    assert.equal(hasFixedOptionLetterRefsInExplanation("(c)' = 0"), false);
    assert.equal(
      hasFixedOptionLetterRefsInExplanation("n. błędnego (X)"),
      false,
    );
    assert.equal(hasFixedOptionLetterRefsInExplanation(""), false);
  });
});

describe("shouldKeepFixedOptionOrder", () => {
  it("blokuje shuffle przy meta-opcjach", () => {
    assert.equal(shouldKeepFixedOptionOrder(COMBO_OPTIONS), true);
  });

  it("blokuje shuffle przy odwołaniach w wyjaśnieniu", () => {
    assert.equal(
      shouldKeepFixedOptionOrder(PLAIN_OPTIONS, {
        explanation: "Błędna jest (C), poprawna (A).",
      }),
      true,
    );
  });

  it("blokuje shuffle przy ręcznym zakazie admina", () => {
    assert.equal(
      shouldKeepFixedOptionOrder(PLAIN_OPTIONS, { disableOptionShuffle: true }),
      true,
    );
  });

  it("pozwala shuffle dla zwykłego pytania", () => {
    assert.equal(shouldKeepFixedOptionOrder(PLAIN_OPTIONS), false);
  });
});

describe("orderSessionOptions", () => {
  const sessionA = "session-a";
  const sessionB = "session-b";

  it("tasuje zwykłe pytanie deterministycznie w ramach sesji", () => {
    const first = orderSessionOptions(sessionA, "q-plain", PLAIN_OPTIONS);
    const second = orderSessionOptions(sessionA, "q-plain", PLAIN_OPTIONS);
    assert.deepEqual(first, second);
    assert.notDeepEqual(first.map((o) => o.id), ["a", "b", "c", "d", "e"]);
  });

  it("zmienia kolejność między sesjami", () => {
    const inA = orderSessionOptions(sessionA, "q-plain", PLAIN_OPTIONS);
    const inB = orderSessionOptions(sessionB, "q-plain", PLAIN_OPTIONS);
    assert.notDeepEqual(
      inA.map((o) => o.id),
      inB.map((o) => o.id),
    );
  });

  it("nie tasuje pytań kombinatorycznych", () => {
    const ordered = orderSessionOptions(sessionA, "q-combo", COMBO_OPTIONS);
    assert.deepEqual(
      ordered.map((o) => o.id),
      ["a", "b", "c", "d", "e"],
    );
  });

  it("nie tasuje gdy wyjaśnienie ma (A)–(E)", () => {
    const ordered = orderSessionOptions(sessionA, "q-expl", PLAIN_OPTIONS, {
      explanation: "Wyjaśnienie o (B) i (D).",
    });
    assert.deepEqual(
      ordered.map((o) => o.id),
      ["a", "b", "c", "d", "e"],
    );
  });

  it("sessionOptionLetter zgadza się z kolejnością wyświetlania", () => {
    const ctx = { explanation: "" };
    const ordered = orderSessionOptions(sessionA, "q-letter", PLAIN_OPTIONS, ctx);
    for (let i = 0; i < ordered.length; i++) {
      const letter = sessionOptionLetter(
        sessionA,
        "q-letter",
        PLAIN_OPTIONS,
        ordered[i]!.id,
        ctx,
      );
      assert.equal(letter, String.fromCharCode(65 + i));
    }
  });
});

describe("hasCombinatorialOptions", () => {
  it("zwraca true gdy choć jedna opcja jest meta", () => {
    assert.equal(hasCombinatorialOptions(COMBO_OPTIONS), true);
    assert.equal(hasCombinatorialOptions(PLAIN_OPTIONS), false);
  });
});
