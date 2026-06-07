"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { ConsentCheckbox } from "@/features/checkout/components/ConsentCheckbox";
import { CONSUMER_CONSENT_FIELD } from "@/features/checkout/constants/consentText";
import { cn } from "@/lib/utils";

type Props = {
  track: string;
  year: number;
  ctaLabel: string;
  checkoutAction: (formData: FormData) => Promise<void>;
};

export function CheckoutPaymentForm({ track, year, ctaLabel, checkoutAction }: Props) {
  const [consented, setConsented] = useState(false);

  return (
    <form action={checkoutAction} className="mt-5 space-y-4">
      <input type="hidden" name="track" value={track} />
      <input type="hidden" name="year" value={String(year)} />
      <input type="hidden" name={CONSUMER_CONSENT_FIELD} value={consented ? "1" : "0"} />

      <ConsentCheckbox checked={consented} onChange={setConsented} />

      <button
        type="submit"
        disabled={!consented}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 py-2.5 font-body text-body-sm font-semibold transition duration-200 ease-out",
          consented
            ? "bg-brand-gold text-brand-bg hover:brightness-110"
            : "cursor-not-allowed bg-brand-gold/40 text-brand-bg/70",
        )}
      >
        <CreditCard className="h-4 w-4" />
        {ctaLabel}
      </button>
    </form>
  );
}
