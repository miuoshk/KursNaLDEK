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

export type SessionModeTranslator = (
  key: "modeClassic" | "modeCatalog" | "modeOsce" | "modeSmart",
) => string;

export function sessionModeLabel(mode: string, t: SessionModeTranslator): string {
  const normalized = normalizeSessionMode(mode);
  if (normalized === "przeglad") return t("modeClassic");
  if (normalized === "katalog") return t("modeCatalog");
  if (normalized === "osce_topic") return t("modeOsce");
  return t("modeSmart");
}
