import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

export function AdminMetricCard({ label, value, highlight }: AdminMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border bg-card p-5",
        highlight ? "border-brand-gold/30" : "border-border",
      )}
    >
      <p className="font-body text-body-xs uppercase tracking-normal text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-body text-heading-lg",
          highlight ? "text-brand-gold" : "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
