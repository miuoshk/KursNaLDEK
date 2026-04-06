import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarStore = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
    }),
    {
      name: "kursnaldek-sidebar-v2",
      partialize: (s) => ({ collapsed: s.collapsed }),
    },
  ),
);
