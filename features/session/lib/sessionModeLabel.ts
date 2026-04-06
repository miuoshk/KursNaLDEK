import type { SessionMode } from "@/features/session/types";

export function sessionModeLabel(mode: SessionMode): string {
  if (mode === "przeglad") return "Szybki przegląd";
  if (mode === "katalog") return "Katalog pytań";
  return "Inteligentna sesja";
}
