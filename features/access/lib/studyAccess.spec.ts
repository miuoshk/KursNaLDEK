import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STUDY_OPTIONS,
  isFreeTestSelection,
  isRegistrationClosedForSelection,
  normalizeTrack,
  normalizeYear,
  selectionSchema,
} from "@/features/access/lib/studyAccess";

describe("studyAccess rules", () => {
  it("has exactly one free test option", () => {
    const free = STUDY_OPTIONS.filter((o) => o.isFreeTest);
    assert.equal(free.length, 1);
    assert.equal(free[0]?.track, "stomatologia");
    assert.equal(free[0]?.year, 2);
  });

  it("does not offer lekarski year 2 in selectable options", () => {
    const lek2 = STUDY_OPTIONS.find((o) => o.track === "lekarski" && o.year === 2);
    assert.equal(lek2, undefined);
    assert.equal(STUDY_OPTIONS.length, 5);
  });

  it("accepts only allowed selection values", () => {
    const ok = selectionSchema.safeParse({ track: "lekarski", year: "3" });
    const badTrack = selectionSchema.safeParse({ track: "farmacja", year: "2" });
    const badYear = selectionSchema.safeParse({ track: "stomatologia", year: "5" });

    assert.equal(ok.success, true);
    assert.equal(badTrack.success, false);
    assert.equal(badYear.success, false);
  });

  it("normalizes unknown profile values safely", () => {
    assert.equal(normalizeTrack("anything"), "stomatologia");
    assert.equal(normalizeTrack("lekarski"), "lekarski");
    assert.equal(normalizeYear(8), 1);
    assert.equal(normalizeYear(2), 2);
  });

  it("marks only stoma year 2 as free test", () => {
    assert.equal(isFreeTestSelection("stomatologia", 2), true);
    assert.equal(isFreeTestSelection("stomatologia", 1), false);
    assert.equal(isFreeTestSelection("lekarski", 2), false);
  });

  it("closes registration only for lekarski year 2", () => {
    assert.equal(isRegistrationClosedForSelection("lekarski", 2), true);
    assert.equal(isRegistrationClosedForSelection("lekarski", 1), false);
    assert.equal(isRegistrationClosedForSelection("lekarski", 3), false);
    assert.equal(isRegistrationClosedForSelection("stomatologia", 2), false);
  });
});
