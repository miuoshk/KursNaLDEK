import { ClipboardList } from "lucide-react";

type ExamTask = {
  task: number;
  description: string;
};

type OsceExamTasksBoxProps = {
  examTasks: ExamTask[] | null;
};

export function OsceExamTasksBox({ examTasks }: OsceExamTasksBoxProps) {
  if (!examTasks || examTasks.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-card border border-brand-sage/35 bg-card p-5"
      role="region"
      aria-label="Zadania egzaminacyjne na stacji"
    >
      <div className="flex items-start gap-3">
        <ClipboardList
          className="mt-0.5 size-5 shrink-0 text-brand-gold"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-heading-sm text-brand-gold">
            Zadania na stacji
          </h2>
          <ul className="mt-3 space-y-2">
            {examTasks.map((t) => (
              <li key={t.task} className="font-body text-body-sm text-secondary">
                <span className="font-semibold text-primary">Zadanie {t.task}:</span>{" "}
                {t.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
