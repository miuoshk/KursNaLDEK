-- generowany z subjects, bez wpisywania listy z reki
INSERT INTO public.topics (id, subject_id, display_order, name, question_count, is_inbox)
SELECT 'INBOX--' || s.id, s.id, -1, 'Do przypisania (CEM)', 0, true
FROM public.subjects s
WHERE s.product = 'ldew'
ON CONFLICT (id) DO UPDATE
  SET is_inbox = true, display_order = -1, name = EXCLUDED.name;
