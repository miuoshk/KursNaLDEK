import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNickChangeAllowed } from "./nick";

describe("isNickChangeAllowed", () => {
  it("lets a grandfathered short nick stay unchanged", () => {
    assert.equal(isNickChangeAllowed("mk", "mk"), true);
    assert.equal(isNickChangeAllowed("abc", "ABC"), true);
  });

  it("requires 5 characters for a new or replaced nick", () => {
    assert.equal(isNickChangeAllowed(null, "mk"), false);
    assert.equal(isNickChangeAllowed("mk", "miko"), false);
    assert.equal(isNickChangeAllowed("abc", "abcd"), false);
    assert.equal(isNickChangeAllowed("mk", "milosz"), true);
    assert.equal(isNickChangeAllowed(null, "medic"), true);
  });
});
