import { NextResponse } from "next/server";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import {
  generateTestExport,
  TestExportUserError,
} from "@/features/admin/server/generateTestExport";
import { testExportRequestSchema } from "@/features/admin/lib/testExport/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const ctx = await getAdminAccessContext();
  if (!ctx.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Niepoprawny JSON." }, { status: 400 });
  }

  const parsed = testExportRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Niepoprawna konfiguracja testu." },
      { status: 400 },
    );
  }

  try {
    const file = await generateTestExport(parsed.data);
    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof TestExportUserError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/admin/test-export]", error);
    return NextResponse.json({ error: "Nie udało się wygenerować pliku." }, { status: 500 });
  }
}
