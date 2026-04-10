import Link from "next/link";
import type { PulpitRecentSession } from "@/features/pulpit/server/loadPulpit";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import type { SessionMode } from "@/features/session/types";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const w = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  if (day === w) return "dzisiaj";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function accColor(a: number | null): string {
  if (a == null) return "text-muted";
  if (a >= 0.7) return "text-success";
  if (a >= 0.5) return "text-brand-gold";
  return "text-error";
}

export function PulpitRecentSessions({ sessions }: { sessions: PulpitRecentSession[] }) {
  return (
    <section>
      <h2 className="font-heading text-heading-sm text-primary">Ostatnie sesje</h2>
      <ul className="mt-4 space-y-3">
        {sessions.length === 0 ? (
          <li className="rounded-card bg-card border border-border p-4 font-body text-body-sm text-secondary">
            Nie masz jeszcze żadnych sesji.{" "}
            <Link href="/przedmioty" className="text-brand-gold hover:underline">
              Rozpocznij naukę
            </Link>
            !
          </li>
        ) : (
          sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 rounded-card bg-card border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-body text-body-sm text-primary">
                  {s.subjectName} · {sessionModeLabel(s.mode as SessionMode)} · {formatWhen(s.completedAt)}
                </p>
              </div>
              <p className={cn("font-mono text-body-md", accColor(s.accuracy))}>
                {s.accuracy != null ? `${Math.round(s.accuracy * 100)}%` : "—"}
              </p>
              <p className="font-body text-body-xs text-muted">
                {s.totalQuestions} pytań
                {s.durationSeconds != null ? ` · ${formatSessionDuration(s.durationSeconds)}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
