import Link from "next/link";
import type { PulpitRecentSession } from "@/features/pulpit/server/loadPulpit";
import { SessionHistoryList } from "@/features/shared/components/SessionHistoryList";

export function PulpitRecentSessions({ sessions }: { sessions: PulpitRecentSession[] }) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-primary">Historia sesji</h2>
        <Link
          href="/statystyki"
          className="font-body text-sm text-brand-gold transition-colors hover:underline"
        >
          Zobacz wszystkie →
        </Link>
      </div>
      <div className="mt-4">
        <SessionHistoryList
          sessions={sessions}
          emptyAction={{ href: "/przedmioty", label: "Rozpocznij naukę" }}
        />
      </div>
    </section>
  );
}
