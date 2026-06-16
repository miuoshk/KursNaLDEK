"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const base = `/osiagniecia${qs ? `?${qs}` : ""}`;
  return `${base}#ranking`;
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
  const t = useTranslations("gamification");

  const periodPills: { id: "7" | "30" | "all"; label: string }[] = [
    { id: "7", label: t("leaderboard.period7") },
    { id: "30", label: t("leaderboard.period30") },
    { id: "all", label: t("leaderboard.periodAll") },
  ];

  const scopePills: { id: LeaderboardScope; label: string; disabled?: boolean }[] = [
    {
      id: "year",
      label:
        currentYear != null
          ? t("leaderboard.scopeYear", { year: currentYear })
          : t("leaderboard.scopeYearFallback"),
      disabled: currentYear == null,
    },
    { id: "all", label: t("leaderboard.scopeAll") },
  ];

  const periodLabel =
    period === "7"
      ? t("leaderboard.periodLabel7")
      : period === "30"
        ? t("leaderboard.periodLabel30")
        : t("leaderboard.periodLabelAll");

  return (
    <section id="ranking" className="scroll-mt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-xl font-bold text-primary">{t("leaderboard.title")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-pill border border-[rgba(255,255,255,0.08)] bg-card-hover/50 p-1">
            {scopePills.map((p) =>
              p.disabled ? (
                <span
                  key={p.id}
                  title={t("leaderboard.scopeYearDisabledTitle")}
                  className="cursor-not-allowed rounded-pill px-3 py-1.5 font-body text-body-xs text-muted/60"
                >
                  {p.label}
                </span>
              ) : (
                <Link
                  key={p.id}
                  href={buildHref(period, p.id)}
                  scroll={false}
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
                scroll={false}
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
            ? t("leaderboard.emptyYear")
            : t("leaderboard.emptyAll")}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-[rgba(255,255,255,0.06)]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] font-body text-body-xs text-muted">
                <th className="px-4 py-3 font-medium">{t("leaderboard.colRank")}</th>
                <th className="px-4 py-3 font-medium">{t("leaderboard.colUser")}</th>
                <th className="px-4 py-3 font-medium" title={t("leaderboard.colLevelTitle")}>
                  {t("leaderboard.colLevel")}
                </th>
                <th className="px-4 py-3 font-medium">{t("leaderboard.colXp", { period: periodLabel })}</th>
                <th className="px-4 py-3 font-medium">{t("leaderboard.colQuestions", { period: periodLabel })}</th>
                <th className="px-4 py-3 font-medium">{t("leaderboard.colAccuracy")}</th>
                <th className="px-4 py-3 font-medium">{t("leaderboard.colStreak")}</th>
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
                            title={t("leaderboard.onlineNow")}
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
                    {t(`ranks.${r.rankTierId}`)}
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
