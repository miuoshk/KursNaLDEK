/** WCAG contrast for documented session tile/panel pairs (sRGB). */

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(fg: string, bg: string, alpha: number): string {
  const fn = parseInt(fg.slice(1), 16);
  const bn = parseInt(bg.slice(1), 16);
  const mixCh = (shift: number) => {
    const f = (fn >> shift) & 255;
    const b = (bn >> shift) & 255;
    return Math.round(f * alpha + b * (1 - alpha));
  };
  const r = mixCh(16);
  const g = mixCh(8);
  const b = mixCh(0);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const CARD = "#0a2322";
const PRIMARY = "#E8E0D0";
const SECONDARY = "#8B9E8B";
const SUCCESS = "#4ADE80";
const ERROR = "#F87171";

export const SESSION_CONTRAST = {
  neutralTile: contrastRatio(PRIMARY, CARD),
  keyTile: contrastRatio(PRIMARY, mix(SUCCESS, CARD, 0.15)),
  wrongTile: contrastRatio(PRIMARY, mix(ERROR, CARD, 0.15)),
  collapsedTile: contrastRatio(SECONDARY, CARD),
  panelSecondary: contrastRatio(SECONDARY, CARD),
} as const;
