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
