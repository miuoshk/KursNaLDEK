import { ClipboardList } from "lucide-react";

type OsceExamTasksBoxProps = {
  examTasks: string | null;
};

export function OsceExamTasksBox({ examTasks }: OsceExamTasksBoxProps) {
  if (!examTasks?.trim()) {
    return null;
  }

  return (
    <div
      className="rounded-card border border-brand-sage/35 bg-brand-card-1 p-5"
      role="region"
      aria-label="Zadania egzaminacyjne na stacji"
    >
      <div className="flex items-start gap-3">
        <ClipboardList
          className="mt-0.5 size-5 shrink-0 text-brand-gold"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-heading-sm text-brand-gold">Zadania na stacji</h2>
          <div className="mt-3 whitespace-pre-wrap font-body text-body-sm text-secondary">
            {examTasks.trim()}
          </div>
        </div>
      </div>
    </div>
  );
}
