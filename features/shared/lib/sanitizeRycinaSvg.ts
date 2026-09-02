const RYCINA_ID = /^[a-z0-9-]+$/;

export function isRycinaId(id: string): boolean {
  return RYCINA_ID.test(id);
}

/** Strips scripts and event handlers from a first-party atlas SVG. */
export function sanitizeRycinaSvg(raw: string): string | null {
  const start = raw.indexOf("<svg");
  const end = raw.lastIndexOf("</svg>");
  if (start < 0 || end < 0) return null;

  let svg = raw.slice(start, end + 6);
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  svg = svg.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  svg = svg.replace(/\s(?:href|xlink:href)\s*=\s*("|')(?!#)/gi, " data-href=$1");
  svg = svg.replace(/<svg([^>]*)>/i, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\swidth\s*=\s*("[^"]*"|'[^']*')/i, "")
      .replace(/\sheight\s*=\s*("[^"]*"|'[^']*')/i, "");
    return `<svg${cleaned} width="100%" height="100%">`;
  });
  return svg;
}
