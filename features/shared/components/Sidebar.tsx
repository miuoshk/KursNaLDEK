"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarPanel } from "@/features/shared/components/SidebarPanel";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useMobileViewport();
  const narrow = useNarrowViewport();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const isActiveSession = /^\/sesja\/[^/]+$/.test(pathname ?? "");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Mobile: panel jest stale zamontowany - animujemy translate-x zamiast
  // unmountowac/mountowac komponent. Daje to plynne slide-in/out i unika
  // ponownego budowania ciezkiego subtree (avatar, slogan, ikony).
  if (isMobile) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu nawigacji"
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Zamknij menu"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "relative z-10 h-full max-w-[85vw] shadow-2xl will-change-transform transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarPanel
            collapsed={false}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>
      </div>
    );
  }

  const collapsed = narrow || (isActiveSession ? true : collapsedFromStore);

  return (
    <div className="flex shrink-0">
      <SidebarPanel collapsed={collapsed} onToggleCollapse={toggle} />
    </div>
  );
}
