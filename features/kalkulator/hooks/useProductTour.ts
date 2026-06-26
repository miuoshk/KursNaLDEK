"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUCT_TOUR_STORAGE_KEY, PRODUCT_TOUR_STEPS } from "@/features/kalkulator/data/productTour";

export function useProductTour(enabled: boolean) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const done = localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY) === "done";
    setActive(!done);
    setStepIndex(0);
  }, [enabled]);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PRODUCT_TOUR_STORAGE_KEY, "done");
    }
    setActive(false);
  }, []);

  const next = useCallback(() => {
    setStepIndex((current) =>
      current >= PRODUCT_TOUR_STEPS.length - 1 ? current : current + 1,
    );
  }, []);

  return { active, stepIndex, dismiss, next, setStepIndex };
}
