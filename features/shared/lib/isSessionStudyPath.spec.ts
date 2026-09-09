import assert from "node:assert/strict";
import test from "node:test";
import { isSessionStudyPath } from "@/features/shared/lib/isSessionStudyPath";

test("ścieżka sesji i lokalny odbiór UFO używają chrome sesji", () => {
  assert.equal(isSessionStudyPath("/sesja/abc-123"), true);
  assert.equal(isSessionStudyPath("/dev/ufo-odbior"), true);
  assert.equal(isSessionStudyPath("/dev/ufo-zestawienie"), false);
  assert.equal(isSessionStudyPath("/przedmioty"), false);
  assert.equal(isSessionStudyPath("/sesja/abc/podsumowanie"), false);
});
