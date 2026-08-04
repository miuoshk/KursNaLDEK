-- LDEW Ortodoncja — tematy ORT-09 … ORT-12 (rozdziały PDF 10–13)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('ORT-09', 'ldew-ortodoncja', 'Powikłania leczenia ortodontycznego', 9, 0),
  ('ORT-10', 'ldew-ortodoncja', 'Współpraca interdyscyplinarna', 10, 0),
  ('ORT-11', 'ldew-ortodoncja', 'Rozszczepy szczęki', 11, 0),
  ('ORT-12', 'ldew-ortodoncja', 'Wady uwarunkowane genetycznie', 12, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
