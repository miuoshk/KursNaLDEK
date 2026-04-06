import Link from "next/link";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getSubjectIcon } from "@/features/subjects/iconMap";
import { cn } from "@/lib/utils";

type SubjectCardProps = {
  subject: SubjectWithProgress;
};

export function SubjectCard({ subject }: SubjectCardProps) {
  const Icon = getSubjectIcon(subject.icon_name);
  const mastery = subject.mastery_percentage;

  return (
    <Link
      href={`/przedmioty/${subject.id}`}
      className={cn(
        "group block rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-5",
        "cursor-pointer transition-all duration-200 ease-out",
        "hover:border-brand-sage/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Icon
          className="size-5 shrink-0 text-secondary transition-colors duration-200 ease-out group-hover:text-brand-gold"
          aria-hidden
        />
        <div className="text-right">
          <p className="font-mono text-lg text-secondary">{mastery}%</p>
          <p className="font-body text-body-xs text-muted">Mistrzostwo</p>
        </div>
      </div>

      <h2 className="mt-3 font-body text-body-lg font-semibold text-white">
        {subject.name}
      </h2>

      <p className="mt-2 font-body text-body-sm text-muted">
        {subject.question_count} pytań · {subject.topic_count} działów
      </p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full bg-brand-gold/80 transition-[width] duration-200"
          style={{ width: `${mastery}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="font-body text-body-xs text-muted">Ostatnio: —</p>
        <span className="font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 ease-out group-hover:text-brand-gold">
          Otwórz →
        </span>
      </div>
    </Link>
  );
}
