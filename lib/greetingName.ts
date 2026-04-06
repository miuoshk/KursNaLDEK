/** Imię do powitania: preferuje display_name; jeśli wygląda jak email — część przed @. */
export function greetingName(
  profile: { display_name: string | null } | null | undefined,
  email: string | null | undefined,
): string {
  const raw = profile?.display_name?.trim();
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
