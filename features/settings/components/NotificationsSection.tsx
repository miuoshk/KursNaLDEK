"use client";

import { Root as SwitchRoot, Thumb as SwitchThumb } from "@radix-ui/react-switch";
import { useState } from "react";
import { updateNotifications } from "@/features/settings/api/updateNotifications";
import type { SettingsProfile } from "@/features/settings/types";
import { useToast } from "@/features/shared/components/ToastProvider";
import { cn } from "@/lib/utils";

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
      <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">POWIADOMIENIA</h2>
      <ul className="mt-6 space-y-6">
        <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-body text-body-sm text-primary">Przypomnienie o powtórkach</p>
            <p className="font-body text-body-xs text-muted">Powiadomienie gdy masz zaległe powtórki</p>
          </div>
          <SwitchRoot
            checked={reviews}
            onCheckedChange={async (v) => {
              setReviews(v);
              await save({ reviews: v });
            }}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors",
              "bg-[rgba(255,255,255,0.1)] data-[state=checked]:bg-brand-gold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label="Przypomnienie o powtórkach"
          >
            <SwitchThumb
              className={cn(
                "block size-5 rounded-full bg-white shadow transition-transform duration-200",
                "translate-x-0 will-change-transform data-[state=checked]:translate-x-[22px]",
              )}
            />
          </SwitchRoot>
        </li>
        <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-body text-body-sm text-primary">Raport tygodniowy</p>
            <p className="font-body text-body-xs text-muted">Cotygodniowe podsumowanie postępów na email</p>
          </div>
          <SwitchRoot
            checked={weekly}
            onCheckedChange={async (v) => {
              setWeekly(v);
              await save({ weekly: v });
            }}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors",
              "bg-[rgba(255,255,255,0.1)] data-[state=checked]:bg-brand-gold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label="Raport tygodniowy"
          >
            <SwitchThumb
              className={cn(
                "block size-5 rounded-full bg-white shadow transition-transform duration-200",
                "translate-x-0 will-change-transform data-[state=checked]:translate-x-[22px]",
              )}
            />
          </SwitchRoot>
        </li>
      </ul>
    </section>
  );
}
