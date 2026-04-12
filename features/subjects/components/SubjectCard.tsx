import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import type { SubjectWithProgress } from "@/features/subjects/types";
import { getSubjectIcon } from "@/features/subjects/iconMap";
import { cn } from "@/lib/utils";

type SubjectCardProps = {
  subject: SubjectWithProgress;
  locked?: boolean;
};

function formatLastStudied(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "dzisiaj";
  if (diffDays === 1) return "wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "tydzień temu" : `${weeks} tyg. temu`;
  }
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function SubjectCard({ subject, locked }: SubjectCardProps) {
  const Icon = getSubjectIcon(subject.icon_name);
  const mastery = subject.mastery_percentage;
  const comingSoon = subject.question_count === 0 && subject.topic_count === 0;
  const isDisabled = locked || comingSoon;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors duration-200 ease-out",
            isDisabled
              ? "text-secondary grayscale"
              : "text-secondary group-hover:text-brand-sage",
          )}
          aria-hidden
        />
        {comingSoon ? (
          <div className="flex items-center gap-1.5 text-right">
            <Clock className="size-3.5 text-muted" aria-hidden />
            <p className="font-body text-body-sm text-muted">Wkrótce</p>
          </div>
        ) : (
          <div className="text-right">
            <p className="font-body text-lg text-secondary">{mastery}%</p>
            <p className="font-body text-body-xs text-muted">Mistrzostwo</p>
          </div>
        )}
      </div>

      <h2 className="mt-3 font-heading text-body-lg text-primary">
        {subject.name}
      </h2>

      {comingSoon ? (
        <p className="mt-2 font-body text-body-sm text-muted">
          Wkrótce dostępne
        </p>
      ) : (
        <p className="mt-2 font-body text-body-sm text-muted">
          {subject.question_count} pytań · {subject.topic_count} działów
        </p>
      )}

      {!comingSoon && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-brand-gold/80 transition-[width] duration-200"
            style={{ width: `${mastery}%` }}
          />
        </div>
      )}

      <div className={cn("mt-4 flex items-center justify-between gap-2", comingSoon && "mt-auto pt-4")}>
        {comingSoon ? (
          <p className="font-body text-body-xs text-muted">Treści w przygotowaniu</p>
        ) : (
          <p className="font-body text-body-xs text-muted">
            Ostatnio: {formatLastStudied(subject.last_studied_at)}
          </p>
        )}
        {!isDisabled && (
          <span className="inline-flex items-center rounded-lg border border-brand-sage/40 px-3 py-1 font-body text-body-sm font-medium text-brand-sage transition-colors duration-200 ease-out group-hover:bg-brand-sage/10">
            Otwórz
          </span>
        )}
      </div>

      {locked && !comingSoon && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-background/60">
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

  if (isDisabled) {
    return (
      <div
        className={cn(
          "group relative flex flex-col rounded-card border border-border bg-card p-5",
          isDisabled && "pointer-events-none opacity-60",
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
        "group relative flex flex-col rounded-card border border-border bg-card p-5",
        "cursor-pointer transition-all duration-200 ease-out",
        "hover:border-brand-sage/30",
      )}
    >
      {content}
    </Link>
  );
}
