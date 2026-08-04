-- ============================================================
-- LDEW — Ortodoncja: 8 tematów (ORT-01 … ORT-08)
-- Przedmiot ldew-ortodoncja musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

-- Stara mapa 9-tematu (w tym „Rys historyczny”): czyść tylko gdy brak pytań.
DELETE FROM public.topics t
 WHERE t.subject_id = 'ldew-ortodoncja'
   AND t.id LIKE 'ORT-%'
   AND NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.topic_id = t.id);

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('ORT-01', 'ldew-ortodoncja', 'Rozwój i wzrost twarzy', 1, 0),
  ('ORT-02', 'ldew-ortodoncja', 'Etiologia wad zgryzu', 2, 0),
  ('ORT-03', 'ldew-ortodoncja', 'Badanie kliniczne pacjenta i badania pomocnicze', 3, 0),
  ('ORT-04', 'ldew-ortodoncja', 'Klasyfikacja stosunków zębowo-zgryzowo-szkieletowych', 4, 0),
  ('ORT-05', 'ldew-ortodoncja', 'Diagnostyka wad zgryzu', 5, 0),
  ('ORT-06', 'ldew-ortodoncja', 'Aparaty profilaktyczne i lecznicze', 6, 0),
  ('ORT-07', 'ldew-ortodoncja', 'Profilaktyka i oświata zdrowotna', 7, 0),
  ('ORT-08', 'ldew-ortodoncja', 'Różne metody leczenia', 8, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
