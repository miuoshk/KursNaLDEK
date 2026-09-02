import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { GateCard } from "@/features/access/lib/gateTypes";
import { PricingGateCard } from "@/features/access/components/PricingGateCard";
import { Rycina } from "@/features/shared/components/Rycina";

type Props = {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  layout: "years" | "durations";
  cards: GateCard[];
  checkoutAction: (formData: FormData) => Promise<void>;
  activateFreeAction: (formData: FormData) => Promise<void>;
  enterOwnedAction: (formData: FormData) => Promise<void>;
};

export async function PricingGate({
  eyebrow,
  title,
  lede,
  layout,
  cards,
  checkoutAction,
  activateFreeAction,
  enterOwnedAction,
}: Props) {
  const t = await getTranslations("access");
  const groups = groupCards(cards, layout);

  return (
    <div className="relative mx-auto w-full max-w-[1180px]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Rycina
          id="anat-trigeminal"
          mask="fade-y"
          className="left-1/2 top-[-8%] aspect-[0.86] w-[min(920px,110%)] -translate-x-1/2 opacity-[0.09]"
        />
      </div>

      <header className="relative mb-10">
        <p className="font-body text-body-xs font-semibold uppercase tracking-[0.2em] text-brand-sage">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-balance font-heading text-[clamp(1.85rem,3.6vw,2.6rem)] leading-tight text-primary">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-body-md leading-7 text-secondary">{lede}</p>
      </header>

      <div className="relative space-y-10">
        {groups.map((group) => (
          <section key={group.kierunek} aria-label={group.kierunek}>
            {group.showHeading ? (
              <h2 className="mb-4 font-body text-body-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                {group.kierunek}
              </h2>
            ) : null}
            <div
              className={
                layout === "durations"
                  ? "grid grid-cols-1 gap-5 pt-4 md:grid-cols-3"
                  : "grid grid-cols-1 gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {group.cards.map((card) => (
                <PricingGateCard
                  key={card.id}
                  card={card}
                  checkoutAction={checkoutAction}
                  activateFreeAction={activateFreeAction}
                  enterOwnedAction={enterOwnedAction}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="relative mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 font-body text-[12px] text-muted">
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

function groupCards(cards: GateCard[], layout: "years" | "durations") {
  const order: string[] = [];
  const byKierunek = new Map<string, GateCard[]>();
  for (const card of cards) {
    if (!byKierunek.has(card.kierunek)) {
      byKierunek.set(card.kierunek, []);
      order.push(card.kierunek);
    }
    byKierunek.get(card.kierunek)?.push(card);
  }
  const showHeadings = layout === "years" && order.length > 1;
  return order.map((kierunek) => ({
    kierunek,
    cards: byKierunek.get(kierunek) ?? [],
    showHeading: showHeadings,
  }));
}
