"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isRycinaId, sanitizeRycinaSvg } from "@/features/shared/lib/sanitizeRycinaSvg";

type Props = {
  id: string;
  /** Pixel size of the square mark. */
  size?: number;
  className?: string;
};

const cache = new Map<string, Promise<string | null>>();

function loadEmblem(id: string): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const request = fetch(`/img/ryciny/${id}.svg`)
    .then((res) => (res.ok ? res.text() : null))
    .then((raw) => (raw ? sanitizeRycinaSvg(raw) : null))
    .catch(() => null);
  cache.set(id, request);
  return request;
}

/**
 * Inline atlas mark that inherits `currentColor`.
 * Baked gold/sage plates should use `Rycina` instead.
 */
export function RycinaEmblem({ id, size = 32, className }: Props) {
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    if (!isRycinaId(id)) return;
    let cancelled = false;
    loadEmblem(id).then((svg) => {
      if (!cancelled) setMarkup(svg);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!isRycinaId(id) || !markup) {
    return (
      <span
        aria-hidden
        className={cn("inline-block shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
