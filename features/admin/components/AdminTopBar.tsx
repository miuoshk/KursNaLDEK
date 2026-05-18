"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  ExternalLink,
  FileText,
  Menu,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSidebarStore } from "@/features/admin/stores/adminSidebarStore";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";

type AdminTopBarProps = {
  role: "admin" | "moderator";
};

type Crumb = {
  label: string;
  href?: string;
  icon?: LucideIcon;
};

const SECTION_META: Record<string, { label: string; icon: LucideIcon }> = {
  pytania: { label: "Pytania", icon: FileText },
  bledy: { label: "Zgłoszenia błędów", icon: AlertTriangle },
  dyskusje: { label: "Dyskusje", icon: MessageSquare },
  uzytkownicy: { label: "Użytkownicy", icon: Users },
};

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "Panel admina", href: "/admin", icon: BarChart3 },
  ];

  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] === "admin" && segs[1]) {
    const meta = SECTION_META[segs[1]];
    if (meta) {
      crumbs.push({
        label: meta.label,
        href: `/admin/${segs[1]}`,
        icon: meta.icon,
      });
    } else {
      crumbs.push({ label: decodeURIComponent(segs[1]) });
    }
  }
  return crumbs;
}

export function AdminTopBar({ role }: AdminTopBarProps) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const isMobile = useMobileViewport();
  const setMobileOpen = useAdminSidebarStore((s) => s.setMobileOpen);

  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);
  const current = crumbs[crumbs.length - 1];
  const showBack = pathname !== "/admin" && pathname.startsWith("/admin/");

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-sidebar px-4 sm:gap-4 sm:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors duration-200",
              "hover:bg-white/[0.04] hover:text-primary active:scale-[0.98]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label="Otwórz menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        ) : showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
            aria-label="Wstecz"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
        ) : null}

        {isMobile ? (
          <p
            className="min-w-0 flex-1 truncate font-body text-body-sm font-medium text-primary"
            aria-live="polite"
          >
            {current?.label ?? "Panel admina"}
          </p>
        ) : (
          <nav
            className="flex min-w-0 items-center gap-1.5 font-body text-body-sm"
            aria-label="Ścieżka nawigacji"
          >
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              const Icon = crumb.icon;
              const node = (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 truncate",
                    isLast ? "text-primary" : "text-secondary",
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        isLast ? "text-brand-gold" : "text-muted",
                      )}
                      aria-hidden
                    />
                  )}
                  <span className="truncate">{crumb.label}</span>
                </span>
              );

              return (
                <span
                  key={`${crumb.label}-${idx}`}
                  className="inline-flex min-w-0 items-center gap-1.5"
                >
                  {idx > 0 && (
                    <ChevronRight
                      className="size-3 shrink-0 text-muted"
                      aria-hidden
                    />
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="truncate transition-colors hover:text-primary"
                    >
                      {node}
                    </Link>
                  ) : (
                    node
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className={cn(
            "hidden items-center gap-1 rounded-pill px-2 py-0.5 font-body text-[11px] font-medium sm:inline-flex",
            role === "admin"
              ? "bg-brand-gold/15 text-brand-gold"
              : "bg-brand-sage/20 text-brand-sage",
          )}
          title={role === "admin" ? "Pełne uprawnienia" : "Moderacja treści"}
        >
          <ShieldCheck className="size-3" aria-hidden />
          {role === "admin" ? "Admin" : "Moderator"}
        </span>

        <Link
          href="/pulpit"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-btn border border-border bg-card px-3 font-body text-body-xs text-secondary transition-colors hover:bg-card-hover hover:text-primary",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
          )}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Aplikacja</span>
          <ExternalLink className="size-3 sm:hidden" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
