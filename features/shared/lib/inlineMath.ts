/** Inline `$...$` segments — block `$$...$$` stays in markdown pipeline. */
export const INLINE_MATH_PATTERN = /(\$[^$\n]+\$)/g;

export function splitInlineMath(text: string): string[] {
  if (!text.includes("$")) return [text];
  return text.split(INLINE_MATH_PATTERN).filter((part) => part.length > 0);
}

export function stripInlineMathDelimiters(segment: string): string {
  return segment.slice(1, -1);
}

export function isInlineMathSegment(segment: string): boolean {
  return segment.startsWith("$") && segment.endsWith("$") && segment.length > 2;
}
