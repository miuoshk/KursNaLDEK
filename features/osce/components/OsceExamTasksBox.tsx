import { ClipboardList } from "lucide-react";

type ExamTask = {
  task_number: number;
  description: string;
};

type OsceExamTasksBoxProps = {
  examTasks: ExamTask[] | null;
};

export function OsceExamTasksBox({ examTasks }: OsceExamTasksBoxProps) {
  const tasks = examTasks ?? [];
  const hasTasks = tasks.length > 0;

  return (
    <div
      className="rounded-card border border-gold/20 bg-brand-gold/5 p-5"
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
          {hasTasks ? (
            <ul className="mt-3 space-y-2">
              {tasks.map((t, i) => {
                const n = Number.isFinite(t.task_number) && t.task_number > 0 ? t.task_number : i + 1;
                return (
                  <li key={`${n}-${i}`} className="font-body text-body-sm text-secondary">
                    <span className="font-semibold text-primary">Zadanie {n}:</span>{" "}
                    {t.description}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 font-body text-body-sm text-secondary">
              Zadania zostaną wkrótce uzupełnione
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
