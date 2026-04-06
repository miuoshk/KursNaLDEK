"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 1023px)";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True when viewport is below 1024px — sidebar should present as collapsed.
 */
export function useNarrowViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
