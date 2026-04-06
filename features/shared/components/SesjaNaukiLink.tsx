"use client";

import Link from "next/link";
import { Brain } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { cn } from "@/lib/utils";

export function SesjaNaukiLink({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { dueReviewsCount } = useDashboardUser();
  const href =
    dueReviewsCount > 0 ? "/sesja/new?mode=powtorka&count=10" : "/przedmioty";
  const tooltip =
    dueReviewsCount > 0 ? "Sesja powtórkowa" : "Wybierz przedmiot";

  const inSession =
    pathname.startsWith("/sesja/") && !pathname.includes("/podsumowanie");
  const active =
    inSession ||
    (!inSession &&
      dueReviewsCount === 0 &&
      (pathname === "/przedmioty" || pathname.startsWith("/przedmioty/")));

  const linkInner = (
    <>
      <Brain
        className={cn(
          "size-5 shrink-0 transition-colors duration-200 ease-out",
          active ? "text-brand-gold" : "text-secondary",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "truncate font-body text-body-sm transition-colors duration-200 ease-out",
          active ? "text-brand-gold" : "text-secondary",
          collapsed && "sr-only",
        )}
      >
        Sesja nauki
      </span>
    </>
  );

  const linkClass = cn(
    "flex items-center gap-3 rounded-btn py-2.5 transition-colors duration-200 ease-out",
    "hover:bg-white/[0.04]",
    !collapsed && "px-3",
    collapsed && "justify-center px-2",
    active &&
      !collapsed &&
      "border-l-[3px] border-l-brand-gold bg-white/[0.04] pl-[calc(0.75rem-3px)]",
    active &&
      collapsed &&
      "border-l-[3px] border-l-brand-gold bg-white/[0.04] pl-[5px]",
    !active && "border-l-[3px] border-l-transparent",
  );

  const link = (
    <Link
      href={href}
      prefetch
      className={linkClass}
      aria-current={active ? "page" : undefined}
      title={collapsed ? tooltip : undefined}
    >
      {linkInner}
    </Link>
  );

  if (!collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className={cn(
            "z-50 rounded-btn border border-[color:var(--border-subtle)] bg-brand-card-1 px-2 py-1",
            "font-body text-body-xs text-secondary shadow-lg",
          )}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className={cn(
          "z-50 rounded-btn border border-[color:var(--border-subtle)] bg-brand-card-1 px-2 py-1",
          "font-body text-body-xs text-secondary shadow-lg",
        )}
      >
        Sesja nauki — {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
