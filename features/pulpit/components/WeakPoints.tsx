import Link from "next/link";
import { BookOpen, Trophy } from "lucide-react";
import type { WeakPoint } from "@/features/pulpit/server/loadWeakPoints";
import { cn } from "@/lib/utils";

function barColor(score: number): string {
  if (score < 30) return "bg-error/70";
  if (score < 60) return "bg-brand-gold/70";
  return "bg-brand-sage";
}

type Props = {
  weakPoints: WeakPoint[];
  hasAnySessions: boolean;
};

export function WeakPoints({ weakPoints, hasAnySessions }: Props) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">
        Słabe punkty
      </h2>
      <p className="mt-1 font-body text-sm text-secondary">
        Tematy, które warto powtórzyć
      </p>

      {weakPoints.length === 0 ? (
        <EmptyState hasAnySessions={hasAnySessions} />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {weakPoints.map((wp) => (
            <div
              key={wp.topicId}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0 shrink-0">
                <p className="font-body text-sm font-semibold text-primary">
                  {wp.topicName}
                </p>
                <p className="mt-0.5 font-body text-xs text-secondary">
                  {wp.subjectName}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-300 ease-out",
                      barColor(wp.masteryScore),
                    )}
                    style={{ width: `${wp.masteryScore}%` }}
                  />
                </div>
                <p className="mt-1 font-body text-xs text-secondary">
                  {wp.masteryScore}%
                </p>
              </div>

              <Link
                href={`/przedmioty/${wp.subjectId}?topic=${wp.topicId}`}
                className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-1.5 font-body text-xs font-medium text-secondary transition-colors duration-200 ease-out hover:bg-white/10 hover:text-primary"
              >
                Ćwicz
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ hasAnySessions }: { hasAnySessions: boolean }) {
  if (!hasAnySessions) {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-12">
        <BookOpen className="size-6 text-secondary" aria-hidden />
        <p className="font-body text-sm text-secondary">
          Odpowiedz na kilka pytań, a pokażemy Ci co warto powtórzyć.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-12">
      <Trophy className="size-6 text-brand-gold" aria-hidden />
      <p className="font-body text-sm text-secondary">
        Świetna robota! Nie masz słabych punktów.
      </p>
    </div>
  );
}
