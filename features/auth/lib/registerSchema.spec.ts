import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerSchema } from "./registerSchema";
import { isBannedFullName } from "../constants";

const valid = {
  firstName: "Anna",
  lastName: "Zielińska",
  acceptTerms: "on",
  nick: "anna.z",
  email: "anna@example.com",
  password: "haslo1234",
  confirmPassword: "haslo1234",
  courseType: "ldew",
  currentTrack: null,
  currentYear: "",
  avatarEmoji: "🙂",
};

function firstIssue(input: Record<string, unknown>): string | undefined {
  const parsed = registerSchema.safeParse(input);
  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

describe("registerSchema", () => {
  it("accepts a complete, real name", () => {
    const parsed = registerSchema.safeParse(valid);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.acceptTerms, true);
      assert.equal(parsed.data.firstName, "Anna");
    }
  });

  it("requires first and last name separately", () => {
    assert.equal(firstIssue({ ...valid, firstName: "" }), "firstNameRequired");
    assert.equal(firstIssue({ ...valid, firstName: "A" }), "firstNameRequired");
    assert.equal(firstIssue({ ...valid, lastName: null }), "lastNameRequired");
  });

  it("rejects digits and symbols in names but allows hyphen, apostrophe, diacritics", () => {
    assert.equal(firstIssue({ ...valid, firstName: "Jan2" }), "nameInvalidChars");
    assert.equal(firstIssue({ ...valid, lastName: "Nowak!" }), "nameInvalidChars");
    assert.equal(firstIssue({ ...valid, firstName: "Anna-Maria", lastName: "O'Neil" }), undefined);
    assert.equal(firstIssue({ ...valid, firstName: "Łukasz", lastName: "Źrałek" }), undefined);
  });

  it("collapses inner whitespace", () => {
    const parsed = registerSchema.safeParse({ ...valid, firstName: "  Anna   Maria " });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data.firstName, "Anna Maria");
  });

  it("bans placeholder names regardless of case, diacritics and order", () => {
    assert.equal(firstIssue({ ...valid, firstName: "Jan", lastName: "Kowalski" }), "namePlaceholderNotAllowed");
    assert.equal(firstIssue({ ...valid, firstName: "JAN", lastName: "NOWAK" }), "namePlaceholderNotAllowed");
    assert.equal(firstIssue({ ...valid, firstName: "Nowak", lastName: "Jan" }), "namePlaceholderNotAllowed");
    assert.equal(firstIssue({ ...valid, firstName: "Jań", lastName: "Kowalskí" }), "namePlaceholderNotAllowed");
    assert.equal(firstIssue({ ...valid, firstName: "Janusz", lastName: "Kowalski" }), undefined);
    assert.equal(isBannedFullName("Anna", "Nowak"), false);
  });

  it("requires accepting terms", () => {
    assert.equal(firstIssue({ ...valid, acceptTerms: null }), "termsRequired");
    assert.equal(firstIssue({ ...valid, acceptTerms: "off" }), "termsRequired");
    assert.equal(firstIssue({ ...valid, acceptTerms: "true" }), undefined);
  });

  it("keeps knnp track/year rules", () => {
    assert.equal(firstIssue({ ...valid, courseType: "knnp" }), "trackRequired");
    assert.equal(
      firstIssue({ ...valid, courseType: "knnp", currentTrack: "stomatologia", currentYear: "2" }),
      undefined,
    );
  });
});
