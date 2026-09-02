"use client";

import { Check, Loader2, Lock } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import type { GateCard, GateCardState } from "@/features/access/lib/gateTypes";
import { cn } from "@/lib/utils";

type Actions = {
  checkoutAction: (formData: FormData) => Promise<void>;
  activateFreeAction: (formData: FormData) => Promise<void>;
  enterOwnedAction: (formData: FormData) => Promise<void>;
};

type Props = {
  card: GateCard;
} & Actions;

export function PricingGateCard({ card, checkoutAction, activateFreeAction, enterOwnedAction }: Props) {
  const t = useTranslations("access");

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-visible rounded-card border bg-card p-6",
        "transition-colors duration-200 ease-out",
        card.featured
          ? "border-brand-gold/45"
          : "border-border hover:border-brand-sage/40",
      )}
    >
      {card.featured && card.featuredLabel ? (
        <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-pill bg-brand-gold px-3 py-0.5 font-body text-[11px] font-semibold tracking-wide text-brand-bg">
          {card.featuredLabel}
        </span>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {card.kierunek}
        </p>
        <StateChip state={card.state} t={t} />
      </div>

      <h2 className="mt-3 font-heading text-[30px] leading-tight text-primary">{card.rok}</h2>
      <p className="mt-3 font-body text-body-sm leading-6 text-secondary">{card.summary}</p>

      <div className="mt-auto pt-6">
        {card.state === "owned" ? (
          card.remainingDays != null ? (
            <p className="font-body text-body-sm text-secondary">
              {t("remainingDays", { count: card.remainingDays })}
            </p>
          ) : null
        ) : card.price ? (
          <div>
            <p className="font-heading text-2xl text-primary">{card.price.amount}</p>
            <p className="mt-1 font-body text-body-xs text-muted">{card.price.note}</p>
            {card.price.perDay ? (
              <p className="mt-0.5 font-body text-body-xs text-muted">
                {t("pricePerDay", { amount: card.price.perDay })}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4">
          {card.state === "locked" && card.checkoutFields ? (
            <GoldCheckoutForm
              fields={card.checkoutFields}
              label={t("unlockCta")}
              action={checkoutAction}
            />
          ) : card.state === "trial" && card.activateFields ? (
            <GhostActionForm
              fields={card.activateFields}
              label={t("goToDashboard")}
              action={activateFreeAction}
            />
          ) : (
            <GhostActionForm
              fields={card.enterFields ?? {}}
              label={t("goToDashboard")}
              action={enterOwnedAction}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function StateChip({
  state,
  t,
}: {
  state: GateCardState;
  t: ReturnType<typeof useTranslations<"access">>;
}) {
  if (state === "owned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-success/35 bg-success/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-success">
        <Check className="h-3 w-3" aria-hidden />
        {t("badgeOwned")}
      </span>
    );
  }
  if (state === "trial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-brand-sage/35 bg-brand-sage/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-brand-sage">
        {t("badgeTest")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-brand-gold/30 bg-brand-gold/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-brand-gold">
      <Lock className="h-3 w-3" aria-hidden />
      {t("badgePaid")}
    </span>
  );
}

function HiddenFields({ fields }: { fields: Record<string, string> }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function GoldCheckoutForm({
  fields,
  label,
  action,
}: {
  fields: Record<string, string>;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <HiddenFields fields={fields} />
      <PendingButton variant="gold" label={label} pendingLabel={label} />
    </form>
  );
}

function GhostActionForm({
  fields,
  label,
  action,
}: {
  fields: Record<string, string>;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <HiddenFields fields={fields} />
      <PendingButton variant="ghost" label={label} pendingLabel={label} />
    </form>
  );
}

function PendingButton({
  variant,
  label,
  pendingLabel,
}: {
  variant: "gold" | "ghost";
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const goldClass = "bg-brand-gold text-brand-bg hover:brightness-110";
  const ghostClass = "border border-border bg-transparent text-primary hover:bg-white/[0.04]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 py-2.5",
        "font-body text-body-sm font-semibold transition duration-200 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variant === "gold" ? goldClass : ghostClass,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
