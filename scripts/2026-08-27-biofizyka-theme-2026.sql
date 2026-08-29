-- Kafelek rocznikowy Biofizyka „2026” (wirtualny, jak 2025 / farmakologia 2026).
-- Pytania zostają w BIOF-*; widok filtruje po theme_label + questions.tracks.
-- Cień w topics ma question_count=0, żeby nie dublować licznika przedmiotu.
-- Widoczny tylko na lekarskim (pytania e_biof_lek_2026/1 mają tracks=['lekarski']).

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'biofizyka-THEME-2026',
  'biofizyka',
  '2026',
  13,
  0,
  ARRAY['lekarski']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;
