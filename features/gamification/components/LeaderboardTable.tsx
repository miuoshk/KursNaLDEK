import Link from "next/link";
import { Flame } from "lucide-react";
import type { LeaderboardRow } from "@/features/gamification/types";
import { cn } from "@/lib/utils";

const ROW_TINT: Record<number, string> = {
  1: "bg-[rgba(201,168,76,0.08)]",
  2: "bg-[rgba(192,192,192,0.06)]",
  3: "bg-[rgba(205,127,50,0.06)]",
};

function accClass(acc: number): string {
  if (acc > 0.75) return "text-success";
  if (acc >= 0.5) return "text-brand-gold";
  return "text-error";
}

export function LeaderboardTable({
  rows,
  period,
}: {
  rows: LeaderboardRow[];
  period: "7" | "30" | "all";
}) {
  const pills: { id: "7" | "30" | "all"; label: string }[] = [
    { id: "7", label: "7 dni" },
    { id: "30", label: "30 dni" },
    { id: "all", label: "Wszystko" },
  ];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-heading-md text-primary">
          Ranking — Nauki Podstawowe
        </h2>
        <div className="flex flex-wrap gap-1 rounded-pill border border-[rgba(255,255,255,0.08)] bg-brand-card-2/50 p-1">
          {pills.map((p) => (
            <Link
              key={p.id}
              href={p.id === "30" ? "/osiagniecia" : `/osiagniecia?lb=${p.id}`}
              className={cn(
                "rounded-pill px-3 py-1.5 font-body text-body-xs transition-colors",
                period === p.id
                  ? "bg-brand-gold/15 text-brand-gold"
                  : "text-secondary hover:text-primary",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 font-body text-body-md text-secondary">
          Brak danych do rankingu. Rozwiązuj pytania, aby się tu pojawić.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-[rgba(255,255,255,0.06)]">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] font-body text-body-xs text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Użytkownik</th>
                <th className="px-4 py-3 font-medium">Poziom</th>
                <th className="px-4 py-3 font-medium">XP (okres)</th>
                <th className="px-4 py-3 font-medium">Trafność</th>
                <th className="px-4 py-3 font-medium">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  className={cn(
                    "border-b border-[rgba(255,255,255,0.04)]",
                    ROW_TINT[r.rank],
                    r.isCurrent && "border-l-[3px] border-l-brand-gold",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-body-md text-primary">{r.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-mono text-[10px] text-brand-gold">
                        {r.initials}
                      </span>
                      <span className="font-body text-body-md text-primary">{r.displayName}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 font-body text-body-md", r.rankColorClass)}>
                    {r.rankName}
                  </td>
                  <td className="px-4 py-3 font-mono text-body-sm text-brand-gold">{r.xp}</td>
                  <td className={cn("px-4 py-3 font-mono text-body-sm", accClass(r.accuracy))}>
                    {Math.round(r.accuracy * 100)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-mono text-body-sm text-primary">
                      <Flame className="size-4 text-brand-gold" aria-hidden />
                      {r.streak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
