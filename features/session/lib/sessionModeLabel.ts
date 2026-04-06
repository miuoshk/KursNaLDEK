import type { SessionMode } from "@/features/session/types";

export function sessionModeLabel(mode: SessionMode): string {
  if (mode === "egzamin") return "Egzamin";
  if (mode === "powtorka") return "Powtórka";
  return "Nauka";
}
