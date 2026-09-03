-- Dzienny tracker urządzeń zalogowanych użytkowników (Mac / iPhone / iPad / …).
-- 1 wiersz = 1 użytkownik × 1 dzień (Europe/Warsaw) × 1 klasa urządzenia.
-- Idempotentne. Agregaty admina tylko przez service_role (dashboard /admin).

CREATE TABLE IF NOT EXISTS public.device_visits (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visited_on date NOT NULL,
  device_class text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, visited_on, device_class),
  CONSTRAINT device_visits_class_chk
    CHECK (device_class IN ('mac', 'iphone', 'ipad', 'android', 'android_tablet', 'windows', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_device_visits_visited_on
  ON public.device_visits (visited_on DESC);

COMMENT ON TABLE public.device_visits IS
  'Dzienna obecność zalogowanego użytkownika na klasie urządzenia. Źródło wykresu Urządzenia w /admin.';

ALTER TABLE public.device_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own device visits" ON public.device_visits;
DROP POLICY IF EXISTS "Users read own device visits" ON public.device_visits;
DROP POLICY IF EXISTS "Users update own device visits" ON public.device_visits;
DROP POLICY IF EXISTS "Admin or moderator read device visits" ON public.device_visits;

CREATE POLICY "Users insert own device visits"
  ON public.device_visits FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- SELECT własnych wierszy jest wymagany, żeby UPSERT (ON CONFLICT UPDATE) działał pod RLS.
CREATE POLICY "Users read own device visits"
  ON public.device_visits FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own device visits"
  ON public.device_visits FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admin or moderator read device visits"
  ON public.device_visits FOR SELECT
  USING (private.is_admin_or_moderator((SELECT auth.uid())));

GRANT SELECT, INSERT, UPDATE ON TABLE public.device_visits TO authenticated;
REVOKE ALL ON TABLE public.device_visits FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.device_visits FROM authenticated;
GRANT ALL ON TABLE public.device_visits TO service_role;

-- Agregaty dla panelu admina. SECURITY DEFINER + GRANT tylko service_role:
-- funkcja nie jest wołana z klienta (anon/authenticated nie mają EXECUTE).
CREATE OR REPLACE FUNCTION public.admin_device_visit_stats(p_since date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'daily', COALESCE((
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.visited_on, d.device_class)
      FROM (
        SELECT
          visited_on,
          device_class,
          COUNT(*)::int AS unique_users
        FROM public.device_visits
        WHERE visited_on >= p_since
        GROUP BY visited_on, device_class
      ) d
    ), '[]'::jsonb),
    'totals', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.device_class)
      FROM (
        SELECT
          device_class,
          COUNT(DISTINCT user_id)::int AS unique_users,
          COUNT(*)::int AS visit_days
        FROM public.device_visits
        WHERE visited_on >= p_since
        GROUP BY device_class
      ) t
    ), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_device_visit_stats(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_device_visit_stats(date) TO service_role;
