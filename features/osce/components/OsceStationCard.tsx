import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { OsceStation } from "@/features/osce/types";
import { cn } from "@/lib/utils";

type OsceStationCardProps = {
  station: OsceStation;
  fullWidthOnLarge?: boolean;
};

function truncateTaskDescription(value: string, max = 80): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function formatTask(station: OsceStation, index: number): string {
  const description = station.exam_tasks?.[index]?.description;
  if (!description) return "Wkrótce";
  return truncateTaskDescription(description, 80);
}

function getProgressPercent(station: OsceStation): number {
  if (station.question_count <= 0) return 0;
  return Math.min(100, Math.round(station.answered_questions / station.question_count * 100));
}

export function OsceStationCard({ station, fullWidthOnLarge = false }: OsceStationCardProps) {
  const progressPercent = getProgressPercent(station);
  const competencyCodes = station.competencies?.map((item) => item.code).filter(Boolean) ?? [];

  return (
    <li className={cn(fullWidthOnLarge && "md:col-span-2 lg:col-span-3")}>
      <article className="h-full rounded-xl border border-[#367368]/20 bg-[#002A27] p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 font-body text-lg font-semibold text-[#C9A84C]">
            {station.display_order}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-body text-base font-bold text-white">{station.name}</h3>
            <p className="mt-1 font-body text-sm text-white/50">{station.short_name}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[0, 1].map((index) => (
            <div
              key={`${station.id}-task-${index + 1}`}
              className="flex items-start gap-1.5 rounded-lg bg-white/5 px-2.5 py-2"
            >
              <ClipboardList className="mt-0.5 size-3 shrink-0 text-white/40" aria-hidden />
              <p className="font-body text-xs text-white/40">
                Zadanie {index + 1}: {formatTask(station, index)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="font-body text-[11px] uppercase tracking-wide text-white/50">Postęp</p>
            <p className="font-body text-[11px] text-white/50">
              {station.answered_questions}/{station.question_count} ({progressPercent}%)
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#367368]/20">
            <div
              className="h-full rounded-full bg-[#367368] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {competencyCodes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {competencyCodes.map((code) => (
              <span
                key={`${station.id}-${code}`}
                className="rounded bg-[#C9A84C]/10 px-1.5 py-0.5 font-body text-[10px] text-[#C9A84C]"
              >
                {code}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/osce/${station.id}`}
          className="mt-5 inline-flex font-body text-sm font-medium text-[#C9A84C] transition-opacity hover:opacity-80"
        >
          Otwórz stację →
        </Link>
      </article>
    </li>
  );
}
