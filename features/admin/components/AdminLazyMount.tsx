"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  /** Margines przed wejściem w viewport (np. „200px” = wcześniejsze dogrywanie). */
  rootMargin?: string;
};

/** Renderuje dzieci dopiero po wejściu sekcji w viewport — odciąża SSR i fetch API. */
export function AdminLazyMount({
  children,
  fallback,
  rootMargin = "240px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || mounted) return;

    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  return <div ref={ref}>{mounted ? children : fallback}</div>;
}
