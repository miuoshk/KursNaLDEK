/**
 * Polska pluralizacja: zwraca jedną z trzech form w zależności od liczby.
 *
 * Reguły:
 * - n === 1                      → forma 1 (np. "osoba")
 * - n % 10 in [2..4] && n % 100 not in [12..14] → forma 2 (np. "osoby")
 * - reszta                       → forma 3 (np. "osób")
 *
 * Działa na wartości bezwzględnej, więc -1 traktowane jak 1.
 */
export function pluralizePolish(
  count: number,
  forms: [singular: string, plural234: string, pluralMany: string],
): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return forms[0];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/**
 * Czasownik "uczyć się" w 3. os. liczby pojedynczej / mnogiej, dopasowany do
 * polskiej pluralizacji jak wyżej.
 * - 1 osoba uczy się
 * - 2/3/4 osoby uczą się
 * - 5+ / 0 osób uczy się
 */
export function verbUczyPolish(count: number): string {
  return pluralizePolish(count, ["uczy", "uczą", "uczy"]);
}

/**
 * Odmienia słowo "pytanie" zgodnie z liczbą (bez prefiksu liczby).
 * - 1 → "pytanie"
 * - 2/3/4 → "pytania"
 * - 0, 5+, 11–14 → "pytań"
 */
export function pytaniaForm(count: number): string {
  return pluralizePolish(count, ["pytanie", "pytania", "pytań"]);
}

/**
 * Zwraca pełny string "{count} pytanie|pytania|pytań".
 * Najczęściej używany helper w UI.
 */
export function formatQuestionsCount(count: number): string {
  return `${count} ${pytaniaForm(count)}`;
}

/**
 * Odmienia słowo "powtórka" zgodnie z liczbą.
 * - 1 → "powtórka"
 * - 2/3/4 → "powtórki"
 * - 0, 5+, 11–14 → "powtórek"
 */
export function powtorkaForm(count: number): string {
  return pluralizePolish(count, ["powtórka", "powtórki", "powtórek"]);
}

/**
 * Odmienia słowo "dział" zgodnie z liczbą.
 * - 1 → "dział"
 * - 2/3/4 → "działy"
 * - 0, 5+, 11–14 → "działów"
 */
export function dzialForm(count: number): string {
  return pluralizePolish(count, ["dział", "działy", "działów"]);
}
