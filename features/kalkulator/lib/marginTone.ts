import type { CostResult } from "@/features/kalkulator/lib/costing";

export type MarginTone = "positive" | "warning" | "loss";

export function getMarginTone(marginPct: number): MarginTone {
  if (marginPct > 20) return "positive";
  if (marginPct >= 8) return "warning";
  return "loss";
}

export function marginToneColor(tone: MarginTone): string {
  switch (tone) {
    case "positive":
      return "var(--k-margin-positive)";
    case "warning":
      return "var(--k-margin-warning)";
    case "loss":
      return "var(--k-margin-loss)";
  }
}

export function marginToneLabel(tone: MarginTone): string {
  switch (tone) {
    case "positive":
      return "Marża powyżej 20%";
    case "warning":
      return "Marża 8–20%";
    case "loss":
      return "Marża poniżej 8%";
  }
}

export type CostBreakdownSegment = {
  key: "station" | "labor" | "materials" | "margin";
  label: string;
  amount: number;
  pctOfPrice: number;
  color: string;
};

export function buildCostBreakdownSegments(
  price: number,
  result: CostResult,
): CostBreakdownSegment[] {
  if (price <= 0) {
    return [];
  }

  const marginTone = getMarginTone(result.marginPct);

  return [
    {
      key: "station",
      label: "Stanowisko",
      amount: result.stationCost,
      pctOfPrice: (result.stationCost / price) * 100,
      color: "var(--k-primary)",
    },
    {
      key: "labor",
      label: "Praca",
      amount: result.laborCost,
      pctOfPrice: (result.laborCost / price) * 100,
      color: "var(--k-primary-light)",
    },
    {
      key: "materials",
      label: "Materiały",
      amount: result.materialCost,
      pctOfPrice: (result.materialCost / price) * 100,
      color: "#94a3b8",
    },
    {
      key: "margin",
      label: "Marża",
      amount: result.marginPln,
      pctOfPrice: (result.marginPln / price) * 100,
      color: marginToneColor(marginTone),
    },
  ];
}
