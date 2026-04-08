import Link from "next/link";
import { Lock } from "lucide-react";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getSubjectIcon } from "@/features/subjects/iconMap";
import { cn } from "@/lib/utils";

type SubjectCardProps = {
  subject: SubjectWithProgress;
  locked?: boolean;
};

export function SubjectCard({ subject, locked }: SubjectCardProps) {
  const Icon = getSubjectIcon(subject.icon_name);
  const mastery = subject.mastery_percentage;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors duration-200 ease-out",
            locked
              ? "grayscale text-secondary"
              : "text-secondary group-hover:text-brand-gold",
          )}
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
        {!locked && (
          <span className="font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 ease-out group-hover:text-brand-gold">
            Otwórz →
          </span>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-brand-bg/60">
          <div className="flex flex-col items-center gap-2">
            <Lock className="size-5 text-secondary" aria-hidden />
            <span className="font-body text-body-xs text-muted">
              Dostępne w abonamencie
            </span>
          </div>
        </div>
      )}
    </>
  );

  if (locked) {
    return (
      <div
        className={cn(
          "group relative block rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-5",
          "pointer-events-none opacity-60",
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/przedmioty/${subject.id}`}
      className={cn(
        "group relative block rounded-card border border-[rgba(255,255,255,0.06)] bg-brand-card-1 p-5",
        "cursor-pointer transition-all duration-200 ease-out",
        "hover:border-brand-sage/30",
      )}
    >
      {content}
    </Link>
  );
}
