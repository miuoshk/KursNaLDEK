/** Klik tej samej opcji odznacza; klik innej podmienia wstępny wybór. */
export function nextSelectedOptionId(
  current: string | null,
  clicked: string,
): string | null {
  return current === clicked ? null : clicked;
}
