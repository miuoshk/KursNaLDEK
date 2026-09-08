import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isZenitLabsHost } from "@/lib/hosts";

export function proxy(request: NextRequest) {
  if (!isZenitLabsHost(request.headers.get("host"))) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/studio/favicon.ico", request.url));
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/legal") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === "/studio") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/studio", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
