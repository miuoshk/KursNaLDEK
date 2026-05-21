"use client";

import { Root as SwitchRoot, Thumb as SwitchThumb } from "@radix-ui/react-switch";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Aria label - wymagany dla a11y bez widocznego labela */
  "aria-label"?: string;
  /** Aria labelledby - alternatywa dla `aria-label` */
  "aria-labelledby"?: string;
  className?: string;
};

/**
 * Standardowy toggle aplikacji, oparty o Radix Switch.
 *
 * Geometria dobrana tak, by thumb był idealnie wycentrowany w obu stanach:
 *   - container 24×44 px (h-6 w-11) z paddingiem 2px (p-0.5)
 *   - thumb 20×20 px (size-5)
 *   - przesunięcie 20px (translate-x-5) w stanie checked - dotyka prawej
 *     krawędzi wewnętrznego obszaru bez wystawania
 *
 * Zmiana koloru tła + transformacja thumba dzielą wspólny timing (200ms,
 * ease-out) zgodny z resztą design systemu.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle(
    {
      checked,
      onCheckedChange,
      disabled,
      className,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
    },
    ref,
  ) {
    return (
      <SwitchRoot
        ref={ref}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-out",
          "bg-white/10 data-[state=checked]:bg-brand-gold",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
          className,
        )}
      >
        <SwitchThumb
          className={cn(
            "block size-5 rounded-full bg-white shadow transition-transform duration-200 ease-out will-change-transform",
            "translate-x-0 data-[state=checked]:translate-x-5",
          )}
        />
      </SwitchRoot>
    );
  },
);
