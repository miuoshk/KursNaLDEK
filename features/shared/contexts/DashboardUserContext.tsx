"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type DashboardUserValue = {
  streak: number;
  displayName: string;
  initials: string;
  /** Emoji wybrane przez użytkownika; null = pokazujemy `initials`. */
  avatarEmoji: string | null;
  /** "stomatologia" | "lekarski" — kierunek z profilu, używany w sidebarze. */
  currentTrack: "stomatologia" | "lekarski";
  /** Liczba pytań z terminem powtórki (next_review <= teraz). */
  dueReviewsCount: number;
  /** Ostatnia liczba pytań z konfiguracji sesji (10, 25, custom…). */
  preferredSessionCount: number;
  /** Zegar czasu sesji w pasku nauki (domyślnie włączony). */
  showSessionTimer: boolean;
  /** Lista tematów źródłowych w pasku sesji (domyślnie włączona). */
  showSessionTopics: boolean;
  /** Sesja bez JWT Supabase — dane w bazie mogą być niedostępne (RLS). */
  testMode?: boolean;
};

const DashboardUserContext = createContext<DashboardUserValue | null>(null);

export function DashboardUserProvider({
  value,
  children,
}: {
  value: DashboardUserValue;
  children: ReactNode;
}) {
  return (
    <DashboardUserContext.Provider value={value}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error("useDashboardUser wymaga DashboardUserProvider");
  }
  return ctx;
}
