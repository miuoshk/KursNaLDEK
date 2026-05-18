"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BarChart3, FileText, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeTone = "gold" | "sage" | "neutral";

type NavItem = {
  href: string;
  label: string;
  icon: typeof BarChart3;
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
] as const;

export type AdminSidebarBadgeValues = {
  pendingReports?: number;
  newDiscussions24h?: number;
};

type AdminSidebarProps = {
  badges?: AdminSidebarBadgeValues;
};

function formatBadgeCount(value: number): string {
  if (value > 99) return "99+";
  return String(value);
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
      return active
        ? "bg-white/15 text-white"
        : "bg-white/10 text-secondary";
  }
}

function SidebarBadge({
  count,
  tone,
  active,
  title,
}: {
  count: number;
  tone: BadgeTone;
  active: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      aria-label={title ? `${title}: ${count}` : `${count}`}
      className={cn(
        "ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[6px]",
        "font-body text-[11px] font-semibold leading-none tabular-nums",
        "transition-colors",
        badgeToneClasses(tone, active),
      )}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

export function AdminSidebar({ badges }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <p className="font-heading text-[15px] text-brand-gold">
          Kurs na LDEK — Admin
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0;
          const showBadge = !!item.badgeKey && badgeCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-btn px-3 py-2.5 font-body text-body-sm transition-colors",
                active
                  ? "bg-white/[0.04] font-medium text-brand-gold"
                  : "text-secondary hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
              {showBadge && (
                <SidebarBadge
                  count={badgeCount}
                  tone={item.badgeTone ?? "neutral"}
                  active={active}
                  title={item.badgeTitle}
                />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-border px-4 py-3">
        <Link
          href="/pulpit"
          className="font-body text-body-xs text-muted transition-colors hover:text-white"
        >
          Wróć do aplikacji
        </Link>
      </div>
    </aside>
  );
}
