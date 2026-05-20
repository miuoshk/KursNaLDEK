import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import { backfillStripePayments } from "@/features/admin/server/stripeBackfill";
import { ADMIN_FINANCE_CACHE_TAG } from "@/features/admin/server/loadAdminFinance";

export const runtime = "nodejs";
export const maxDuration = 300; // backfill może iść dłużej niż domyślne 10s

export async function POST(request: Request) {
  const ctx = await getAdminAccessContext();
  if (!ctx.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Number(daysParam) : 365;
  if (!Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ error: "Invalid `days` parameter." }, { status: 400 });
  }

  const result = await backfillStripePayments(days);
  if (result.ok) {
    revalidateTag(ADMIN_FINANCE_CACHE_TAG, "max");
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
