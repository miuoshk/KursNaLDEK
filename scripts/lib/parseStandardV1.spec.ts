import assert from "node:assert/strict";
import test from "node:test";
import { isSbaBlocks } from "../../features/shared/lib/explanationBlocks";
import {
  parseStandardV1,
  summarizeParseResults,
  type ParseResult,
} from "./parseStandardV1";

function sba(result: ParseResult) {
  assert.ok(result.item);
  assert.ok(isSbaBlocks(result.item.blocks));
  return result.item.blocks;
}
import {
  charDiffRatio,
  normalizeInvariantText,
  renderExplanationBlocksTs,
} from "./renderExplanationBlocks";
import { similarity, normalizeMatchText, isNumericOptionList } from "./textSimilarity";
import { diffSectionInvariants } from "./sectionInvariant";

const OPTIONS = [
  { id: "a", text: "implantologia i autotransplantacja" },
  { id: "b", text: "rekonstrukcja poresekcyjna" },
  {
    id: "c",
    text: "obecność narządów zmysłów oraz bliskość mózgowia",
  },
  { id: "d", text: "zaburzenia gnatyczne i ślinianki" },
  { id: "e", text: "chirurgia głowy i szyi" },
] as const;

function sample(overrides: {
  explanation: string;
  correct?: string;
  options?: typeof OPTIONS;
}) {
  return parseStandardV1({
    id: "chs-test-001",
    explanation: overrides.explanation,
    options: overrides.options ?? OPTIONS,
    correct_option_id: overrides.correct ?? "c",
  });
}

const FULL = `**✅ Poprawna odpowiedź:** obecność narządów zmysłów oraz bliskość mózgowia

Sąsiedztwo anatomiczne tłumaczy współpracę z laryngologią.

**Dlaczego nie pozostałe?**

- *implantologia i autotransplantacja* — to poszerzenie zakresu, nie topografia.
- *rekonstrukcja poresekcyjna* — wskazuje na protetykę, nie na sąsiedztwo.

> ⚠️ **Pułapka:** formalna przynależność specjalności.

> 💡 **Haczyk:** decyduje to, co leży tuż obok pola.`;

test("pełny szablon → wsad z trap i takeaway", () => {
  const result = sample({ explanation: FULL });
  assert.equal(result.accepted, true);
  assert.equal(sba(result).correctReason.includes("Sąsiedztwo"), true);
  assert.equal(sba(result).distractors?.a?.startsWith("to poszerzenie"), true);
  assert.equal(sba(result).trap, "formalna przynależność specjalności.");
  assert.equal(sba(result).takeaway, "decyduje to, co leży tuż obok pola.");
  assert.deepEqual(result.item?.refs[0], "Standard 1.0 / legacy");
  assert.equal(result.flags.length, 0);
});

test("werdykt niezgodny z kluczem → flaga, pozycja idzie", () => {
  const result = sample({
    explanation: FULL.replace(
      "obecność narządów zmysłów oraz bliskość mózgowia",
      "zupełnie inna opcja której nie ma",
    ),
  });
  assert.equal(result.accepted, true);
  assert.equal(result.flags.some((flag) => flag.code === "verdict_mismatch"), true);
});

test("correctReason > 900 → odrzut too_long", () => {
  const long = "x".repeat(901);
  const result = sample({
    explanation: `**✅ Poprawna odpowiedź:** obecność narządów zmysłów oraz bliskość mózgowia\n\n${long}\n\n**Dlaczego nie pozostałe?**\n\n- *implantologia i autotransplantacja* — nie.\n`,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.flags.some((flag) => flag.code === "too_long"), true);
  assert.equal(result.item, undefined);
});

test("dystraktor bez dopasowania → flaga, reszta idzie", () => {
  const result = sample({
    explanation: FULL.replace(
      "*implantologia i autotransplantacja*",
      "*tekst którego nie ma w opcjach wcale*",
    ),
  });
  assert.equal(result.accepted, true);
  assert.equal(sba(result).distractors?.a, undefined);
  assert.ok(sba(result).distractors?.b);
  assert.equal(
    result.flags.some((flag) => flag.code === "distractor_unmatched"),
    true,
  );
});

test("tabela między werdyktem a Dlaczego → contrast, nie correctReason", () => {
  const table = `| Cecha | A | B |
|---|---|---|
| jeden | x | y |`;
  const result = sample({
    explanation: `**✅ Poprawna odpowiedź:** obecność narządów zmysłów oraz bliskość mózgowia

Sąsiedztwo anatomiczne.

${table}

**Dlaczego nie pozostałe?**

- *implantologia i autotransplantacja* — nie.
`,
  });
  assert.equal(result.accepted, true);
  assert.equal(sba(result).correctReason.includes("|"), false);
  assert.ok(sba(result).contrast);
  assert.equal(sba(result).contrast?.[0][0], "Cecha");
});

test("tabela 3×3 → contrast; za duża → flaga i pominięcie", () => {
  const table = `| Cecha | A | B |
|---|---|---|
| jeden | x | y |
| dwa | x | y |`;
  const ok = sample({
    explanation: `${FULL}\n\n${table}\n`,
  });
  assert.equal(ok.accepted, true);
  assert.ok(ok.item?.blocks.contrast);
  assert.equal(ok.item?.blocks.contrast?.[0].length, 3);

  const big = `| A | B | C | D |
|---|---|---|---|
| 1 | 2 | 3 | 4 |`;
  const bad = sample({
    explanation: `**✅ Poprawna odpowiedź:** obecność narządów zmysłów oraz bliskość mózgowia

Powód.

**Dlaczego nie pozostałe?**

- *implantologia i autotransplantacja* — nie.

${big}
`,
  });
  assert.equal(bad.accepted, true);
  assert.equal(bad.item?.blocks.contrast, undefined);
  assert.equal(
    bad.flags.some((flag) => flag.code === "contrast_too_big"),
    true,
  );
});

test("takeaway > 200 → flaga, pole pominięte, pozycja idzie", () => {
  const long = "s".repeat(201);
  const result = sample({
    explanation: FULL.replace(
      "decyduje to, co leży tuż obok pola.",
      long,
    ),
  });
  assert.equal(result.accepted, true);
  assert.equal(sba(result).takeaway, undefined);
  assert.equal(
    result.flags.some((flag) => flag.code === "takeaway_too_long"),
    true,
  );
});

test("reszta poza szablonem → odrzut unparsed_remainder", () => {
  const result = sample({
    explanation: `${FULL}\n\nDodatkowe zdanie poza szablonem.\n`,
  });
  assert.equal(result.accepted, false);
  assert.equal(
    result.flags.some((flag) => flag.code === "unparsed_remainder"),
    true,
  );
  assert.equal(result.item, undefined);
});

test("similarity: identyczne po normalizacji ≥ 0.85", () => {
  assert.ok(
    similarity(
      normalizeMatchText("Włókniak szkliwiakowy, wykrywany zwykle."),
      normalizeMatchText("włókniak szkliwiakowy wykrywany zwykle"),
    ) >= 0.85,
  );
});

test("listy numeryczne wykrywane po normalizacji", () => {
  assert.equal(isNumericOptionList("1, 2 i 3"), true);
  assert.equal(isNumericOptionList("1 oraz 4"), true);
  assert.equal(isNumericOptionList("stwierdzenia 1, 2 i 3"), false);
});

test("inwariant per sekcja: pełny szablon bez różnic", () => {
  const input = {
    id: "chs-test-001",
    explanation: FULL,
    options: OPTIONS,
    correct_option_id: "c",
  };
  const result = parseStandardV1(input);
  assert.deepEqual(diffSectionInvariants(input, result), []);
});

test("inwariant: render ≈ oryginał po normalizacji", () => {
  const result = sample({ explanation: FULL });
  assert.ok(result.item);
  const rendered = renderExplanationBlocksTs(
    result.item.blocks,
    OPTIONS,
    "c",
  );
  const ratio = charDiffRatio(
    normalizeInvariantText(FULL),
    normalizeInvariantText(rendered),
  );
  assert.ok(ratio <= 0.05, `ratio ${ratio}`);
});

test("chs-04-109: zbiór liczb, nie similarity — 1 i 2 ≠ 1, 2, 4 i 5", () => {
  const options = [
    { id: "a", text: "2, 3 i 4" },
    { id: "b", text: "3 i 5" },
    { id: "c", text: "2 i 4" },
    { id: "d", text: "1, 2, 4 i 5" },
    { id: "e", text: "1 i 2" },
  ] as const;
  const result = parseStandardV1({
    id: "chs-04-109",
    correct_option_id: "c",
    options,
    explanation: `**✅ Poprawna odpowiedź:** stwierdzenia 2 i 4

Typy tej skazy różni ilość i jakość czynnika.

**Dlaczego nie pozostałe?**

- *1, 2, 4 i 5* — dokłada przewagę częstości typu drugiego.
- *1 i 2* — dokłada przewagę częstości typu drugiego nad pierwszym.
- *3 i 5* — łączy błędne dziedziczenie sprzężone z płcią.

> 💡 **Haczyk:** trzy czwarte przypadków to typ pierwszy.
`,
  });
  assert.equal(result.accepted, true);
  assert.equal(sba(result).distractors?.d?.startsWith("dokłada przewagę"), true);
  assert.equal(sba(result).distractors?.e?.startsWith("dokłada przewagę częstości typu drugiego nad"), true);
  assert.equal(sba(result).distractors?.b?.startsWith("łączy błędne"), true);
  assert.equal(sba(result).distractors?.a, undefined);
  assert.equal(
    result.flags.some((flag) => flag.code === "distractor_unmatched"),
    false,
  );
});

test("elimination nie dotyczy list numerycznych — tylko zbiór liczb", () => {
  const options = [
    { id: "a", text: "1 i 2" },
    { id: "b", text: "3 i 4" },
    { id: "c", text: "2 i 4" },
    { id: "d", text: "1, 2, 4 i 5" },
    { id: "e", text: "same słowa bez liczb" },
  ] as const;
  const result = parseStandardV1({
    id: "chs-numeric-elim",
    correct_option_id: "c",
    options,
    explanation: `**✅ Poprawna odpowiedź:** 2 i 4

Powód.

**Dlaczego nie pozostałe?**

- *1, 2, 4 i 5* — zestaw czterech.
- *1 i 2* — tylko dwa pierwsze.
- *niepasujący opis* — nie trafia w e.
`,
  });
  assert.equal(sba(result).distractors?.d, "zestaw czterech.");
  assert.equal(sba(result).distractors?.a, "tylko dwa pierwsze.");
  assert.equal(sba(result).distractors?.e, undefined);
  assert.equal(
    result.flags.some((flag) => flag.code === "distractor_matched_by_elimination"),
    false,
  );
  assert.equal(
    result.flags.some((flag) => flag.code === "distractor_unmatched"),
    true,
  );
});

test("elimination: jedna pozostała opcja i similarity ≥ 0.5", () => {
  const result = sample({
    explanation: `**✅ Poprawna odpowiedź:** obecność narządów zmysłów oraz bliskość mózgowia

Powód.

**Dlaczego nie pozostałe?**

- *implantologia i autotransplantacja* — to poszerzenie zakresu.
- *zaburzenia gnatyczne i ślinianki* — inny problem kliniczny.
- *chirurgia głowy i szyi* — to nazwa specjalności, nie topografia.
- *rekonstrukcja tkanek* — wskazuje na protetykę.
`,
  });
  assert.equal(result.accepted, true);
  assert.ok(sba(result).distractors?.a);
  assert.ok(sba(result).distractors?.b);
  assert.equal(
    result.flags.some((flag) => flag.code === "distractor_matched_by_elimination"),
    true,
  );
});

test("zbiorcze liczniki", () => {
  const summary = summarizeParseResults([
    sample({ explanation: FULL }),
    sample({
      explanation: `${FULL}\n\nśmieć\n`,
    }),
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.accepted, 1);
  assert.equal(summary.rejected, 1);
});
