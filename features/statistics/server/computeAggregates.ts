import { format, subDays } from "date-fns";
import { pl } from "date-fns/locale";

type SessionRow = {
  completed_at: string;
  correct_answers: number | null;
  total_questions: number | null;
  duration_seconds: number | null;
};

export function sessionsByLocalDate(sessions: SessionRow[]) {
  const map = new Map<
    string,
    { correct: number; total: number; minutes: number }
  >();
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const d = new Date(s.completed_at);
    const key = format(d, "yyyy-MM-dd");
    const cur = map.get(key) ?? { correct: 0, total: 0, minutes: 0 };
    cur.correct += s.correct_answers ?? 0;
    cur.total += s.total_questions ?? 0;
    cur.minutes += (s.duration_seconds ?? 0) / 60;
    map.set(key, cur);
  }
  return map;
}

export function buildAccuracyTrend(
  byDay: Map<string, { correct: number; total: number; minutes: number }>,
  daysBack: number,
) {
  const out: { date: string; accuracy: number }[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const v = byDay.get(key);
    const acc = v && v.total > 0 ? v.correct / v.total : 0;
    out.push({ date: key, accuracy: acc });
  }
  return out;
}

export function buildStudyTimeLast14(
  byDay: Map<string, { correct: number; total: number; minutes: number }>,
) {
  const out: { date: string; minutes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const v = byDay.get(key);
    out.push({ date: key, minutes: Math.round(v?.minutes ?? 0) });
  }
  return out;
}

export function weekdayShortPl(d: Date) {
  return format(d, "EEE", { locale: pl });
}

export function heatmap30(
  byDay: Map<string, { correct: number; total: number; minutes: number }>,
) {
  const out: { date: string; level: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const v = byDay.get(key);
    const minutes = v?.minutes ?? 0;
    let level = 0;
    if (minutes > 0) level = 1;
    if (minutes >= 15) level = 2;
    if (minutes >= 35) level = 3;
    if (minutes >= 60) level = 4;
    out.push({ date: key, level });
  }
  return out;
}
