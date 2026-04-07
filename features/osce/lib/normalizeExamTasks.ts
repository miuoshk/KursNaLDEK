type ExamTaskRow = { task: number; description: string };

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
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const taskNum = typeof o.task === "number" ? o.task : Number(o.task);
    const description = typeof o.description === "string" ? o.description.trim() : "";
    if (!Number.isFinite(taskNum) || !description) continue;
    out.push({ task: taskNum, description });
  }
  if (out.length === 0) return null;
  out.sort((a, b) => a.task - b.task);
  return out;
}
