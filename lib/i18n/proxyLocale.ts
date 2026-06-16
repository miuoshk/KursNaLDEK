import {
  defaultLocale,
  isAppLocale,
  LOCALE_COOKIE,
  resolveLocaleFromAcceptLanguage,
  type AppLocale,
} from "@/i18n/config";
import type { NextRequest, NextResponse } from "next/server";

const LOCALE_HEADER = "x-next-intl-locale";

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function resolveProxyLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  return resolveLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

export function applyLocaleToResponse(
  request: NextRequest,
  response: NextResponse,
  locale: AppLocale,
): NextResponse {
  const currentCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (currentCookie !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  response.headers.set(LOCALE_HEADER, locale);
  request.headers.set(LOCALE_HEADER, locale);
  return response;
}

export function resolveAdminLocale(): AppLocale {
  return defaultLocale;
}
