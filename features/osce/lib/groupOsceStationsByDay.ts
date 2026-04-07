import type { OsceStation } from "@/features/osce/types";

export type OsceDayGroup = {
  key: "day1" | "day2" | "bonus";
  title: string;
  stations: OsceStation[];
};

export function groupOsceStationsByDay(stations: OsceStation[]): OsceDayGroup[] {
  const day1 = stations.filter((s) => s.exam_day === 1);
  const day2 = stations.filter((s) => s.exam_day === 2);
  const bonus = stations.filter((s) => s.exam_day !== 1 && s.exam_day !== 2);

  const groups: OsceDayGroup[] = [];
  if (day1.length > 0) {
    groups.push({ key: "day1", title: "Dzień 1", stations: day1 });
  }
  if (day2.length > 0) {
    groups.push({ key: "day2", title: "Dzień 2", stations: day2 });
  }
  if (bonus.length > 0) {
    groups.push({ key: "bonus", title: "Bonus", stations: bonus });
  }

  return groups;
}
