"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SourceFilter } from "@/features/session/types";
import {
  isSourceFilterUiEnabled,
  parseSourceFilter,
  parseSourceFilterOrAll,
} from "@/features/session/lib/sourceFilter";
import { useSourceFilterStore } from "@/features/shared/stores/useSourceFilter";

type Options = {
  product: string;
  profileDefault?: string | null;
  enabled?: boolean;
  syncUrl?: boolean;
};

/**
 * URL `?src=` wygrywa przy pierwszym renderze, potem store (persist), potem profil.
 */
export function useSubjectSourceFilter({
  product,
  profileDefault,
  enabled,
  syncUrl = true,
}: Options): {
  source: SourceFilter;
  setSource: (next: SourceFilter) => void;
  enabled: boolean;
} {
  const live = enabled ?? isSourceFilterUiEnabled(product);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const stored = useSourceFilterStore((s) => s.byProduct[product]);
  const persist = useSourceFilterStore((s) => s.setSource);
  const urlApplied = useRef(false);

  const [source, setSourceState] = useState<SourceFilter>(() => {
    if (!live) return "all";
    const fromUrl = parseSourceFilter(searchParams.get("src"));
    if (fromUrl) return fromUrl;
    return parseSourceFilterOrAll(stored ?? profileDefault);
  });

  useEffect(() => {
    if (!live || urlApplied.current) return;
    urlApplied.current = true;
    const fromUrl = parseSourceFilter(searchParams.get("src"));
    if (fromUrl) {
      setSourceState(fromUrl);
      persist(product, fromUrl);
    }
  }, [live, persist, product, searchParams]);

  useEffect(() => {
    if (!live) return;
    const applyStoredIfNoUrl = () => {
      if (parseSourceFilter(searchParams.get("src"))) return;
      const fromStore = parseSourceFilter(
        useSourceFilterStore.getState().byProduct[product],
      );
      if (fromStore) setSourceState(fromStore);
    };
    if (useSourceFilterStore.persist.hasHydrated()) {
      applyStoredIfNoUrl();
      return;
    }
    return useSourceFilterStore.persist.onFinishHydration(applyStoredIfNoUrl);
  }, [live, product, searchParams]);

  const setSource = useCallback(
    (next: SourceFilter) => {
      setSourceState(next);
      if (!live) return;
      persist(product, next);
      if (!syncUrl) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("src");
      else params.set("src", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [live, pathname, persist, product, router, searchParams, syncUrl],
  );

  return { source: live ? source : "all", setSource, enabled: live };
}
