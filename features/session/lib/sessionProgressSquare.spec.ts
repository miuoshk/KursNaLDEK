import assert from "node:assert/strict";
import test from "node:test";
import { sessionProgressSquareClass } from "@/features/session/lib/sessionProgressSquare";

test("bieżące pytanie zachowuje wynik i obrys pozycji", () => {
  const currentCorrect = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: true,
    isWrong: false,
  });
  assert.match(currentCorrect, /bg-success\/15/);
  assert.match(currentCorrect, /ring-brand-gold/);
  assert.doesNotMatch(currentCorrect, /bg-white\/15/);

  const currentWrong = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: false,
    isWrong: true,
  });
  assert.match(currentWrong, /bg-error\/15/);
  assert.match(currentWrong, /ring-brand-gold/);
  assert.doesNotMatch(currentWrong, /bg-white\/15/);
});

test("nieodpowiedziane bieżące ma obrys bez koloru wyniku", () => {
  const currentOpen = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: false,
    isWrong: false,
  });
  assert.match(currentOpen, /ring-brand-gold/);
  assert.match(currentOpen, /rounded-full/);
  assert.doesNotMatch(currentOpen, /bg-success/);
  assert.doesNotMatch(currentOpen, /bg-error/);
});
