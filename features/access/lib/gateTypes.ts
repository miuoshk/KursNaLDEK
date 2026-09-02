export type GateCardState = "locked" | "trial" | "owned";

export type GateCard = {
  id: string;
  kierunek: string;
  rok: string;
  state: GateCardState;
  featured?: boolean;
  featuredLabel?: string;
  summary: string;
  price?: { amount: string; note: string; perDay?: string };
  remainingDays?: number | null;
  stripePriceId?: string;
  href?: string;
  checkoutFields?: Record<string, string>;
  activateFields?: Record<string, string>;
  enterFields?: Record<string, string>;
};

export type PricingGateCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  trialName?: string;
  featuredLabel: string;
};

export function resolveGateCardState(isFreeTest: boolean, isUnlocked: boolean): GateCardState {
  if (isUnlocked) return "owned";
  if (isFreeTest) return "trial";
  return "locked";
}
