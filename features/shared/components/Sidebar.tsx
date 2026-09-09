"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SidebarPanel } from "@/features/shared/components/SidebarPanel";
import { useMobileViewport } from "@/features/shared/hooks/useMobileViewport";
import { useNarrowViewport } from "@/features/shared/hooks/useNarrowViewport";
import { isSessionStudyPath } from "@/features/shared/lib/isSessionStudyPath";
import { useSidebarStore } from "@/features/shared/stores/sidebarStore";
import { cn } from "@/lib/utils";

function restoreNavMenuTrigger() {
  document.querySelector<HTMLElement>("[data-nav-menu-trigger]")?.focus();
}

export function Sidebar() {
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const isMobile = useMobileViewport();
  const narrow = useNarrowViewport();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const isActiveSession = isSessionStudyPath(pathname);
  const overlayNav = isMobile || (isActiveSession && narrow);

  const closeMobile = () => {
    setMobileOpen(false);
    restoreNavMenuTrigger();
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!overlayNav || !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlayNav, mobileOpen]);

  // Overlay: panel jest stale zamontowany - animujemy translate-x zamiast
  // unmountowac/mountowac komponent. Daje to plynne slide-in/out i unika
  // ponownego budowania ciezkiego subtree (avatar, slogan, ikony).
  if (overlayNav) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={tCommon("navigationMenu")}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/50 motion-reduce:transition-none transition-opacity duration-200 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label={tCommon("closeMenu")}
          tabIndex={mobileOpen ? 0 : -1}
          onClick={closeMobile}
        />
        <div
          className={cn(
            "relative z-10 h-full max-w-[85vw] shadow-2xl will-change-transform motion-reduce:transition-none transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarPanel collapsed={false} onCloseMobile={closeMobile} />
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
