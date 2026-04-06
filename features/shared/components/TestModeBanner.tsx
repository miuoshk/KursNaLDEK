"use client";

import { useDashboardUser } from "@/features/shared/contexts/DashboardUserContext";

export function TestModeBanner() {
  const { testMode } = useDashboardUser();
  if (!testMode) return null;
  return (
    <div
      className="border-b border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-center font-body text-body-xs text-secondary"
      role="status"
    >
      Tryb testowy: brak sesji Supabase — część danych z bazy może być niedostępna. Zaloguj się zwykłym kontem,
      aby korzystać z aplikacji w pełni.
    </div>
  );
}
