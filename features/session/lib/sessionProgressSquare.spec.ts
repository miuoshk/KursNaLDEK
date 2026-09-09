import assert from "node:assert/strict";
import test from "node:test";
import { sessionProgressSquareClass } from "@/features/session/lib/sessionProgressSquare";

test("bieżące pytanie zachowuje wynik i obrys pozycji", () => {
  const currentCorrect = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: true,
    isWrong: false,
  });
  assert.match(currentCorrect, /bg-success/);
  assert.match(currentCorrect, /ring-2/);
  assert.doesNotMatch(currentCorrect, /bg-white\/15/);

  const currentWrong = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: false,
    isWrong: true,
  });
  assert.match(currentWrong, /bg-error/);
  assert.match(currentWrong, /ring-2/);
  assert.doesNotMatch(currentWrong, /bg-white\/15/);
});

test("nieodpowiedziane bieżące ma obrys bez koloru wyniku", () => {
  const currentOpen = sessionProgressSquareClass({
    isCurrent: true,
    isCorrect: false,
    isWrong: false,
  });
  assert.match(currentOpen, /bg-white\/15/);
  assert.match(currentOpen, /ring-2/);
  assert.doesNotMatch(currentOpen, /bg-success/);
  assert.doesNotMatch(currentOpen, /bg-error/);
});
