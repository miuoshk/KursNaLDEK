import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { PulpitQuickStart } from "@/features/pulpit/components/PulpitQuickStart";
import { PulpitRecentSessions } from "@/features/pulpit/components/PulpitRecentSessions";
import { PulpitTodayCards } from "@/features/pulpit/components/PulpitTodayCards";

export function PulpitDashboard({ data }: { data: PulpitData }) {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-heading-lg text-primary">
          Witaj, {data.displayName}!
        </h1>
        <p className="mt-2 font-body text-body-md text-secondary">
          Oto Twoje podsumowanie na dziś.
        </p>
      </header>

      <PulpitTodayCards data={data} />
      <PulpitQuickStart data={data} />
      <PulpitRecentSessions sessions={data.recentSessions} />
    </div>
  );
}
