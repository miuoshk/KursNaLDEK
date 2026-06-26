import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aggregateMonthlyReport } from "@/features/kalkulator/lib/aggregateMonthlyReport";
import { buildDecisionRecommendation } from "@/features/kalkulator/lib/buildDecisionRecommendation";

describe("aggregateMonthlyReport", () => {
  it("agreguje wykonania per procedura z trendem miesięcznym", () => {
    const report = aggregateMonthlyReport(
      [
        {
          id: "1",
          procedure_id: "p1",
          performed_at: "2026-06-05",
          snap_margin_pct: 14,
          snap_margin_pln: 140,
          snap_price: 1000,
          procedures: { id: "p1", name: "Endo 1-kanałowe", price: 1000 },
        },
        {
          id: "2",
          procedure_id: "p1",
          performed_at: "2026-06-12",
          snap_margin_pct: 16,
          snap_margin_pln: 160,
          snap_price: 1000,
          procedures: { id: "p1", name: "Endo 1-kanałowe", price: 1000 },
        },
        {
          id: "3",
          procedure_id: "p1",
          performed_at: "2026-05-20",
          snap_margin_pct: 10,
          snap_margin_pln: 100,
          snap_price: 1000,
          procedures: { id: "p1", name: "Endo 1-kanałowe", price: 1000 },
        },
      ],
      [{ id: "p1", name: "Endo 1-kanałowe", price: 1000 }],
      "2026-06",
    );

    assert.equal(report.rows.length, 1);
    assert.equal(report.rows[0]?.executionCount, 2);
    assert.equal(report.rows[0]?.avgMarginPct, 15);
    assert.equal(report.rows[0]?.totalMarginPln, 300);
    assert.equal(report.rows[0]?.marginTrendPp, 5);
    assert.equal(report.rows[0]?.countTrend, 1);
  });
});

describe("buildDecisionRecommendation", () => {
  it("proponuje podwyżkę ceny gdy marża poniżej benchmarku endo", () => {
    const recommendation = buildDecisionRecommendation({
      procedureId: "p1",
      procedureName: "Endo 1-kanałowe",
      avgMarginPct: 14,
      currentPrice: 900,
    });

    assert.ok(recommendation);
    assert.match(recommendation.message, /Twoje endo: marża 14/);
    assert.match(recommendation.message, /900–1[\s\u00a0]?000 zł/);
    assert.match(recommendation.message, /Podnieś cenę o ~100 zł/);
  });

  it("nie rekomenduje gdy marża powyżej benchmarku", () => {
    const recommendation = buildDecisionRecommendation({
      procedureId: "p1",
      procedureName: "Endo 1-kanałowe",
      avgMarginPct: 20,
      currentPrice: 1000,
    });

    assert.equal(recommendation, null);
  });
});
