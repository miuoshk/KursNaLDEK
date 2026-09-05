import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  achievementRycinaId,
  DASHBOARD_RYCINA,
  emptyRycinaId,
  rankRycinaId,
  subjectRycina,
} from "./rycinaCatalog";
import { isRycinaId, sanitizeRycinaSvg } from "./sanitizeRycinaSvg";

describe("rycinaCatalog", () => {
  it("maps LDEW subjects to card plates", () => {
    assert.equal(subjectRycina("ldew-endodoncja")?.plate, "ldew-card-endodoncja");
    assert.equal(subjectRycina("ldew-choroby-sluzowki")?.emblem, "ldew-sluzowka");
  });

  it("maps stoma and lek shells to the same KNNP emblem", () => {
    assert.equal(subjectRycina("stoma-anatomia")?.emblem, "subj-anatomia");
    assert.equal(subjectRycina("lek-anatomia")?.emblem, "subj-anatomia");
    assert.equal(subjectRycina("stoma-farmakologia")?.plate, "pharma-opium-poppy");
    assert.equal(subjectRycina("stoma-angielski")?.plate, "anat-tongue");
  });

  it("gives remaining KNNP shells a card plate", () => {
    assert.equal(subjectRycina("stoma-histologia")?.plate, "histo-plate-enamel");
    assert.equal(subjectRycina("lek-histologia")?.plate, "histo-plate-enamel");
    assert.equal(subjectRycina("stoma-chemia")?.plate, "pharma-aconitum");
    assert.equal(subjectRycina("stoma-socjologia")?.plate, "scene-doctor");
    assert.equal(subjectRycina("stoma-narzad-zucia")?.plate, "anat-masseter");
    assert.equal(subjectRycina("lek-biologia-mol")?.plate, "anat-brain-sagittal");
  });

  it("does not invent a bacteriology plate", () => {
    assert.equal(subjectRycina("lek-mikrobio"), undefined);
  });

  it("maps ranks and achievements, skipping the missing wszechstronny file", () => {
    assert.equal(rankRycinaId("mistrz"), "rank-mistrz");
    assert.equal(achievementRycinaId("pierwsza-sesja"), "ach-pierwsza-sesja");
    assert.equal(achievementRycinaId("wszechstronny"), undefined);
  });

  it("maps empty-state kinds", () => {
    assert.equal(emptyRycinaId("saved"), "empty-saved");
    assert.equal(emptyRycinaId("stats"), "empty-stats");
  });

  it("maps dashboard plates from the delivered SVG set", () => {
    assert.equal(DASHBOARD_RYCINA.statsPlate, "erythroxylon");
    assert.equal(DASHBOARD_RYCINA.achievementsPlate, "miedzioryt-postacie-kontur");
    assert.equal(DASHBOARD_RYCINA.settingsPlate, "armillar");
  });
});

describe("sanitizeRycinaSvg", () => {
  it("accepts atlas ids and rejects path tricks", () => {
    assert.equal(isRycinaId("subj-anatomia"), true);
    assert.equal(isRycinaId("../secret"), false);
  });

  it("keeps the svg and strips scripts", () => {
    const svg = sanitizeRycinaSvg(
      `<svg viewBox="0 0 64 64" width="64" height="64"><script>alert(1)</script><path fill="currentColor" d="M0 0"/></svg>`,
    );
    assert.ok(svg);
    assert.equal(svg.includes("<script>"), false);
    assert.equal(svg.includes("width=\"100%\""), true);
    assert.equal(svg.includes("viewBox=\"0 0 64 64\""), true);
  });
});
