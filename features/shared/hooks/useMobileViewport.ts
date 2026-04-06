"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

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

/** True przy szerokości poniżej 768px — sidebar w trybie overlay. */
export function useMobileViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
