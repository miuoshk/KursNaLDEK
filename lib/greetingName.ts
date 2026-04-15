/** Imię do powitania: preferuje full_name; fallback do display_name i emaila. */
export function greetingName(
  profile: { full_name?: string | null; display_name?: string | null } | null | undefined,
  email: string | null | undefined,
): string {
  const raw = profile?.full_name?.trim() || profile?.display_name?.trim();
  if (!raw) {
    const e = email?.trim();
    return e?.split("@")[0] ?? "Studencie";
  }
  if (raw.toLowerCase() === "test") {
    return "Student";
  }
  if (raw.includes("@")) {
    return raw.split("@")[0]?.trim() || "Studencie";
  }
  return raw;
}
