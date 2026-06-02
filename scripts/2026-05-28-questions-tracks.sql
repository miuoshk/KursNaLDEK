-- questions.tracks — widoczność per kierunek (lustro topics.tracks).
-- Uruchom w Supabase SQL Editor (Miłosz). Nie commituj automatycznie z aplikacji.

-- ============================================================
-- 1. Kolumna + indeks
-- ============================================================
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS tracks TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_tracks
  ON public.questions USING GIN (tracks);

COMMENT ON COLUMN public.questions.tracks IS
  'NULL = pytanie wspólne (oba kierunki). ARRAY[...] = tylko wymienione kierunki. Lustro topics.tracks na poziomie pytania.';

-- ============================================================
-- 2. RLS — SELECT per kierunek (authenticated)
-- ============================================================
-- Stan w repo (supabase-schema.sql + scripts/2026-05-17-rls-perf-and-cleanup.sql):
--   questions: RLS już WŁĄCZONE
--   SELECT: "Authenticated can read questions" USING (true)  → widzi WSZYSTKO
--   Admin: INSERT/UPDATE/DELETE przez is_admin_or_moderator (bez osobnego SELECT)
-- Aplikacja sesji KNNP: createClient() + NEXT_PUBLIC_SUPABASE_ANON_KEY → authenticated, RLS DZIAŁA.
-- Admin panel (loadAdminQuestions): też createClient() — RLS też dotyczy; potrzebna polityka admin SELECT.
-- service_role (lib/supabase/admin.ts): omija RLS — importy / część admin API.

-- UWAGA: polityki SELECT są permissive (OR). Nowa reguła NIE zadziała, dopóki stoi USING (true).
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read questions" ON public.questions;

DROP POLICY IF EXISTS questions_track_visibility ON public.questions;
CREATE POLICY questions_track_visibility
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    tracks IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.current_track, 'stomatologia') = ANY (public.questions.tracks)
    )
  );

-- Admin / moderator: pełny odczyt (panel pytań używa createClient, nie service_role).
DROP POLICY IF EXISTS questions_admin_select_all ON public.questions;
CREATE POLICY questions_admin_select_all
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_moderator((SELECT auth.uid())));

-- Po migracji zweryfikuj:
--   SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'questions';
