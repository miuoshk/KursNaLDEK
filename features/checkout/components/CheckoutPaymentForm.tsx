import { CreditCard } from "lucide-react";

type Props = {
  track: string;
  year: number;
  ctaLabel: string;
  checkoutAction: (formData: FormData) => Promise<void>;
};

export function CheckoutPaymentForm({ track, year, ctaLabel, checkoutAction }: Props) {
  return (
    <form action={checkoutAction} className="mt-5">
      <input type="hidden" name="track" value={track} />
      <input type="hidden" name="year" value={String(year)} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand-gold px-4 py-2.5 font-body text-body-sm font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
      >
        <CreditCard className="h-4 w-4" />
        {ctaLabel}
      </button>
    </form>
  );
}
