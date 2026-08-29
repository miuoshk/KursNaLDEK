import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { GateCard } from "@/features/access/lib/gateTypes";
import { PricingGateCard } from "@/features/access/components/PricingGateCard";

type Props = {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  cards: GateCard[];
  checkoutAction: (formData: FormData) => Promise<void>;
  activateFreeAction: (formData: FormData) => Promise<void>;
  enterOwnedAction: (formData: FormData) => Promise<void>;
};

export async function PricingGate({
  eyebrow,
  title,
  lede,
  cards,
  checkoutAction,
  activateFreeAction,
  enterOwnedAction,
}: Props) {
  const t = await getTranslations("access");

  return (
    <div className="relative mx-auto w-full max-w-[1180px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,#143427_0%,transparent_70%)] opacity-90"
      />

      <header className="relative mb-8">
        <div className="flex items-center gap-3">
          <p className="shrink-0 font-body text-[11px] font-medium uppercase tracking-[0.18em] text-gate-gold">
            {eyebrow}
          </p>
          <span className="h-px min-w-8 flex-1 bg-gradient-to-r from-gate-gold/80 to-transparent" />
        </div>
        <h1 className="mt-3 font-heading text-3xl text-gate-ink md:text-[2.35rem]">{title}</h1>
        <p className="mt-3 max-w-2xl font-body text-body-md text-gate-ink-dim">{lede}</p>
      </header>

      <div className="relative grid grid-cols-1 gap-5 [grid-template-columns:repeat(auto-fill,minmax(255px,1fr))]">
        {cards.map((card) => (
          <PricingGateCard
            key={card.id}
            card={card}
            checkoutAction={checkoutAction}
            activateFreeAction={activateFreeAction}
            enterOwnedAction={enterOwnedAction}
          />
        ))}
      </div>

      <div className="relative mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gate-line pt-4 font-body text-[12px] text-gate-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {t("trustStripe")}
        </span>
        <span aria-hidden>·</span>
        <span>{t("trustMethods")}</span>
        <span aria-hidden>·</span>
        <span>{t("trustInstant")}</span>
      </div>
    </div>
  );
}
