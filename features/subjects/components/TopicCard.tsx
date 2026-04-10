import Link from "next/link";
import type { TopicWithProgress } from "@/features/subjects/server/loadSubjectDashboard";
import { cn } from "@/lib/utils";

type TopicCardProps = {
  topic: TopicWithProgress;
  subjectId: string;
};

function fillClassForProgress(pct: number) {
  if (pct < 40) return "bg-error";
  if (pct <= 75) return "bg-brand-gold";
  return "bg-success";
}

export function TopicCard({ topic, subjectId }: TopicCardProps) {
  const total = topic.question_count;
  const answered = topic.answered_count;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const hasQuestions = total > 0;

  const href = `/sesja/new?subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topic.id)}&mode=inteligentna&count=50`;

  const inner = (
    <>
      <div className="flex items-center gap-2">
        <h3 className="font-body text-body-md font-semibold text-primary">{topic.name}</h3>
        {!hasQuestions && (
          <span className="font-body text-body-xs text-brand-gold">Wkrótce</span>
        )}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-[width]", fillClassForProgress(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 font-body text-body-xs text-muted">
        {hasQuestions ? `${answered} / ${total} pytań` : "Brak pytań"}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-body text-body-xs text-muted">Ostatnio: —</p>
        <span
          className={cn(
            "font-body text-body-sm font-medium transition-colors duration-200 ease-out",
            hasQuestions
              ? "text-brand-sage group-hover:text-brand-gold"
              : "text-muted",
          )}
        >
          {hasQuestions ? "Rozpocznij" : "Wkrótce"}
        </span>
      </div>
    </>
  );

  if (!hasQuestions) {
    return (
      <div
        className="rounded-card border border-border bg-card p-5 opacity-50"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-card border border-border bg-card p-5",
        "transition-all duration-200 ease-out hover:border-brand-sage/30",
      )}
    >
      {inner}
    </Link>
  );
}
