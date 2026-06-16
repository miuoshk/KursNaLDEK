type MobilePageTitleTranslators = {
  nav: (
    key: "dashboard" | "mySubjects" | "statistics" | "achievements" | "settings",
  ) => string;
  osce: (key: "courseTitle" | "simulation" | "osceShort" | "pageSubject" | "pageSession") => string;
};

/** Tytuł do uproszczonego breadcrumbu na wąskim ekranie. */
export function mobilePageTitle(
  pathname: string,
  t: MobilePageTitleTranslators,
): string | null {
  if (pathname === "/pulpit" || pathname === "/pulpit/") return t.nav("dashboard");
  if (pathname === "/przedmioty" || pathname.startsWith("/przedmioty/")) {
    if (pathname === "/przedmioty") return t.nav("mySubjects");
    return t.osce("pageSubject");
  }
  if (pathname === "/osce" || pathname === "/osce/") return t.osce("courseTitle");
  if (pathname.startsWith("/osce/")) {
    if (pathname.startsWith("/osce/symulacja")) return t.osce("simulation");
    return t.osce("osceShort");
  }
  if (pathname === "/statystyki") return t.nav("statistics");
  if (pathname === "/osiagniecia") return t.nav("achievements");
  if (pathname === "/ustawienia") return t.nav("settings");
  if (pathname.startsWith("/sesja/")) return t.osce("pageSession");
  if (pathname.startsWith("/dashboard/ustawienia")) return t.nav("settings");
  return null;
}
