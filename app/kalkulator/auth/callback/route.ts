import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Wymienia kod PKCE z magic linka na sesję Supabase i przekierowuje do /kalkulator.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/kalkulator";

  if (errorParam) {
    console.error("[kalkulator/auth/callback] provider error", {
      error: errorParam,
      description: errorDescription,
    });
    return NextResponse.redirect(
      new URL("/kalkulator?auth_error=link_invalid", origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/kalkulator?auth_error=link_invalid", origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[kalkulator/auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
    });
    return NextResponse.redirect(
      new URL("/kalkulator?auth_error=link_expired", origin),
    );
  }

  const safeNext = next.startsWith("/kalkulator") ? next : "/kalkulator";
  return NextResponse.redirect(new URL(safeNext, origin));
}
