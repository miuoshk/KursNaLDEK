import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon | typeof FileText;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary">{title}</h2>
        {subtitle && (
          <p className="mt-1 font-body text-body-xs text-muted">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <span className="hidden sm:flex">
          <Icon className="size-4 text-muted" aria-hidden />
        </span>
      )}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon | typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-heading-sm text-primary">{title}</h3>
          {subtitle && (
            <p className="mt-1 font-body text-body-xs text-muted">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <span className="rounded-btn bg-white/5 p-2 text-secondary">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function SectionSkeleton({
  rows = 1,
  height = "h-32",
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`${height} animate-pulse rounded-card border border-border bg-card/50`}
        />
      ))}
    </div>
  );
}

export function KpiRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cols }).map((_, idx) => (
        <div
          key={idx}
          className="h-24 animate-pulse rounded-card border border-border bg-card/50"
        />
      ))}
    </div>
  );
}
