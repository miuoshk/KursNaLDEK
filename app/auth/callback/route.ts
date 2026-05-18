import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Wymienia kod PKCE (`?code=...`) z linka z e-maila (np. reset hasła,
 * potwierdzenie konta) na sesję Supabase i przekierowuje do `next`.
 *
 * Domyślny szablon Supabase „Reset Password" prowadzi przez
 * `/auth/v1/verify`, który po weryfikacji tokenu przekierowuje na
 * `redirect_to` z parametrem `?code=...` — i tu go obsługujemy.
 *
 * Trasa musi być dostępna bez sesji (patrz `proxy.ts`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  if (errorParam) {
    console.error("[auth/callback] provider error", {
      error: errorParam,
      description: errorDescription,
    });
    const target = new URL("/login", origin);
    target.searchParams.set("auth_error", "link_invalid");
    return NextResponse.redirect(target);
  }

  if (!code) {
    const target = new URL("/login", origin);
    target.searchParams.set("auth_error", "link_invalid");
    return NextResponse.redirect(target);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
    });
    const target = new URL("/login", origin);
    target.searchParams.set("auth_error", "link_expired");
    return NextResponse.redirect(target);
  }

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, origin));
}
