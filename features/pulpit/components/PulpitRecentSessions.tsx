"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PulpitRecentSession } from "@/features/pulpit/server/loadPulpit";
import { SessionHistoryList } from "@/features/shared/components/SessionHistoryList";

export function PulpitRecentSessions({ sessions }: { sessions: PulpitRecentSession[] }) {
  const t = useTranslations("pulpit");

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-primary">{t("sessionHistory")}</h2>
        <Link
          href="/statystyki"
          className="font-body text-sm text-brand-gold transition-colors hover:underline"
        >
          {t("seeAll")}
        </Link>
      </div>
      <div className="mt-4">
        <SessionHistoryList
          sessions={sessions}
          emptyAction={{ href: "/przedmioty", label: t("startLearningEmpty") }}
        />
      </div>
    </section>
  );
}
