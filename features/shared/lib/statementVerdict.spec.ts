import assert from "node:assert/strict";
import test from "node:test";
import {
  markdownHasStatementVerdicts,
  parseStatementVerdictLead,
} from "@/features/shared/lib/statementVerdict";

test("parsuje werdykt prawda / fałsz z numerem", () => {
  assert.deepEqual(
    parseStatementVerdictLead("1) Największa z zatok — prawda."),
    {
      n: "1",
      statement: "Największa z zatok",
      verdict: "prawda",
      ok: true,
    },
  );
  assert.deepEqual(
    parseStatementVerdictLead("3) Przedtrzonowce bliżej dna — fałsz."),
    {
      n: "3",
      statement: "Przedtrzonowce bliżej dna",
      verdict: "fałsz",
      ok: false,
    },
  );
  assert.equal(parseStatementVerdictLead("Zwykły akapit bez werdyktu."), null);
});

test("wykrywa zestawieniowe w markdownzie v2.2", () => {
  const md = [
    "**1) Start od drożności nosa — fałsz.** Reszta akapitu.",
    "**2) Opukiwanie ściany bocznej — prawda.** Reszta.",
  ].join("\n\n");
  assert.equal(markdownHasStatementVerdicts(md), true);
  assert.equal(markdownHasStatementVerdicts("Mechanizm bez stwierdzeń."), false);
});
