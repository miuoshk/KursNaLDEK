/** Tytuł do uproszczonego breadcrumbu na wąskim ekranie. */
export function mobilePageTitle(pathname: string): string | null {
  if (pathname === "/pulpit" || pathname === "/pulpit/") return "Pulpit";
  if (pathname === "/przedmioty" || pathname.startsWith("/przedmioty/")) {
    if (pathname === "/przedmioty") return "Moje przedmioty";
    return "Przedmiot";
  }
  if (pathname === "/sesja" || pathname === "/sesja/") return "Sesja nauki";
  if (pathname === "/statystyki") return "Statystyki";
  if (pathname === "/osiagniecia") return "Osiągnięcia";
  if (pathname === "/ustawienia") return "Ustawienia";
  if (pathname.startsWith("/sesja/")) return "Sesja";
  if (pathname.startsWith("/dashboard/ustawienia")) return "Ustawienia";
  return null;
}
