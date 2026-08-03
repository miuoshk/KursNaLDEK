import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  dashboardRouteRequiresAnyEntitlement,
  isDashboardGuardedRoute,
  isEntitlementExemptDashboardRoute,
} from "@/features/access/lib/dashboardRouteAccess";
import { evaluateAccessForUser } from "@/features/access/server/evaluateAccessForUser";
import { ACCESS_REVOKED_QUERY } from "@/lib/auth/accountBan";
import {
  applyLocaleToResponse,
  isAdminPath,
  resolveAdminLocale,
  resolveProxyLocale,
} from "@/lib/i18n/proxyLocale";

/** Auth + locale + redirects. Next.js 16 uses `proxy.ts` (see upgrading/version-16). */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    let response = NextResponse.next({ request });
    response = applyLocaleToResponse(request, response, resolveAdminLocale());
    return response;
  }

  let response = NextResponse.next({ request });
  const locale = resolveProxyLocale(request);
  response = applyLocaleToResponse(request, response, locale);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  // `/forgot-password` musi być dostępny bez sesji (użytkownik zapomniał hasła),
  // `/auth/callback` wymienia kod PKCE z e-maila zanim sesja jeszcze istnieje.
  // `/reset-password` celowo *nie* jest tu — wymaga sesji utworzonej przez callback.
  const isPasswordRecoveryRoute =
    pathname === "/forgot-password" || pathname === "/auth/callback";
  const isWebhookRoute = pathname === "/api/stripe/webhook";
  const isPublicRoot = pathname === "/";
  const isSeoRoute =
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/icon" ||
    pathname === "/opengraph-image";
  const isLegalRoute =
    pathname === "/regulamin" ||
    pathname === "/polityka-prywatnosci" ||
    pathname.startsWith("/legal/");
  const isKalkulatorRoute =
    pathname === "/kalkulator" || pathname.startsWith("/kalkulator/");

  if (
    !user &&
    !isAuthRoute &&
    !isPasswordRecoveryRoute &&
    !isWebhookRoute &&
    !isPublicRoot &&
    !isSeoRoute &&
    !isLegalRoute &&
    !isKalkulatorRoute
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/pulpit", request.url));
  }

  if (user && isPublicRoot) {
    return NextResponse.redirect(new URL("/pulpit", request.url));
  }

  if (user && isDashboardGuardedRoute(pathname)) {
    const access = await evaluateAccessForUser(supabase, user.id);

    if (access.revoked && pathname !== "/wybor-roku") {
      return NextResponse.redirect(
        new URL(`/wybor-roku?${ACCESS_REVOKED_QUERY}=1`, request.url),
      );
    }

    if (!isEntitlementExemptDashboardRoute(pathname)) {
      const allowed = dashboardRouteRequiresAnyEntitlement(pathname)
        ? access.hasAny
        : access.hasCurrent;

      if (!allowed) {
        return NextResponse.redirect(new URL("/wybor-roku", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|pdf)$).*)",
  ],
};
