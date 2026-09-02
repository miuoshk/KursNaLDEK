type MobilePageTitleTranslators = {
  nav: (
    key:
      | "dashboard"
      | "mySubjects"
      | "statistics"
      | "achievements"
      | "settings"
      | "pageSubject"
      | "pageSession",
  ) => string;
};

/** Tytuł do uproszczonego breadcrumbu na wąskim ekranie. */
export function mobilePageTitle(
  pathname: string,
  t: MobilePageTitleTranslators,
): string | null {
  if (pathname === "/pulpit" || pathname === "/pulpit/") return t.nav("dashboard");
  if (pathname === "/przedmioty" || pathname.startsWith("/przedmioty/")) {
    if (pathname === "/przedmioty") return t.nav("mySubjects");
    return t.nav("pageSubject");
  }
  if (pathname === "/statystyki") return t.nav("statistics");
  if (pathname === "/osiagniecia") return t.nav("achievements");
  if (pathname === "/ustawienia") return t.nav("settings");
  if (pathname.startsWith("/sesja/")) return t.nav("pageSession");
  if (pathname.startsWith("/dashboard/ustawienia")) return t.nav("settings");
  return null;
}
