-- Anatomia (shared: stomatologia + lekarski): temat zaliczenia końcowego.
-- subject_id: anatomia (kanon) · powłoki UI: stoma-anatomia, lek-anatomia
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('ANA-ZAL', 'anatomia', 'Zaliczenie końcowe', 11, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
