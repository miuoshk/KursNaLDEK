import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLANNED_SOURCE_BANK_EXAMS,
  shouldShowSourceBankPills,
  sourceBankCemCount,
  sourceBankOwnCount,
} from "@/features/shared/lib/sourceBankPills";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("sourceBankPills", () => {
  it("pokazuje rząd tylko na produktach z egzaminami CEM", () => {
    assert.equal(shouldShowSourceBankPills("ldew"), true);
    assert.equal(shouldShowSourceBankPills("ldek"), true);
    assert.equal(shouldShowSourceBankPills("knnp"), false);
    assert.equal(shouldShowSourceBankPills(null), false);
  });

  it("bez liczników źródła cała pula jest autorska", () => {
    assert.equal(sourceBankOwnCount(null, 1464), 1464);
    assert.equal(sourceBankCemCount(null), 0);
    assert.equal(
      sourceBankOwnCount({ all: 424, reference: 41, own: 383 }, 424),
      383,
    );
    assert.equal(
      sourceBankCemCount({ all: 424, reference: 41, own: 383 }),
      41,
    );
  });

  it("placeholder egzaminu nie udaje prawdziwego cem_session", () => {
    assert.equal(PLANNED_SOURCE_BANK_EXAMS.length, 1);
    assert.equal(PLANNED_SOURCE_BANK_EXAMS[0]?.id.startsWith("planned-"), true);
  });

  it("dashboard i dialog montują pigułki przez hasCemExams, nie przez flagę CEM", () => {
    const dashboard = readFileSync(
      join(root, "features/subjects/components/SubjectDashboardClient.tsx"),
      "utf8",
    );
    const dialog = readFileSync(
      join(root, "features/subjects/components/TopicSessionConfigDialog.tsx"),
      "utf8",
    );
    const pills = readFileSync(
      join(root, "features/shared/components/SourceBankPills.tsx"),
      "utf8",
    );
    assert.match(dashboard, /SourceBankPills/);
    assert.match(dashboard, /shouldShowSourceBankPills/);
    assert.match(dialog, /SourceBankPills/);
    assert.match(dialog, /shouldShowSourceBankPills/);
    assert.doesNotMatch(pills, /FEATURES\.cemSource/);
    assert.doesNotMatch(dialog, /sourceSession|tryb źródła|SourceMode/);
  });
});
