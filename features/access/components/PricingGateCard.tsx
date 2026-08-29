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

const CHECK_COLOR: Record<GateCardState, string> = {
  locked: "text-gate-paid",
  trial: "text-gate-trial",
  owned: "text-gate-owned",
};

export function PricingGateCard({ card, checkoutAction, activateFreeAction, enterOwnedAction }: Props) {
  const t = useTranslations("access");

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-gate border p-5",
        "transition-[transform,box-shadow] duration-[220ms] ease-out",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
        card.featured
          ? "border-transparent [background:linear-gradient(172deg,var(--color-gate-surface-hi),var(--color-gate-surface))_padding-box,linear-gradient(160deg,var(--color-gate-gold-hi),var(--color-gate-gold),var(--color-gate-gold-deep))_border-box]"
          : "border-gate-line [background:linear-gradient(172deg,var(--color-gate-surface-hi),var(--color-gate-surface))]",
      )}
    >
      {card.featured && card.featuredLabel ? (
        <span className="absolute -top-[11px] left-1/2 z-10 -translate-x-1/2 rounded-pill bg-gate-gold px-3 py-0.5 font-body text-[11px] font-semibold tracking-wide text-gate-gold-ink">
          {card.featuredLabel}
        </span>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.18em] text-gate-ink-faint">
          {card.kierunek}
        </p>
        <StateChip state={card.state} t={t} />
      </div>

      <h2 className="mt-3 font-heading text-[30px] leading-tight text-gate-ink">{card.rok}</h2>

      <ul className="mt-4 space-y-2 border-t border-gate-divider pt-4">
        {card.includes.map((item) => (
          <li key={item} className="flex items-start gap-2 font-body text-body-sm text-gate-ink-dim">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", CHECK_COLOR[card.state])} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        {card.state === "owned" ? (
          <p className="font-body text-body-sm text-gate-ink-dim">{card.ownedNote}</p>
        ) : card.price ? (
          <div>
            <p className="font-heading text-2xl font-bold text-gate-ink">{card.price.amount}</p>
            <p className="mt-1 font-body text-body-xs text-gate-ink-faint">{card.price.note}</p>
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
      <span className="inline-flex items-center gap-1 rounded-pill border border-gate-owned/35 bg-gate-owned/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-gate-owned">
        <Check className="h-3 w-3" aria-hidden />
        {t("badgeOwned")}
      </span>
    );
  }
  if (state === "trial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill border border-gate-trial/35 bg-gate-trial/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-gate-trial">
        {t("badgeTest")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-gate-paid-border bg-gate-paid/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-gate-paid">
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
  const goldClass =
    "bg-[linear-gradient(120deg,var(--color-gate-gold-hi),var(--color-gate-gold),var(--color-gate-gold-deep))] text-gate-gold-ink shadow-[0_8px_24px_rgba(217,180,91,0.28)] hover:brightness-105";
  const ghostClass =
    "border border-gate-line bg-transparent text-gate-ink hover:bg-white/[0.04]";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-gate-cta px-4 py-2.5",
        "font-body text-body-sm font-semibold transition duration-200 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gate-gold",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variant === "gold" ? goldClass : ghostClass,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
