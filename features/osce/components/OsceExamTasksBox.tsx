"use client";

import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";

type ExamTask = {
  task_number: number;
  description: string;
};

type OsceExamTasksBoxProps = {
  examTasks: ExamTask[] | null;
};

export function OsceExamTasksBox({ examTasks }: OsceExamTasksBoxProps) {
  const t = useTranslations("osce");
  const tasks = examTasks ?? [];
  const hasTasks = tasks.length > 0;

  return (
    <div
      className="rounded-card border border-gold/20 bg-brand-gold/5 p-5"
      role="region"
      aria-label={t("examTasksRegion")}
    >
      <div className="flex items-start gap-3">
        <ClipboardList
          className="mt-0.5 size-5 shrink-0 text-brand-gold"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-heading-sm text-brand-gold">
            {t("stationTasksHeading")}
          </h2>
          {hasTasks ? (
            <ul className="mt-3 space-y-2">
              {tasks.map((task, i) => {
                const n =
                  Number.isFinite(task.task_number) && task.task_number > 0
                    ? task.task_number
                    : i + 1;
                return (
                  <li key={`${n}-${i}`} className="font-body text-body-sm text-secondary">
                    {t("taskLabel", { number: n, description: task.description })}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 font-body text-body-sm text-secondary">
              {t("stationTasksPending")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
