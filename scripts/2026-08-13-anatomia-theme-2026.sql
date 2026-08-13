-- Kafelek rocznikowy Anatomia „2026” (wirtualny, jak Biofizyka „2025”).
-- Pytania zostają w działach tematycznych; widok filtruje po theme_label.
-- Cień w topics ma question_count=0, żeby nie dublować licznika przedmiotu.

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'anatomia-THEME-2026',
  'anatomia',
  '2026',
  12,
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

UPDATE public.questions
   SET theme_label = '2026'
 WHERE batch_label = 'e_anat_2026/1'
   AND COALESCE(is_active, true) = true;
