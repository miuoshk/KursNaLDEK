type ExamTaskRow = { task_number: number; description: string };

function pickDescription(o: Record<string, unknown>): string {
  const keys = ["description", "text", "content", "body", "opis"] as const;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const taskVal = o.task;
  if (typeof taskVal === "string" && taskVal.trim()) return taskVal.trim();
  return "";
}

function pickTaskNumber(o: Record<string, unknown>): number {
  const rawNum = o.task_number ?? o.nr ?? o.number ?? (typeof o.task === "number" ? o.task : undefined);
  const taskNum = typeof rawNum === "number" ? rawNum : Number(rawNum);
  return Number.isFinite(taskNum) && taskNum > 0 ? taskNum : NaN;
}

/** Mapuje pole `subjects.exam_tasks` (JSONB / JSON) na tablicę zadań. */
export function normalizeExamTasks(raw: unknown): ExamTaskRow[] | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      return normalizeExamTasks(JSON.parse(t) as unknown);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw)) return null;
  const out: ExamTaskRow[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const description = item.trim();
      if (!description) continue;
      out.push({ task_number: out.length + 1, description });
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const description = pickDescription(o);
    if (!description) continue;
    let taskNum = pickTaskNumber(o);
    if (!Number.isFinite(taskNum)) {
      taskNum = out.length + 1;
    }
    out.push({ task_number: taskNum, description });
  }
  if (out.length === 0) return null;
  out.sort((a, b) => a.task_number - b.task_number);
  return out;
}
