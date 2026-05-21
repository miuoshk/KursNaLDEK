import Link from "next/link";
import { formatSessionDuration } from "@/features/session/lib/formatSessionDuration";
import { sessionModeLabel } from "@/features/session/lib/sessionModeLabel";
import type { SessionMode } from "@/features/session/types";
import { cn } from "@/lib/utils";
import { pytaniaForm } from "@/lib/pluralizePolish";

export type SessionHistoryItem = {
  id: string;
  subjectName: string;
  mode: string;
  completedAt: string;
  accuracy: number | null;
  totalQuestions: number;
  durationSeconds: number | null;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Intl.DateTimeFormat("en-CA", {
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
  if (day === today) return "dzisiaj";
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

type Props = {
  sessions: SessionHistoryItem[];
  emptyText?: string;
  emptyAction?: { href: string; label: string };
};

export function SessionHistoryList({
  sessions,
  emptyText = "Nie masz jeszcze żadnych sesji.",
  emptyAction,
}: Props) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-card border border-border bg-card p-4 font-body text-body-sm text-secondary">
        {emptyText}
        {emptyAction ? (
          <>
            {" "}
            <Link href={emptyAction.href} className="text-brand-gold hover:underline">
              {emptyAction.label}
            </Link>
            !
          </>
        ) : null}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link
            href={`/sesja/${s.id}/podsumowanie`}
            className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded-card border border-border bg-card p-4 transition-colors duration-200 hover:border-brand-gold/40 hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40"
          >
            <p className="font-body text-body-sm text-primary">
              {s.subjectName}
              <span className="text-secondary"> · {sessionModeLabel(s.mode as SessionMode)} · {formatWhen(s.completedAt)}</span>
            </p>
            <p
              className={cn(
                "row-span-2 self-center text-right font-heading text-2xl font-bold tabular-nums",
                accColor(s.accuracy),
              )}
            >
              {s.accuracy != null ? `${Math.round(s.accuracy * 100)}%` : "—"}
            </p>
            <p className="font-body text-body-xs text-muted">
              {s.totalQuestions} {pytaniaForm(s.totalQuestions)}
              {s.durationSeconds != null ? ` · ${formatSessionDuration(s.durationSeconds)}` : ""}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
