-- Kalkulator TD-ABC (/kalkulator) — schemat gabinetów, procedur, materiałów i logów
-- Bezpieczne do powtórnego uruchomienia (IF NOT EXISTS / DROP ... IF EXISTS)

-- ============================================================
-- TABELA: practices (gabinet — jeden właściciel może mieć 1+)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  voivodeship text,
  monthly_station_cost numeric(10,2),
  station_hours_per_month numeric(6,1) DEFAULT 160,
  station_cost_per_hour numeric(10,2),
  doctor_rate_per_hour numeric(10,2),
  assistant_rate_per_hour numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practices_owner_id ON public.practices(owner_id);

-- ============================================================
-- TABELA: material_catalog (słownik materiałów per gabinet)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.material_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit_label text NOT NULL,
  unit_cost numeric(10,2) NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_catalog_practice_id ON public.material_catalog(practice_id);

-- ============================================================
-- TABELA: procedures (definicja procedury referencyjnej)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  duration_minutes integer NOT NULL,
  assistant_share numeric(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procedures_practice_id ON public.procedures(practice_id);

-- ============================================================
-- TABELA: procedure_materials (template zużycia materiału)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.procedure_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.material_catalog(id) ON DELETE RESTRICT,
  default_quantity numeric(8,2) NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_procedure_materials_procedure_id ON public.procedure_materials(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_materials_material_id ON public.procedure_materials(material_id);

-- ============================================================
-- TABELA: procedure_logs (faktyczne wykonanie)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.procedure_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE RESTRICT,
  performed_at date NOT NULL DEFAULT current_date,
  snap_price numeric(10,2) NOT NULL,
  snap_station_cost numeric(10,2) NOT NULL,
  snap_labor_cost numeric(10,2) NOT NULL,
  snap_material_cost numeric(10,2) NOT NULL,
  snap_total_cost numeric(10,2) NOT NULL,
  snap_margin_pln numeric(10,2) NOT NULL,
  snap_margin_pct numeric(6,2) NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procedure_logs_practice_id ON public.procedure_logs(practice_id);
CREATE INDEX IF NOT EXISTS idx_procedure_logs_procedure_id ON public.procedure_logs(procedure_id);

-- ============================================================
-- TABELA: log_material_usage (materiały w danym logu)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.log_material_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES public.procedure_logs(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  quantity numeric(8,2) NOT NULL,
  unit_cost numeric(10,2) NOT NULL,
  line_cost numeric(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_log_material_usage_log_id ON public.log_material_usage(log_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_material_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_practice(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.practices
    WHERE id = p_id
      AND owner_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.owns_practice(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_practice(uuid) TO postgres, service_role, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_practice(uuid) FROM anon;

DROP POLICY IF EXISTS "owner_all_practices" ON public.practices;
CREATE POLICY "owner_all_practices" ON public.practices
  FOR ALL
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "owner_materials" ON public.material_catalog;
CREATE POLICY "owner_materials" ON public.material_catalog
  FOR ALL
  USING (public.owns_practice(practice_id))
  WITH CHECK (public.owns_practice(practice_id));

DROP POLICY IF EXISTS "owner_procedures" ON public.procedures;
CREATE POLICY "owner_procedures" ON public.procedures
  FOR ALL
  USING (public.owns_practice(practice_id))
  WITH CHECK (public.owns_practice(practice_id));

DROP POLICY IF EXISTS "owner_proc_materials" ON public.procedure_materials;
CREATE POLICY "owner_proc_materials" ON public.procedure_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.procedures p
      WHERE p.id = procedure_id
        AND public.owns_practice(p.practice_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.procedures p
      WHERE p.id = procedure_id
        AND public.owns_practice(p.practice_id)
    )
  );

DROP POLICY IF EXISTS "owner_logs" ON public.procedure_logs;
CREATE POLICY "owner_logs" ON public.procedure_logs
  FOR ALL
  USING (public.owns_practice(practice_id))
  WITH CHECK (public.owns_practice(practice_id));

DROP POLICY IF EXISTS "owner_log_usage" ON public.log_material_usage;
CREATE POLICY "owner_log_usage" ON public.log_material_usage
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.procedure_logs l
      WHERE l.id = log_id
        AND public.owns_practice(l.practice_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.procedure_logs l
      WHERE l.id = log_id
        AND public.owns_practice(l.practice_id)
    )
  );

-- ============================================================
-- Trigger: station_cost_per_hour + updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.calc_station_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.monthly_station_cost IS NOT NULL AND NEW.station_hours_per_month > 0 THEN
    NEW.station_cost_per_hour := round(NEW.monthly_station_cost / NEW.station_hours_per_month, 2);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_station ON public.practices;
CREATE TRIGGER trg_calc_station
  BEFORE INSERT OR UPDATE ON public.practices
  FOR EACH ROW
  EXECUTE FUNCTION public.calc_station_cost();
