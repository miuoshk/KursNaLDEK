import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatisticsDashboard } from "@/features/statistics/components/StatisticsDashboard";
import { loadStatistics } from "@/features/statistics/server/loadStatistics";
import type { TimeRangeKey } from "@/features/statistics/types";

function parseRange(v: string | undefined): TimeRangeKey {
  if (v === "7" || v === "30" || v === "90" || v === "all") return v;
  return "30";
}

export default async function StatystykiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await loadStatistics(supabase, user.id, range);

  return (
    <Suspense fallback={null}>
      <StatisticsDashboard data={data} />
    </Suspense>
  );
}
