/**
 * Flagi produktowe — dwie stałe, nie platforma.
 *
 * Zmienne `NEXT_PUBLIC_*` są wstrzykiwane przy buildzie, nie czytane w runtime.
 * Zmiana flagi wymaga redeployu na Vercelu. To nie jest kill switch.
 */
export const FEATURES = {
  cemSource: process.env.NEXT_PUBLIC_FEATURE_CEM_SOURCE === "true",
} as const;
