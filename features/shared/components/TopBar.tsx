"use client";

import { Bell, ChevronLeft, ChevronRight, Flame, Menu, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatStreak } from "@/lib/formatStreak";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { mobilePageTitle } from "@/features/shared/lib/mobilePageTitle";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-btn text-secondary transition-colors duration-200 ease-out",
          "hover:bg-white/[0.06] hover:text-primary",
          "active:scale-[0.96] active:bg-white/[0.08]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
          open && "bg-white/[0.06] text-primary",
        )}
        aria-label="Powiadomienia"
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-card border border-border bg-card shadow-lg",
            "animate-fade-in",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="font-body text-body-sm font-medium text-primary">Powiadomienia</p>
          </div>
          <div className="flex flex-col items-center gap-2 px-4 py-8">
            <Bell className="size-6 text-muted" aria-hidden />
            <p className="font-body text-body-sm text-secondary">Brak nowych powiadomień</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMobileViewport();
  const mainRoutes = new Set(["/", "/pulpit", "/przedmioty", "/osce", "/statystyki", "/osiagniecia", "/ustawienia"]);
  const showBack = !mainRoutes.has(pathname);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { year, secondSegment, thirdSegment } = useDashboardBreadcrumb();
  const { streak, initials } = useDashboardUser();
  const pathFallback = mobilePageTitle(pathname);
  const mobileTitle =
    thirdSegment ?? secondSegment ?? pathFallback ?? `Rok ${year}`;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-sidebar px-4 sm:gap-4 sm:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 rounded-lg p-1.5 text-secondary transition-colors hover:text-primary"
            aria-label="Wstecz"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        ) : null}
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
        ) : null}
        <nav
          className={cn(
            "flex min-w-0 items-center gap-1 font-body text-body-sm text-secondary",
            isMobile && "sr-only",
          )}
          aria-label="Ścieżka nawigacji"
        >
          <span className="truncate">Rok {year}</span>
          {secondSegment ? (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{secondSegment}</span>
            </>
          ) : null}
          {thirdSegment ? (
            <>
              <ChevronRight className="size-3 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{thirdSegment}</span>
            </>
          ) : null}
        </nav>
        {isMobile ? (
          <p
            className="min-w-0 flex-1 truncate font-body text-body-sm font-medium text-primary md:hidden"
            aria-live="polite"
          >
            {mobileTitle}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-btn border border-border bg-card text-secondary transition-colors duration-200 ease-out hover:bg-card-hover sm:hidden",
            "active:scale-[0.98]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
          )}
          aria-label="Szukaj…"
        >
          <Search className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            "hidden h-9 w-[200px] items-center gap-2 rounded-btn border border-border bg-card px-3 text-left transition-colors duration-200 ease-out",
            "text-secondary hover:bg-card-hover sm:flex",
            "active:scale-[0.98]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
          )}
          aria-label="Szukaj…"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 font-body text-body-sm">Szukaj…</span>
          <kbd
            className={cn(
              "hidden rounded border border-border bg-sidebar px-1.5 py-0.5 font-body text-[11px] text-muted lg:inline",
            )}
          >
            Ctrl+K
          </kbd>
        </button>

        <NotificationBell />

        <div className="hidden items-center gap-1.5 sm:flex">
          <Flame className="size-5 shrink-0 text-brand-gold" aria-hidden />
          <span className="font-body text-sm text-brand-gold">
            {formatStreak(streak)}
          </span>
        </div>

        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-body text-xs font-semibold text-brand-gold"
          aria-hidden
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
