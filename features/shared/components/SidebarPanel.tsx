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
import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { cn } from "@/lib/utils";
import { SidebarLink } from "@/features/shared/components/SidebarLink";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { getSloganPool, pickSlogan } from "@/features/shared/lib/slogans";
import { formatTrackLabel } from "@/features/access/lib/studyAccess";
import { formatStreakI18n } from "@/lib/formatStreak";

export const SIDEBAR_NAV = [
  { href: "/statystyki", labelKey: "statistics" as const, icon: BarChart3 },
  { href: "/osiagniecia", labelKey: "achievements" as const, icon: Award },
  { href: "/ustawienia", labelKey: "settings" as const, icon: Settings },
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
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tSlogans = useTranslations("slogans");
  const { year } = useDashboardBreadcrumb();
  const { streak, displayName, initials, avatarEmoji, currentTrack } =
    useDashboardUser();
  const tAccess = useTranslations("access");
  const trackLabel = formatTrackLabel(currentTrack, tAccess);
  const mobile = Boolean(onCloseMobile);
  const slogan = useMemo(
    () => pickSlogan(getSloganPool(tSlogans, "sidebar"), tSlogans("default")),
    [tSlogans],
  );
  const streakLabel = formatStreakI18n(tCommon, streak);

  return (
    <aside
      aria-label={tNav("sidebarAriaLabel")}
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[260px]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border",
          collapsed && !mobile ? "justify-end px-2" : "justify-between px-3",
        )}
      >
        {(!collapsed || mobile) && (
          <p className="font-heading text-[16px] text-brand-gold">{tCommon("appName")}</p>
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
            aria-label={tCommon("closeMenu")}
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
            aria-label={collapsed ? tNav("expandSidebar") : tNav("collapseSidebar")}
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
          "flex shrink-0 items-center gap-2 border-b border-border px-4 py-4",
          collapsed && !mobile && "flex-col px-2",
        )}
      >
        <Link
          href="/ustawienia"
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-80",
            collapsed && !mobile && "flex-col",
          )}
        >
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent-2",
              avatarEmoji
                ? "text-xl"
                : "font-body text-sm font-semibold text-brand-gold",
            )}
            aria-hidden
          >
            {avatarEmoji ?? initials}
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-body-md font-medium text-primary">
                {displayName}
              </p>
              <p className="mt-0.5 font-body text-body-xs text-secondary">
                {tCommon("yearProfileLine", {
                  year,
                  trackLabel,
                  streak: streakLabel,
                })}
              </p>
            </div>
          )}
        </Link>
        <div className={cn("shrink-0", collapsed && !mobile && "mt-1")}>
          <LogoutButton />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4" aria-label={tNav("mainNavAriaLabel")}>
        <SidebarLink
          href="/pulpit"
          label={tNav("dashboard")}
          icon={LayoutDashboard}
          collapsed={collapsed && !mobile}
        />
        <SidebarLink
          href="/przedmioty"
          label={tNav("mySubjects")}
          icon={BookOpen}
          collapsed={collapsed && !mobile}
        />
        {SIDEBAR_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={tNav(item.labelKey)}
            icon={item.icon}
            collapsed={collapsed && !mobile}
          />
        ))}
      </nav>

      {(!collapsed || mobile) && (
        <p className="shrink-0 px-4 pb-6 font-body text-body-xs italic text-muted">
          {slogan}
        </p>
      )}
    </aside>
  );
}
