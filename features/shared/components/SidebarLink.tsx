"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
};

export function SidebarLink({
  href,
  label,
  icon: Icon,
  collapsed,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/dashboard/"
      : href === "/przedmioty"
        ? pathname === "/przedmioty" || pathname.startsWith("/przedmioty/")
        : href === "/statystyki"
          ? pathname === "/statystyki" || pathname.startsWith("/statystyki/")
          : href === "/osiagniecia"
            ? pathname === "/osiagniecia" ||
              pathname.startsWith("/osiagniecia/")
          : href === "/ustawienia"
            ? pathname === "/ustawienia" ||
              pathname.startsWith("/ustawienia/")
            : pathname === href || pathname.startsWith(`${href}/`);

  const linkInner = (
    <>
      <Icon
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
        {label}
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
      className={linkClass}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      {linkInner}
    </Link>
  );

  if (!collapsed) {
    return link;
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
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
