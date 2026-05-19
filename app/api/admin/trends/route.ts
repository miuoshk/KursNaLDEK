import { NextResponse } from "next/server";
import { getAdminAccessContext } from "@/features/admin/server/adminAuth";
import {
  loadAdminTrendSeries,
  type AdminTrendMetric,
  type AdminTrendRange,
  type AdminTrendTrack,
} from "@/features/admin/server/loadAdminTrendSeries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_METRICS: AdminTrendMetric[] = [
  "sessions",
  "time",
  "answers",
  "users",
  "questions",
  "accuracy",
];
const ALLOWED_RANGES: AdminTrendRange[] = ["7", "30", "90", "365"];
const ALLOWED_TRACKS: AdminTrendTrack[] = ["all", "lekarski", "stomatologia"];

export async function GET(request: Request) {
  const ctx = await getAdminAccessContext();
  if (!ctx.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const rawMetric = url.searchParams.get("metric");
  const metric = ALLOWED_METRICS.find((m) => m === rawMetric);
  if (!metric) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }
  const rawRange = url.searchParams.get("range") ?? "30";
  const range = ALLOWED_RANGES.find((r) => r === rawRange) ?? "30";
  const rawTrack = url.searchParams.get("track") ?? "all";
  const track = ALLOWED_TRACKS.find((t) => t === rawTrack) ?? "all";
  const rawYear = url.searchParams.get("year") ?? "all";
  const year: "all" | number =
    rawYear === "all"
      ? "all"
      : (() => {
          const n = Number(rawYear);
          return Number.isFinite(n) && n >= 1 && n <= 6 ? n : "all";
        })();

  try {
    const series = await loadAdminTrendSeries({ metric, range, track, year });
    return NextResponse.json(series, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (e) {
    console.error("[api/admin/trends]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
