"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarPanel } from "@/features/shared/components/SidebarPanel";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useMobileViewport();
  const narrow = useNarrowViewport();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const forceSessionCollapsed =
    pathname.startsWith("/sesja/") && !pathname.includes("/podsumowanie");

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
        aria-label="Menu nawigacji"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/50 transition-opacity"
          aria-label="Zamknij menu"
          onClick={() => setMobileOpen(false)}
        />
        <div className="relative z-10 h-full max-w-[85vw] shadow-2xl">
          <SidebarPanel
            collapsed={false}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>
      </div>
    );
  }

  const collapsed =
    narrow || (forceSessionCollapsed ? true : collapsedFromStore);

  return (
    <div className="flex shrink-0">
      <SidebarPanel collapsed={collapsed} onToggleCollapse={toggle} />
    </div>
  );
}
