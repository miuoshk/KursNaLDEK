-- Kafelek rocznikowy Farmakologia „2026” (wirtualny).
-- Pytania zostają w FARM-*; widok filtruje po theme_label + questions.tracks.
-- Cień w topics ma question_count=0, żeby nie dublować licznika przedmiotu.

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'farmakologia-THEME-2026',
  'farmakologia',
  '2026',
  20,
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

UPDATE public.questions
   SET theme_label = '2026'
 WHERE batch_label IN ('e_farm_stoma_2026/1', 'e_farm_lek_2026/1')
   AND COALESCE(is_active, true) = true;
