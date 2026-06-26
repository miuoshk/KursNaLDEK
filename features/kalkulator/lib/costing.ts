export interface CostInputs {
  durationMinutes: number;
  assistantShare: number;
  stationCostPerHour: number;
  doctorRatePerHour: number;
  assistantRatePerHour: number;
  materialLines: { quantity: number; unitCost: number }[];
  price: number;
}

export interface CostResult {
  stationCost: number;
  laborCost: number;
  materialCost: number;
  totalCost: number;
  marginPln: number;
  marginPct: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeProcedureCost(i: CostInputs): CostResult {
  const hours = i.durationMinutes / 60;
  const stationCost = round2(i.stationCostPerHour * hours);
  const doctorCost = i.doctorRatePerHour * hours;
  const assistantCost = i.assistantRatePerHour * hours * i.assistantShare;
  const laborCost = round2(doctorCost + assistantCost);
  const materialCost = round2(
    i.materialLines.reduce((s, m) => s + m.quantity * m.unitCost, 0),
  );
  const totalCost = round2(stationCost + laborCost + materialCost);
  const marginPln = round2(i.price - totalCost);
  const marginPct = i.price > 0 ? round2((marginPln / i.price) * 100) : 0;
  return { stationCost, laborCost, materialCost, totalCost, marginPln, marginPct };
}
