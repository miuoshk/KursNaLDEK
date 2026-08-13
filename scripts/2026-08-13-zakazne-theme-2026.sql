-- Kafelek rocznikowy Choroby zakaźne STOMA „2026” (wirtualny).
-- Pytania zostają w działach ZAKAZ-*; widok filtruje po theme_label.
-- Cień w topics ma question_count=0, żeby nie dublować licznika przedmiotu.

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'stoma-zakazne-THEME-2026',
  'stoma-zakazne',
  '2026',
  24,
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

UPDATE public.questions
   SET theme_label = '2026'
 WHERE batch_label = 'z2026-1'
   AND topic_id LIKE 'ZAKAZ-%'
   AND COALESCE(is_active, true) = true;
