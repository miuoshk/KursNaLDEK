/** Konto z pełnym dostępem administracyjnym (preview produktów LDEW/LDEK). */
export function isProfileAdmin(role: unknown): boolean {
  return role === "admin";
}
