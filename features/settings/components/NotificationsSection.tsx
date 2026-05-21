"use client";

import { useState } from "react";
import { updateNotifications } from "@/features/settings/api/updateNotifications";
import type { SettingsProfile } from "@/features/settings/types";
import { useToast } from "@/features/shared/components/ToastProvider";
import { Toggle } from "@/features/shared/components/Toggle";

type Props = { profile: SettingsProfile };

export function NotificationsSection({ profile }: Props) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(profile.notifications_reviews);
  const [weekly, setWeekly] = useState(profile.notifications_weekly);

  async function save(next: { reviews?: boolean; weekly?: boolean }) {
    const r = next.reviews ?? reviews;
    const w = next.weekly ?? weekly;
    const res = await updateNotifications({
      notifications_reviews: r,
      notifications_weekly: w,
    });
    if (!res.ok) toast(res.message, "error");
  }

  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-primary">Powiadomienia</h2>
      <ul className="mt-6 space-y-6">
        <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              id="notify-reviews-label"
              className="font-body text-body-sm text-primary"
            >
              Przypomnienie o powtórkach
            </p>
            <p className="font-body text-body-xs text-muted">
              Powiadomienie gdy masz zaległe powtórki
            </p>
          </div>
          <Toggle
            checked={reviews}
            onCheckedChange={async (v) => {
              setReviews(v);
              await save({ reviews: v });
            }}
            aria-labelledby="notify-reviews-label"
          />
        </li>
        <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              id="notify-weekly-label"
              className="font-body text-body-sm text-primary"
            >
              Raport tygodniowy
            </p>
            <p className="font-body text-body-xs text-muted">
              Cotygodniowe podsumowanie postępów na email
            </p>
          </div>
          <Toggle
            checked={weekly}
            onCheckedChange={async (v) => {
              setWeekly(v);
              await save({ weekly: v });
            }}
            aria-labelledby="notify-weekly-label"
          />
        </li>
      </ul>
    </section>
  );
}
