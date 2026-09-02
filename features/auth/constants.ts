/** Imię i nazwisko: litery dowolnego alfabetu, spacja, myślnik i apostrof (np. „Anna-Maria”, „O'Neil”). */
export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M}' -]*$/u;

export const PERSON_NAME_MIN_LENGTH = 2;
export const PERSON_NAME_MAX_LENGTH = 60;

/**
 * Zestawy „imię nazwisko” odrzucane przy rejestracji jako placeholdery, a nie dane osoby.
 * Porównanie po normalizacji (małe litery, bez diakrytyków, pojedyncze spacje), w obu kolejnościach.
 */
export const BANNED_FULL_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["jan", "kowalski"],
  ["jan", "nowak"],
];

export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isBannedFullName(firstName: string, lastName: string): boolean {
  const first = normalizePersonName(firstName);
  const last = normalizePersonName(lastName);
  return BANNED_FULL_NAMES.some(
    ([bannedFirst, bannedLast]) =>
      (first === bannedFirst && last === bannedLast) || (first === bannedLast && last === bannedFirst),
  );
}
