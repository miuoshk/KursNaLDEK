"use client";

import Link from "next/link";
import { CONSUMER_WITHDRAWAL_WAIVER_TEXT } from "@/features/checkout/constants/consentText";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function ConsentCheckbox({ checked, onChange, disabled }: Props) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-background accent-brand-gold"
      />
      <span className="font-body text-xs leading-relaxed text-neutral-400">
        {CONSUMER_WITHDRAWAL_WAIVER_TEXT}{" "}
        <Link
          href={LEGAL_DOCUMENTS.regulamin.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-sage underline underline-offset-2 hover:text-brand-gold"
          onClick={(event) => event.stopPropagation()}
        >
          Regulamin
        </Link>
      </span>
    </label>
  );
}
