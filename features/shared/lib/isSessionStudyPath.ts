/** Paths that use the compact session chrome (no dashboard TopBar). */
export function isSessionStudyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (/^\/sesja\/[^/]+$/.test(pathname)) return true;
  if (pathname === "/dev/ufo-odbior") return true;
  return false;
}
