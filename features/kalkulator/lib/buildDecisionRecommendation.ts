import {
  getBenchmarkMarginPct,
  getMarketPriceRange,
  getProcedureShortLabel,
  matchReferenceProcedure,
} from "@/features/kalkulator/lib/matchReferenceProcedure";

export type DecisionRecommendation = {
  procedureId: string;
  procedureName: string;
  avgMarginPct: number;
  benchmarkMarginPct: number;
  message: string;
};

export function buildDecisionRecommendation(input: {
  procedureId: string;
  procedureName: string;
  avgMarginPct: number;
  currentPrice: number;
}): DecisionRecommendation | null {
  const reference = matchReferenceProcedure(input.procedureName);
  if (!reference) return null;

  const benchmarkMarginPct = getBenchmarkMarginPct(reference);
  if (input.avgMarginPct >= benchmarkMarginPct) return null;

  const { low, high } = getMarketPriceRange(reference);
  const shortLabel = getProcedureShortLabel(input.procedureName, reference);

  let suggestedIncrease = 0;
  if (input.currentPrice < high) {
    suggestedIncrease = Math.max(50, Math.round((high - input.currentPrice) / 50) * 50);
  } else {
    suggestedIncrease = Math.max(
      50,
      Math.round(((benchmarkMarginPct - input.avgMarginPct) / 100) * input.currentPrice),
    );
  }

  const marginFormatted = input.avgMarginPct.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const message = `Twoje ${shortLabel}: marża ${marginFormatted}%. Rynek: cena ${low.toLocaleString("pl-PL")}–${high.toLocaleString("pl-PL")} zł. Podnieś cenę o ~${suggestedIncrease.toLocaleString("pl-PL")} zł, zostaniesz konkurencyjny.`;

  return {
    procedureId: input.procedureId,
    procedureName: input.procedureName,
    avgMarginPct: input.avgMarginPct,
    benchmarkMarginPct,
    message,
  };
}
