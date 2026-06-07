import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

export const CONSUMER_WITHDRAWAL_WAIVER_TEXT =
  "Żądam rozpoczęcia świadczenia (udostępnienia treści cyfrowych) przed upływem 14-dniowego terminu na odstąpienie od umowy i przyjmuję do wiadomości, że w związku z tym tracę prawo do odstąpienia od umowy.";

export const CONSUMER_CONSENT_ACCESS_DAYS = 45;

/** Tekst checkboxa zgody na stronie Stripe Checkout (obsługuje Markdown). */
export function buildStripeTermsAcceptanceMessage(origin: string): string {
  const regulaminUrl = `${origin}${LEGAL_DOCUMENTS.regulamin.href}`;
  const politykaUrl = `${origin}${LEGAL_DOCUMENTS.politykaPrywatnosci.href}`;

  return (
    `${CONSUMER_WITHDRAWAL_WAIVER_TEXT} Akceptuję [Regulamin](${regulaminUrl}) ` +
    `oraz [Politykę prywatności i cookies](${politykaUrl}).`
  );
}
