-- Symulacja OSCE: wyniki prób i per stacja
-- Uruchom w Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS osce_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_day INT NOT NULL CHECK (exam_day IN (1, 2)),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed_overall BOOLEAN NOT NULL,
  overall_percent REAL NOT NULL,
  station_count INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_osce_simulations_user_completed
  ON osce_simulations (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS osce_station_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES osce_simulations(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL REFERENCES subjects(id),
  station_order INT NOT NULL,
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  percent REAL NOT NULL,
  passed BOOLEAN NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  UNIQUE (simulation_id, station_id)
);

CREATE INDEX IF NOT EXISTS idx_osce_station_results_simulation
  ON osce_station_results (simulation_id);

ALTER TABLE osce_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE osce_station_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own osce_simulations SELECT"
  ON osce_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own osce_simulations INSERT"
  ON osce_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own osce_station_results SELECT"
  ON osce_station_results FOR SELECT USING (
    simulation_id IN (SELECT id FROM osce_simulations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users own osce_station_results INSERT"
  ON osce_station_results FOR INSERT WITH CHECK (
    simulation_id IN (SELECT id FROM osce_simulations WHERE user_id = auth.uid())
  );
