import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export type CheckoutConsentTranslator = (
  key: "withdrawalWaiver" | "termsAcceptance",
  values?: Record<string, string>,
) => string;

/** Tekst checkboxa zgody na stronie Stripe Checkout (obsługuje Markdown). */
export function buildStripeTermsAcceptanceMessage(
  origin: string,
  t: CheckoutConsentTranslator,
): string {
  const regulaminUrl = `${origin}${LEGAL_DOCUMENTS.regulamin.href}`;
  const politykaUrl = `${origin}${LEGAL_DOCUMENTS.politykaPrywatnosci.href}`;
  const waiver = t("withdrawalWaiver");

  return t("termsAcceptance", { waiver, regulaminUrl, politykaUrl });
}

export function getConsumerWithdrawalWaiverText(t: CheckoutConsentTranslator): string {
  return t("withdrawalWaiver");
}

export const CONSUMER_CONSENT_ACCESS_DAYS = 45;
