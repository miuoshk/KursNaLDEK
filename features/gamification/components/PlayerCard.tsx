import { Clock, Flame, MessageSquare, Target } from "lucide-react";
import { RankProgressBar } from "@/features/gamification/components/RankProgressBar";
import { getCurrentRank } from "@/features/gamification/lib/ranks";
import type { GamificationPayload } from "@/features/gamification/types";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { formatStreak } from "@/lib/formatStreak";
import { cn } from "@/lib/utils";

export function PlayerCard({
  xp,
  displayName,
  initials,
  streak,
  totalQuestionsAnswered,
  avgAccuracy,
  totalStudyMinutes,
}: Pick<
  GamificationPayload,
  | "xp"
  | "displayName"
  | "initials"
  | "streak"
  | "totalQuestionsAnswered"
  | "avgAccuracy"
  | "totalStudyMinutes"
>) {
  const rank = getCurrentRank(xp);
  const pct = Math.round(avgAccuracy * 100);
  const studySeconds = totalStudyMinutes * 60;
  const solvedLabel =
    totalQuestionsAnswered === 1
      ? "1 pytanie rozwiązane"
      : totalQuestionsAnswered >= 2 && totalQuestionsAnswered <= 4
        ? `${totalQuestionsAnswered} pytania rozwiązane`
        : `${totalQuestionsAnswered} pytań rozwiązanych`;

  return (
    <div className="rounded-card border border-brand-gold/20 bg-brand-card-1 p-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-mono text-xl text-brand-gold">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-heading-md text-primary">{displayName}</h2>
            <p className={cn("mt-1 font-body text-body-md", rank.colorClass)}>{rank.name}</p>
            <div className="mt-4">
              <RankProgressBar xp={xp} />
            </div>
          </div>
        </div>

        <div className="space-y-3 font-mono text-body-sm text-secondary">
          <p className="flex items-center gap-2">
            <MessageSquare className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{solvedLabel}</span>
          </p>
          <p className="flex items-center gap-2">
            <Target className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{pct}% średnia trafność</span>
          </p>
          <p className="flex items-center gap-2">
            <Flame className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{formatStreak(streak)} streak</span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span>{formatSessionDuration(studySeconds)} łączny czas nauki</span>
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div
            className={cn(
              "flex size-20 items-center justify-center rounded-full border-2 font-mono text-2xl",
              rank.colorClass,
              "border-current",
            )}
            aria-hidden
          >
            {rank.name.charAt(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
