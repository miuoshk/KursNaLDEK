"use client";

import {
  Award,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  X,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { cn } from "@/lib/utils";
import { SesjaNaukiLink } from "@/features/shared/components/SesjaNaukiLink";
import { SidebarLink } from "@/features/shared/components/SidebarLink";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { formatStreak } from "@/lib/formatStreak";

export const SIDEBAR_NAV = [
  { href: "/statystyki", label: "Statystyki", icon: BarChart3 },
  { href: "/osiagniecia", label: "Osiągnięcia", icon: Award },
  { href: "/ustawienia", label: "Ustawienia", icon: Settings },
] as const;

type SidebarPanelProps = {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  className?: string;
};

export function SidebarPanel({
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  className,
}: SidebarPanelProps) {
  const { year } = useDashboardBreadcrumb();
  const { streak, displayName, initials } = useDashboardUser();
  const mobile = Boolean(onCloseMobile);

  return (
    <aside
      aria-label="Kurs na LDEK — menu nawigacji"
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-[color:var(--border-subtle)] bg-brand-bg transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[260px]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-[color:var(--border-subtle)]",
          collapsed && !mobile ? "justify-end px-2" : "justify-between px-3",
        )}
      >
        {(!collapsed || mobile) && (
          <p className="font-heading text-[16px] text-brand-gold">Kurs na LDEK</p>
        )}
        {mobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors duration-200",
              "hover:bg-white/[0.04] hover:text-primary",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label="Zamknij menu"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors duration-200 ease-out",
              "hover:bg-white/[0.04] hover:text-primary",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label={collapsed ? "Rozwiń panel boczny" : "Zwiń panel boczny"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-[color:var(--border-subtle)] px-4 py-4",
          collapsed && !mobile && "flex-col px-2",
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-mono text-sm font-semibold text-brand-gold",
          )}
          aria-hidden
        >
          {initials}
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-md font-medium text-primary">
              {displayName}
            </p>
            <p className="mt-0.5 font-body text-body-xs text-secondary">
              Rok {year} · Stomatologia · {formatStreak(streak)}
            </p>
          </div>
        )}
        <div className={cn("shrink-0", collapsed && !mobile && "mt-1")}>
          <LogoutButton />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4" aria-label="Główna nawigacja">
        <SidebarLink
          href="/pulpit"
          label="Pulpit"
          icon={LayoutDashboard}
          collapsed={collapsed && !mobile}
        />
        <SidebarLink
          href="/przedmioty"
          label="Moje przedmioty"
          icon={BookOpen}
          collapsed={collapsed && !mobile}
        />
        <SesjaNaukiLink collapsed={collapsed && !mobile} />
        {SIDEBAR_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed && !mobile}
          />
        ))}
      </nav>

      {(!collapsed || mobile) && (
        <p className="shrink-0 px-4 pb-6 font-body text-body-xs italic text-muted">
          Każde pytanie przybliża Cię do celu.
        </p>
      )}
    </aside>
  );
}
