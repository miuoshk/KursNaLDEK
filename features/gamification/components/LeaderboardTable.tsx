import Link from "next/link";
import { Flame } from "lucide-react";
import type {
  LeaderboardRow,
  LeaderboardScope,
} from "@/features/gamification/types";
import { cn } from "@/lib/utils";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeenIso: string | null): boolean {
  if (!lastSeenIso) return false;
  const t = Date.parse(lastSeenIso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < ONLINE_WINDOW_MS;
}

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

function buildHref(
  period: "7" | "30" | "all",
  scope: LeaderboardScope,
): string {
  const params = new URLSearchParams();
  if (period !== "30") params.set("lb", period);
  if (scope !== "all") params.set("scope", scope);
  const qs = params.toString();
  return qs ? `/osiagniecia?${qs}` : "/osiagniecia";
}

export function LeaderboardTable({
  rows,
  period,
  scope,
  currentYear,
}: {
  rows: LeaderboardRow[];
  period: "7" | "30" | "all";
  scope: LeaderboardScope;
  currentYear: number | null;
}) {
  const periodPills: { id: "7" | "30" | "all"; label: string }[] = [
    { id: "7", label: "7 dni" },
    { id: "30", label: "30 dni" },
    { id: "all", label: "Wszystko" },
  ];

  const scopePills: { id: LeaderboardScope; label: string; disabled?: boolean }[] = [
    {
      id: "year",
      label: currentYear != null ? `Mój rok (${currentYear})` : "Mój rok",
      disabled: currentYear == null,
    },
    { id: "all", label: "Wszyscy" },
  ];

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-xl font-bold text-primary">Ranking</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-pill border border-[rgba(255,255,255,0.08)] bg-card-hover/50 p-1">
            {scopePills.map((p) =>
              p.disabled ? (
                <span
                  key={p.id}
                  title="Ustaw rok studiów w profilu, aby filtrować po roczniku"
                  className="cursor-not-allowed rounded-pill px-3 py-1.5 font-body text-body-xs text-muted/60"
                >
                  {p.label}
                </span>
              ) : (
                <Link
                  key={p.id}
                  href={buildHref(period, p.id)}
                  className={cn(
                    "rounded-pill px-3 py-1.5 font-body text-body-xs transition-colors",
                    scope === p.id
                      ? "bg-brand-gold/15 text-brand-gold"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {p.label}
                </Link>
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-1 rounded-pill border border-[rgba(255,255,255,0.08)] bg-card-hover/50 p-1">
            {periodPills.map((p) => (
              <Link
                key={p.id}
                href={buildHref(p.id, scope)}
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
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 font-body text-body-md text-secondary">
          {scope === "year"
            ? "Brak innych użytkowników z Twojego roku. Wracaj tu wkrótce."
            : "Brak danych do rankingu. Rozwiązuj pytania, aby się tu pojawić."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-[rgba(255,255,255,0.06)]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] font-body text-body-xs text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Użytkownik</th>
                <th className="px-4 py-3 font-medium">Poziom</th>
                <th className="px-4 py-3 font-medium">XP (okres)</th>
                <th className="px-4 py-3 font-medium">Pytania</th>
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
                  <td className="px-4 py-3 font-body text-body-md text-primary">{r.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex shrink-0">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-accent-2",
                            r.avatarEmoji
                              ? "text-base leading-none"
                              : "font-body text-[10px] text-brand-gold",
                          )}
                          aria-hidden
                        >
                          {r.avatarEmoji ?? r.initials}
                        </span>
                        {isOnline(r.lastSeenAt) ? (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 inline-flex size-2.5 items-center justify-center"
                            title="Aktywny teraz"
                          >
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70 opacity-60" />
                            <span className="relative inline-flex size-2 rounded-full border border-card bg-success" />
                          </span>
                        ) : null}
                      </span>
                      <span className="font-body text-body-md text-primary">{r.displayName}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 font-body text-body-md", r.rankColorClass)}>
                    {r.rankName}
                  </td>
                  <td className="px-4 py-3 font-body text-body-sm text-brand-gold">{r.xp}</td>
                  <td className="px-4 py-3 font-body text-body-sm text-secondary">
                    {r.questionsAnswered}
                  </td>
                  <td className={cn("px-4 py-3 font-body text-body-sm", accClass(r.accuracy))}>
                    {Math.round(r.accuracy * 100)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-body text-body-sm text-primary">
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
