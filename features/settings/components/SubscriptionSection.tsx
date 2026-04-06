import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { SettingsProfile } from "@/features/settings/types";
import { cn } from "@/lib/utils";

type Props = {
  profile: SettingsProfile;
};

export function SubscriptionSection({ profile }: Props) {
  const active = profile.subscription_status === "active";
  const ends = profile.subscription_ends_at
    ? format(new Date(profile.subscription_ends_at), "d.MM.yyyy", { locale: pl })
    : null;

  return (
    <section>
      <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">SUBSKRYPCJA</h2>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-pill px-3 py-1 font-body text-body-xs font-medium",
              active ? "bg-success/10 text-success" : "bg-error/10 text-error",
            )}
          >
            {active ? "Aktywna" : "Nieaktywna"}
          </span>
          {ends ? (
            <p className="font-body text-body-md text-secondary">Ważna do: {ends}</p>
          ) : (
            <p className="font-body text-body-md text-secondary">Brak daty końca w profilu.</p>
          )}
        </div>
        {active && profile.stripe_customer_id ? (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
          >
            Zarządzaj subskrypcją →
          </a>
        ) : (
          <Link
            href="/cennik"
            className="inline-flex rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
          >
            Wykup dostęp
          </Link>
        )}
      </div>
    </section>
  );
}
