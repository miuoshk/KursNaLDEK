import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { href: string; label: string };
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
    >
      <Icon className="size-12 text-muted" aria-hidden />
      <h2 className="mt-4 font-heading text-heading-sm text-secondary">{title}</h2>
      <p className="mt-2 max-w-md font-body text-body-md text-muted">{description}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-6 font-body text-body-sm font-medium text-brand-sage transition-colors hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
        >
          {cta.label}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
