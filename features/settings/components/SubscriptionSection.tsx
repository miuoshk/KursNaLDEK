import Link from "next/link";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { createBillingPortalSessionAction } from "@/features/access/actions";
import { SettingsCard } from "@/features/settings/components/SettingsCard";
import type { SettingsProfile } from "@/features/settings/types";
import type { AppLocale } from "@/i18n/config";
import { getDateFnsLocale } from "@/lib/i18n/dateFnsLocale";
import { cn } from "@/lib/utils";

type Props = {
  profile: SettingsProfile;
};

export async function SubscriptionSection({ profile }: Props) {
  const t = await getTranslations("settings");
  const locale = (await getLocale()) as AppLocale;
  const dateLocale = getDateFnsLocale(locale);
  const active = profile.subscription_status === "active";
  const ends = profile.subscription_ends_at
    ? format(new Date(profile.subscription_ends_at), "d.MM.yyyy", { locale: dateLocale })
    : null;

  return (
    <SettingsCard title={t("subscription.title")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-pill px-3 py-1 font-body text-body-xs font-medium",
              active ? "bg-success/10 text-success" : "bg-error/10 text-error",
            )}
          >
            {active ? t("subscription.active") : t("subscription.inactive")}
          </span>
          {ends ? (
            <p className="font-body text-body-md text-secondary">
              {t("subscription.validUntil", { date: ends })}
            </p>
          ) : (
            <p className="font-body text-body-md text-secondary">{t("subscription.noEndDate")}</p>
          )}
        </div>
        {active ? (
          profile.stripe_customer_id ? (
            <form action={createBillingPortalSessionAction}>
              <button
                type="submit"
                className="inline-flex font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
              >
                {t("subscription.manage")}
              </button>
            </form>
          ) : null
        ) : (
          <Link
            href="/cennik"
            className="inline-flex rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
          >
            {t("subscription.purchase")}
          </Link>
        )}
      </div>
    </SettingsCard>
  );
}
