/** Wyjaśnienie odwołuje się do opcji po literach UI w nawiasie: (A), (B)… */
export function hasFixedOptionLetterRefsInExplanation(
  explanation: string,
): boolean {
  if (!explanation?.trim()) return false;
  return /\([A-E]\)/.test(explanation);
}
