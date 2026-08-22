import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SourceFilter } from "@/features/session/types";
import { parseSourceFilter } from "@/features/session/lib/sourceFilter";

type SourceFilterStore = {
  byProduct: Record<string, SourceFilter>;
  setSource: (product: string, source: SourceFilter) => void;
};

export const useSourceFilterStore = create<SourceFilterStore>()(
  persist(
    (set) => ({
      byProduct: {},
      setSource: (product, source) =>
        set((state) => ({
          byProduct: { ...state.byProduct, [product]: source },
        })),
    }),
    {
      name: "kursnaldek-source-filter-v1",
      partialize: (s) => ({ byProduct: s.byProduct }),
    },
  ),
);

export function sourceFromStore(
  product: string,
  fallback: SourceFilter = "all",
): SourceFilter {
  return parseSourceFilter(useSourceFilterStore.getState().byProduct[product]) ?? fallback;
}
