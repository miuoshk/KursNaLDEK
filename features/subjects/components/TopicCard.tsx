import type { Topic } from "@/features/subjects/types";
import { cn } from "@/lib/utils";

type TopicCardProps = {
  topic: Topic;
};

function fillClassForProgress(pct: number) {
  if (pct < 40) return "bg-error";
  if (pct <= 75) return "bg-brand-gold";
  return "bg-success";
}

export function TopicCard({ topic }: TopicCardProps) {
  const pct = 0;
  const total = topic.question_count;

  return (
    <div
      className={cn(
        "rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-5",
        "transition-all duration-200 ease-out hover:border-brand-sage/30",
      )}
    >
      <h3 className="font-body text-body-md font-semibold text-primary">{topic.name}</h3>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className={cn("h-full rounded-full transition-[width]", fillClassForProgress(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 font-body text-body-xs text-muted">
        0 / {total} pytań
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-body text-body-xs text-muted">Ostatnio: —</p>
        <span className="font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 ease-out hover:text-brand-gold">
          Rozpocznij
        </span>
      </div>
    </div>
  );
}
