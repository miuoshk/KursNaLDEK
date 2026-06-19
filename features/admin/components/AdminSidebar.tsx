"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  MessageSquare,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { useAdminSidebarStore } from "@/features/admin/stores/adminSidebarStore";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";

type BadgeTone = "gold" | "sage" | "neutral";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "pendingReports" | "newDiscussions24h";
  badgeTone?: BadgeTone;
  badgeTitle?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/pytania", label: "Pytania", icon: FileText },
  {
    href: "/admin/bledy",
    label: "Zgłoszenia błędów",
    icon: AlertTriangle,
    badgeKey: "pendingReports",
    badgeTone: "gold",
    badgeTitle: "Zgłoszenia oczekujące",
  },
  {
    href: "/admin/dyskusje",
    label: "Dyskusje",
    icon: MessageSquare,
    badgeKey: "newDiscussions24h",
    badgeTone: "sage",
    badgeTitle: "Nowe dyskusje (24h)",
  },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users },
  { href: "/admin/historia-pytan", label: "Historia zmian", icon: History },
] as const;

export type AdminSidebarBadgeValues = {
  pendingReports?: number;
  newDiscussions24h?: number;
};

type AdminUserInfo = {
  displayName: string;
  email: string | null;
  role: "admin" | "moderator";
};

type AdminSidebarProps = {
  badges?: AdminSidebarBadgeValues;
  user: AdminUserInfo;
};

function formatBadgeCount(value: number): string {
  return value > 99 ? "99+" : String(value);
}

function badgeToneClasses(tone: BadgeTone, active: boolean): string {
  switch (tone) {
    case "gold":
      return active
        ? "bg-brand-gold text-brand-bg"
        : "bg-brand-gold/15 text-brand-gold";
    case "sage":
      return active
        ? "bg-brand-sage text-white"
        : "bg-brand-sage/20 text-brand-sage";
    case "neutral":
    default:
      return active ? "bg-white/15 text-white" : "bg-white/10 text-secondary";
  }
}

function SidebarBadge({
  count,
  tone,
  active,
  title,
  compact,
}: {
  count: number;
  tone: BadgeTone;
  active: boolean;
  title?: string;
  compact?: boolean;
}) {
  return (
    <span
      title={title}
      aria-label={title ? `${title}: ${count}` : `${count}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-body font-semibold leading-none tabular-nums transition-colors",
        compact
          ? "h-[16px] min-w-[16px] px-[4px] text-[10px]"
          : "ml-auto h-[18px] min-w-[18px] px-[6px] text-[11px]",
        badgeToneClasses(tone, active),
      )}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

type AdminSidebarPanelProps = {
  collapsed: boolean;
  badges?: AdminSidebarBadgeValues;
  user: AdminUserInfo;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
};

function AdminSidebarPanel({
  collapsed,
  badges,
  user,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarPanelProps) {
  const pathname = usePathname();
  const mobile = Boolean(onCloseMobile);
  const showText = !collapsed || mobile;

  return (
    <aside
      aria-label="Panel admina — nawigacja"
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out",
        collapsed && !mobile ? "w-16" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border",
          collapsed && !mobile ? "justify-end px-2" : "justify-between px-3",
        )}
      >
        {showText && (
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
            title="Panel admina"
          >
            <ShieldCheck className="size-4 shrink-0 text-brand-gold" aria-hidden />
            <span className="font-heading text-[15px] text-brand-gold">
              Kurs na LDEK
            </span>
          </Link>
        )}
        {mobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex size-8 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
            aria-label="Zamknij menu"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex size-8 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
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
          "flex shrink-0 items-center gap-3 border-b border-border",
          collapsed && !mobile ? "flex-col px-2 py-3" : "px-4 py-4",
        )}
      >
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-body text-sm font-semibold text-brand-gold"
          aria-hidden
          title={user.displayName}
        >
          {initials(user.displayName)}
        </div>
        {showText && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-md font-medium text-primary">
              {user.displayName}
            </p>
            <p className="mt-0.5 truncate font-body text-body-xs text-muted">
              {user.email ?? "—"}
            </p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-body text-[11px] font-medium",
                user.role === "admin"
                  ? "bg-brand-gold/15 text-brand-gold"
                  : "bg-brand-sage/20 text-brand-sage",
              )}
            >
              <ShieldCheck className="size-3" aria-hidden />
              {user.role === "admin" ? "Admin" : "Moderator"}
            </span>
          </div>
        )}
        {collapsed && !mobile && (
          <span
            className={cn(
              "mt-1 flex size-4 items-center justify-center rounded-full",
              user.role === "admin" ? "bg-brand-gold/30" : "bg-brand-sage/30",
            )}
            title={user.role === "admin" ? "Admin" : "Moderator"}
          >
            <ShieldCheck
              className={cn(
                "size-2.5",
                user.role === "admin" ? "text-brand-gold" : "text-brand-sage",
              )}
              aria-hidden
            />
          </span>
        )}
      </div>

      <TooltipProvider delayDuration={150}>
        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4"
          aria-label="Nawigacja admina"
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const badgeCount = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0;
            const showBadge = !!item.badgeKey && badgeCount > 0;
            const Icon = item.icon;

            const linkInner = (
              <>
                <span className="relative flex size-5 shrink-0 items-center justify-center">
                  <Icon
                    className={cn(
                      "size-5 transition-colors duration-200 ease-out",
                      active ? "text-brand-gold" : "text-secondary",
                    )}
                    aria-hidden
                  />
                  {collapsed && !mobile && showBadge && (
                    <span
                      className={cn(
                        "absolute -right-1.5 -top-1.5 inline-flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-[3px] font-body text-[9px] font-semibold tabular-nums",
                        item.badgeTone === "gold"
                          ? "bg-brand-gold text-brand-bg"
                          : "bg-brand-sage text-white",
                      )}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "truncate font-body text-body-sm transition-colors duration-200 ease-out",
                    active ? "text-brand-gold" : "text-secondary",
                    collapsed && !mobile && "sr-only",
                  )}
                >
                  {item.label}
                </span>
                {showText && showBadge && (
                  <SidebarBadge
                    count={badgeCount}
                    tone={item.badgeTone ?? "neutral"}
                    active={active}
                    title={item.badgeTitle}
                  />
                )}
              </>
            );

            const linkClass = cn(
              "flex items-center gap-3 rounded-btn py-2.5 transition-colors duration-200 ease-out hover:bg-white/[0.04]",
              !collapsed || mobile ? "px-3" : "justify-center px-2",
              active &&
                (!collapsed || mobile) &&
                "border-l-[3px] border-l-brand-gold bg-white/[0.04] pl-[calc(0.75rem-3px)]",
              active &&
                collapsed &&
                !mobile &&
                "border-l-[3px] border-l-brand-gold bg-white/[0.04] pl-[5px]",
              !active && "border-l-[3px] border-l-transparent",
            );

            const link = (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={linkClass}
                aria-current={active ? "page" : undefined}
                title={collapsed && !mobile ? item.label : undefined}
              >
                {linkInner}
              </Link>
            );

            if (collapsed && !mobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="z-50 rounded-btn border border-border bg-card px-2 py-1 font-body text-body-xs text-secondary shadow-lg"
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.label}
                      {showBadge && (
                        <SidebarBadge
                          count={badgeCount}
                          tone={item.badgeTone ?? "neutral"}
                          active={false}
                          compact
                        />
                      )}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>
      </TooltipProvider>

      <div
        className={cn(
          "shrink-0 border-t border-border",
          collapsed && !mobile ? "px-2 py-3" : "px-4 py-3",
        )}
      >
        <Link
          href="/pulpit"
          className={cn(
            "flex items-center gap-2 rounded-btn px-2 py-2 font-body text-body-xs text-muted transition-colors hover:bg-white/[0.04] hover:text-white",
            collapsed && !mobile && "justify-center",
          )}
          title="Wróć do aplikacji"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          {showText && <span>Wróć do aplikacji</span>}
        </Link>
      </div>
    </aside>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
}

export function AdminSidebar({ badges, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const isMobile = useMobileViewport();
  const narrow = useNarrowViewport();
  const collapsedFromStore = useAdminSidebarStore((s) => s.collapsed);
  const toggle = useAdminSidebarStore((s) => s.toggle);
  const mobileOpen = useAdminSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useAdminSidebarStore((s) => s.setMobileOpen);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu admina"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50 transition-opacity"
          aria-label="Zamknij menu"
          onClick={() => setMobileOpen(false)}
        />
        <div className="relative z-10 h-full max-w-[85vw] shadow-2xl">
          <AdminSidebarPanel
            collapsed={false}
            badges={badges}
            user={user}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>
      </div>
    );
  }

  const collapsed = narrow || collapsedFromStore;

  return (
    <div className="flex shrink-0">
      <AdminSidebarPanel
        collapsed={collapsed}
        badges={badges}
        user={user}
        onToggleCollapse={toggle}
      />
    </div>
  );
}
