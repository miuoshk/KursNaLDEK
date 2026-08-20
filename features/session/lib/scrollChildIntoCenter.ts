/** Scrolls `child` horizontally to the center of `container` without moving the page. */
export function scrollChildIntoCenter(
  container: HTMLElement,
  child: HTMLElement,
  behavior: ScrollBehavior = "smooth",
): void {
  const cRect = container.getBoundingClientRect();
  const iRect = child.getBoundingClientRect();
  const next =
    container.scrollLeft + (iRect.left - cRect.left) - (cRect.width - iRect.width) / 2;
  container.scrollTo({ left: Math.max(0, next), behavior });
}
