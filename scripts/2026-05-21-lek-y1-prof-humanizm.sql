-- ============================================================
-- Lekarski rok 1: Profesjonalizm i humanizm w medycynie
-- Jeden temat: Zaliczenie końcowe (PHUM-ZAL)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.subjects
  (id, name, short_name, icon_name, year, track, product, display_order)
VALUES
  ('lek-prof-humanizm',
   'Profesjonalizm i humanizm w medycynie',
   'Prof. human.',
   'users',
   1,
   'lekarski',
   'knnp',
   5)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PHUM-ZAL', 'lek-prof-humanizm', 'Zaliczenie końcowe', 1, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
