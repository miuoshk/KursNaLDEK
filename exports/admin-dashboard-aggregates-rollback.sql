-- Rollback dla optymalizacji dashboardu /admin (agregacja po stronie bazy)
-- Data: 2026-06-19
--
-- Kontekst: dashboard liczyl metryki przez pull wszystkich wierszy study_sessions
-- (~73 round-tripy) + agregacje w JS. Zastapione przez funkcje RPC
-- admin_dashboard_session_aggregates() + indeksy.
--
-- WAZNE: kod (loadery TS) rolluje sie niezaleznie przez git:
--   git checkout HEAD -- \
--     features/admin/server/loadAdminShared.ts \
--     features/admin/server/loadAdminDashboardKpis.ts \
--     features/admin/server/loadAdminDashboardSegments.ts \
--     features/admin/server/loadAdminDashboard.ts
-- (getStudySessionsLast30d zostaje w loadAdminShared.ts, wiec rewert dziala od razu.)
--
-- Ponizsze SQL usuwa artefakty bazodanowe. DROP FUNCTION i DROP INDEX CONCURRENTLY
-- NIE moga byc w jednej transakcji - uruchamiac KAZDY STATEMENT OSOBNO.

-- 1) Funkcja RPC (bezpieczna do usuniecia - po rewercie loaderow nikt jej nie wola)
drop function if exists public.admin_dashboard_session_aggregates();

-- 2) Indeksy - ZALECANE ZOSTAWIC (korzystne niezaleznie od reszty zmian).
--    Usuwac tylko przy swiadomym, pelnym rewercie. Kazdy osobno:
drop index concurrently if exists public.idx_session_answers_answered_at;
drop index concurrently if exists public.idx_study_sessions_started_at;
drop index concurrently if exists public.idx_study_sessions_completed_at;
