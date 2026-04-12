"use client";

import { motion } from "framer-motion";
import type { PulpitData } from "@/features/pulpit/server/loadPulpit";
import { ActivityHeatmap } from "@/features/pulpit/components/ActivityHeatmap";
import { ProgressChart } from "@/features/pulpit/components/ProgressChart";
import { PulpitQuickStart } from "@/features/pulpit/components/PulpitQuickStart";
import { PulpitRecentSessions } from "@/features/pulpit/components/PulpitRecentSessions";
import { PulpitTodayCards } from "@/features/pulpit/components/PulpitTodayCards";
import { WeakPoints } from "@/features/pulpit/components/WeakPoints";

const DATE_FMT = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Warsaw",
});

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Dzień dobry! Gotowy na nowe wyzwania?";
  if (h >= 12 && h < 18) return "Jak leci? Czas na trochę nauki.";
  if (h >= 18 && h < 22) return "Dobry wieczór! Wieczorna sesja?";
  return "Nocna sowa? Nie zapomnij o śnie!";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PulpitDashboard({ data }: { data: PulpitData }) {
  const hasAnySessions = data.recentSessions.length > 0;
  const todayLabel = capitalize(DATE_FMT.format(new Date()));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
            Witaj, {data.displayName}!
          </h1>
          <p className="mt-1 font-body text-sm text-secondary">
            {getGreeting()}
          </p>
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <p className="font-body text-sm text-secondary">{todayLabel}</p>
        </div>
      </header>

      <PulpitTodayCards data={data} />
      <PulpitQuickStart data={data} />
      <ActivityHeatmap activityDays={data.activityDays} />
      <ProgressChart progressHistory={data.progressHistory} />
      <WeakPoints weakPoints={data.weakPoints} hasAnySessions={hasAnySessions} />
      <PulpitRecentSessions sessions={data.recentSessions} />
    </motion.div>
  );
}
