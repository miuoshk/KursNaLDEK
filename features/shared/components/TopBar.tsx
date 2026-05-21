"use client";

import { Bell, ChevronLeft, ChevronRight, Flame, Menu, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatStreak } from "@/lib/formatStreak";
import { CommandPalette } from "@/features/shared/components/CommandPalette";
import { fetchReportNotifications } from "@/features/notifications/api/fetchReportNotifications";
import { markReportNotificationsRead } from "@/features/notifications/api/markReportNotificationsRead";
import {
  reportVerdictDescription,
  reportVerdictLabel,
} from "@/features/notifications/lib/reportVerdictLabel";
import type { ReportNotification } from "@/features/notifications/types";
import { useDashboardBreadcrumb } from "@/features/shared/contexts/DashboardBreadcrumbContext";
import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { mobilePageTitle } from "@/features/shared/lib/mobilePageTitle";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";

function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationBell() {
  const { testMode } = useDashboardUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ReportNotification[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(async () => {
    if (testMode) {
      setNotifications([]);
      setUnreadIds([]);
      return;
    }
    setLoading(true);
    try {
      const [all, unread] = await Promise.all([
        fetchReportNotifications(false),
        fetchReportNotifications(true),
      ]);
      setNotifications(all);
      setUnreadIds(unread.map((item) => item.id));
    } finally {
      setLoading(false);
    }
  }, [testMode]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      if (next) void refreshNotifications();
      return next;
    });
  }, [refreshNotifications]);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const result = await markReportNotificationsRead({ reportIds: ids });
    if (result.ok) {
      setUnreadIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadCount = unreadIds.length;

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
        aria-label={
          unreadCount > 0
            ? `Powiadomienia, ${unreadCount} nieprzeczytanych`
            : "Powiadomienia"
        }
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-gold" aria-hidden />
        ) : null}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-card border border-border bg-card shadow-lg",
            "animate-fade-in",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-body text-body-sm font-medium text-primary">Powiadomienia</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markRead(unreadIds)}
                className="font-body text-body-xs text-brand-gold transition-colors hover:text-primary"
              >
                Oznacz wszystkie
              </button>
            ) : null}
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center font-body text-body-sm text-secondary">
              Wczytuję…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8">
              <Bell className="size-6 text-muted" aria-hidden />
              <p className="font-body text-body-sm text-secondary">Brak powiadomień</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((item) => {
                const isUnread = unreadIds.includes(item.id);
                return (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnread) void markRead([item.id]);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                        isUnread && "bg-brand-gold/[0.06]",
                      )}
                    >
                      <p className="font-body text-body-sm font-medium text-primary">
                        {reportVerdictLabel(item.status)}
                      </p>
                      <p className="mt-0.5 font-body text-body-xs text-secondary">
                        {reportVerdictDescription(item.status, item.category)}
                      </p>
                      {item.adminResponse ? (
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap font-body text-body-xs text-primary/90">
                          {item.adminResponse}
                        </p>
                      ) : null}
                      <p className="mt-2 font-body text-[11px] text-muted">
                        {formatNotificationDate(item.resolvedAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
  const { streak, initials, avatarEmoji } = useDashboardUser();
  const pathFallback = mobilePageTitle(pathname);
  const mobileTitle =
    thirdSegment ?? secondSegment ?? pathFallback ?? `Rok ${year}`;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // Globalny skrot Cmd/Ctrl+K - dziala na kazdej stronie dashboardu.
  // Ignorujemy wewnatrz input/textarea/contentEditable, zeby nie kolidowac
  // z formularzami i edytorami.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        const editable = t?.isContentEditable;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          editable
        ) {
          return;
        }
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          onClick={openPalette}
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
          onClick={openPalette}
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

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

        <NotificationBell />

        <div className="hidden items-center gap-1.5 sm:flex">
          <Flame className="size-5 shrink-0 text-brand-gold" aria-hidden />
          <span className="font-body text-sm text-brand-gold">
            {formatStreak(streak)}
          </span>
        </div>

        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-accent-2",
            avatarEmoji
              ? "text-lg"
              : "font-body text-xs font-semibold text-brand-gold",
          )}
          aria-hidden
        >
          {avatarEmoji ?? initials}
        </div>
      </div>
    </header>
  );
}
