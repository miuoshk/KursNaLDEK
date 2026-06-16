-- ============================================================
-- Lekarski rok 1: Profesjonalizm i humanizm — tematy „(generowane)”
-- Osobne kafelki; sesja całego przedmiotu pomija -GEN (questionSelection.ts)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PHUM-PSY-GEN', 'lek-prof-humanizm', 'Psychologia i komunikacja (generowane)',              2, 0),
  ('PHUM-SOC-GEN', 'lek-prof-humanizm', 'Socjologia (generowane)',                           3, 0),
  ('PHUM-PRO-GEN', 'lek-prof-humanizm', 'Profesjonalizm, stres i wypalenie (generowane)',  4, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- PHUM-ZAL (Zaliczenie końcowe) zostaje na display_order = 1
UPDATE public.topics
   SET display_order = 1
 WHERE id = 'PHUM-ZAL'
   AND subject_id = 'lek-prof-humanizm';

-- Weryfikacja:
-- SELECT id, name, question_count, display_order
--   FROM public.topics
--  WHERE subject_id = 'lek-prof-humanizm'
--  ORDER BY display_order;
