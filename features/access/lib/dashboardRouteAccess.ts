const ENTITLEMENT_EXEMPT_PATHS = new Set(["/wybor-roku", "/ustawienia"]);

const ANY_ENTITLEMENT_PREFIXES = ["/pulpit", "/statystyki", "/osiagniecia"];

const DASHBOARD_GUARDED_PREFIXES = [
  "/pulpit",
  "/przedmioty",
  "/sesja",
  "/zapisane",
  "/statystyki",
  "/osiagniecia",
  "/dashboard",
  "/ustawienia",
  "/wybor-roku",
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isDashboardGuardedRoute(pathname: string): boolean {
  return DASHBOARD_GUARDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isEntitlementExemptDashboardRoute(pathname: string): boolean {
  if (ENTITLEMENT_EXEMPT_PATHS.has(pathname)) {
    return true;
  }
  return pathname.startsWith("/ustawienia/");
}

export function dashboardRouteRequiresAnyEntitlement(pathname: string): boolean {
  return ANY_ENTITLEMENT_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}
