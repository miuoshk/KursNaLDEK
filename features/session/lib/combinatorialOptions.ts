type OptionLike = { text: string };

const CORRECTNESS_WORD =
  /(?:prawidłowe|prawidłowa|prawidłowy|prawidłowej|fałszywe|fałszywa|fałszywy|błędne|błędna|błędny|poprawne|poprawna|poprawnej|prawdziwe|prawdziwa|nieprawidłowe|niepoprawne)/i;

const ALL_NONE_WORD =
  /(?:prawidłowe|fałszywe|błędne|poprawne|prawdziwe|nieprawidłowe|niepoprawne|powyższe|poniższe|powyzsze|odpowiedzi|wymienione|mechanizmy)/i;

const OPTION_LETTER = /(?:^|[^A-Za-z])[A-E](?:[^A-Za-z]|$)/;

const LETTER_PAIR = /[A-E]\s+i\s+[A-E]/i;

const LETTER_COMMA_LIST = /[A-E]\s*,\s*[A-E]/i;

const LETTER_RANGE = /(?:^|[\s(,—-])[A-E]\s*[-–]\s*[A-E](?:[^A-Za-z]|$)/i;

/** Goła meta-opcja: „A i B", „A, C" — nie pojedyncza litera (np. limfocyt B). */
const BARE_LETTER_OPTION =
  /^[A-E]\s+i\s+[A-E](?:\s+łącznie)?(?:\s*\([^)]*\))?\s*$|^[A-E](?:\s*,\s*[A-E])+(?:\s+i\s+[A-E])?(?:\s+łącznie)?(?:\s*\([^)]*\))?\s*$/i;

/** Meta z id opcji w bazie (np. 6 opcji: „b, d oraz f poprawne" lub „a, c, f, g"). */
const LOWERCASE_ID_META =
  /^[a-g](?:\s*,\s*[a-g])*(?:\s+(?:oraz|i)\s+[a-g])+\s+(?:poprawne|prawidłowe)\s*$/i;

const LOWERCASE_ID_LIST = /^[a-g](?:\s*,\s*[a-g])+\s*$/i;

/** Meta-opcje LDEK są zwykle krótkie; długi tekst z „tylko”/„wszystkie” to zwykle treść merytoryczna. */
const META_OPTION_MAX_LEN = 120;

function hasAllOrNoneMeta(text: string): boolean {
  if (/(?:żadne|żadna)/i.test(text)) {
    return /(?:powyższych|poniższych|wymienionych)/i.test(text);
  }
  if (/wszystkie/i.test(text)) {
    if (ALL_NONE_WORD.test(text)) return true;
    if (LETTER_RANGE.test(text)) return true;
    if (LETTER_COMMA_LIST.test(text) || LETTER_PAIR.test(text)) return true;
  }
  return false;
}

function isShortStandaloneMeta(text: string): boolean {
  const t = text.trim();
  if (t.length > META_OPTION_MAX_LEN) return false;
  if (/^wszystkie$/i.test(t)) return true;
  if (/^wszystkie\s+powy/i.test(t)) return true;
  if (
    /^wszystkie\s+(?:odpowiedzi\s+)?(?:są\s+)?(?:prawidłowe|fałszywe|poprawne|prawdziwe|nieprawidłowe|błędne)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^żadne?\s+z\s+powy/i.test(t)) return true;
  if (/^tylko\s+[A-E](?:\s+i\s+[A-E])?$/i.test(t)) return true;
  if (t.length <= 45 && /^wszystkie\s+z\s+wymienionych$/i.test(t)) return true;
  if (t.length <= 55 && /^wszystkie\s+(?:z\s+)?(?:wyżej\s+)?wymienionych$/i.test(t)) return true;
  if (t.length <= 55 && /^żadne?\s+z\s+(?:wyżej\s+)?wymienionych$/i.test(t)) return true;
  return false;
}

function hasLetterCombinationMeta(text: string): boolean {
  const t = text.trim();
  if (LETTER_RANGE.test(t)) return true;
  if (/odpowiedzi?\s+[A-E]/i.test(t) && CORRECTNESS_WORD.test(t)) return true;
  if (/odpowiedzi\s+prawidłowe\s+to\s*:/i.test(t)) return true;
  if (/^(?:poprawna|prawidłowa)\s+odpowiedź\s+[A-E]/i.test(t)) return true;
  if (/^odpowiedź\s+[A-E]\s+i\s+[A-E]/i.test(t)) return true;
  if (/prawidłowa\s+odpowiedź\s+to\s*:/i.test(t)) return true;
  if (LOWERCASE_ID_META.test(t)) return true;
  if (t.length <= 30 && LOWERCASE_ID_LIST.test(t)) return true;
  if (t.length <= 45 && BARE_LETTER_OPTION.test(t)) return true;
  if (!OPTION_LETTER.test(t)) return false;
  if (CORRECTNESS_WORD.test(t)) return true;
  if (/tylko\s+odpowiedzi\s+[A-E]/i.test(t) && CORRECTNESS_WORD.test(t)) {
    return true;
  }
  if (/prawidłowe\s+są\s+tylko\s+odpowiedzi\s+[A-E]/i.test(t)) return true;
  if (LETTER_PAIR.test(t) || LETTER_COMMA_LIST.test(t)) {
    return CORRECTNESS_WORD.test(t) || /tylko/i.test(t) || /wszystkie/i.test(t);
  }
  return false;
}

/** Tekst opcji odwołuje się do innych odpowiedzi po literach A–E (meta-opcja LDEK). */
export function isCombinatorialOptionText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return (
    isShortStandaloneMeta(trimmed) ||
    hasAllOrNoneMeta(trimmed) ||
    hasLetterCombinationMeta(trimmed)
  );
}

export function hasCombinatorialOptions(options: OptionLike[]): boolean {
  return options.some((opt) => isCombinatorialOptionText(opt.text));
}
