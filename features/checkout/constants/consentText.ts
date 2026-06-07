export const CONSUMER_WITHDRAWAL_WAIVER_TEXT =
  "Żądam rozpoczęcia świadczenia (udostępnienia treści cyfrowych) przed upływem 14-dniowego terminu na odstąpienie od umowy i przyjmuję do wiadomości, że w związku z tym tracę prawo do odstąpienia od umowy.";

export const CONSUMER_CONSENT_FIELD = "consumerConsent";

export const CONSUMER_CONSENT_ACCESS_DAYS = 45;

export function isConsumerConsentAccepted(value: FormDataEntryValue | null): boolean {
  return value === "1" || value === "on" || value === "true";
}
