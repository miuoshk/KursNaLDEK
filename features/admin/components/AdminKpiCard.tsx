import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "sage" | "success" | "warning" | "error";

type AdminKpiCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  delta?: { value: number; label: string } | null;
};

const toneIconBg: Record<Tone, string> = {
  neutral: "bg-white/5 text-secondary",
  gold: "bg-brand-gold/15 text-brand-gold",
  sage: "bg-brand-sage/20 text-brand-sage",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
};

const toneBorder: Record<Tone, string> = {
  neutral: "border-border",
  gold: "border-brand-gold/30",
  sage: "border-brand-sage/30",
  success: "border-success/30",
  warning: "border-warning/30",
  error: "border-error/30",
};

const toneValueColor: Record<Tone, string> = {
  neutral: "text-primary",
  gold: "text-brand-gold",
  sage: "text-brand-sage",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  delta,
}: AdminKpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-card border bg-card p-4",
        toneBorder[tone],
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-btn",
            toneIconBg[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        {delta && (
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 font-body text-body-xs tabular-nums",
              delta.value >= 0
                ? "bg-success/15 text-success"
                : "bg-error/15 text-error",
            )}
          >
            {delta.value >= 0 ? "+" : ""}
            {delta.value}
            {delta.label ? ` ${delta.label}` : ""}
          </span>
        )}
      </div>
      <div>
        <p className="font-body text-body-xs uppercase tracking-widest text-muted">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 font-heading text-heading-lg tabular-nums",
            toneValueColor[tone],
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 font-body text-body-xs text-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}
