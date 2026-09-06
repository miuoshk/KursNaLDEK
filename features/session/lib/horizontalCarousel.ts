/** Delta kółka / trackpada na poziomy scroll karuzeli. */
export function horizontalScrollDelta(deltaX: number, deltaY: number): number {
  return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
}

/** Czy ten delta da się jeszcze zużyć w kontenerze (nie jesteśmy na krawędzi). */
export function canConsumeHorizontalDelta(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  delta: number,
): boolean {
  if (scrollWidth <= clientWidth + 1) return false;
  if (delta === 0) return false;
  if (delta < 0 && scrollLeft <= 1) return false;
  if (delta > 0 && scrollLeft + clientWidth >= scrollWidth - 1) return false;
  return true;
}
