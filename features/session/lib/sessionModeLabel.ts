import type { SessionMode } from "@/features/session/types";

/** Mapuje tryb zapisany w DB (nauka/egzamin) na tryb UI. */
export function normalizeSessionMode(mode: string): SessionMode {
  if (mode === "nauka") return "inteligentna";
  if (mode === "egzamin") return "przeglad";
  if (
    mode === "inteligentna" ||
    mode === "przeglad" ||
    mode === "katalog" ||
    mode === "osce_topic"
  ) {
    return mode;
  }
  return "inteligentna";
}

export function sessionModeLabel(mode: string): string {
  const normalized = normalizeSessionMode(mode);
  if (normalized === "przeglad") return "Nauka klasyczna";
  if (normalized === "katalog") return "Katalog pytań";
  if (normalized === "osce_topic") return "OSCE";
  return "Inteligentna sesja";
}
