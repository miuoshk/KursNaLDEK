-- ============================================================
-- Stomatologia rok 2: Mikrobiologia jamy ustnej — tematy
-- - Nowy temat: Zaliczenie całościowe (MJU-ZAL)
-- - Kolokwium Zbiorcze I (MJU-KZ1) między ćwiczeniem 2 a 3
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('MJU-C01', 'stoma-mikrobio-ju', 'Ćwiczenie 1 — Ekosystem JU, ślina, mechanizmy obronne', 1, 0),
  ('MJU-C02', 'stoma-mikrobio-ju', 'Ćwiczenie 2 — Dezynfekcja i sterylizacja w stomatologii', 2, 0),
  ('MJU-KZ1', 'stoma-mikrobio-ju', 'Kolokwium Zbiorcze I — Zaliczenia ćwiczeń 1 i 2', 3, 0),
  ('MJU-C03', 'stoma-mikrobio-ju', 'Ćwiczenie 3 — Czynniki wzrostu, taksonomia, ziarniaki i pałeczki G(+)', 4, 0),
  ('MJU-C04', 'stoma-mikrobio-ju', 'Ćwiczenie 4 — Flora JU, kolonizacja, patogeny', 5, 0),
  ('MJU-C05', 'stoma-mikrobio-ju', 'Ćwiczenie 5 — Adhezja, metabolizm, płytka nazębna', 6, 0),
  ('MJU-C06', 'stoma-mikrobio-ju', 'Ćwiczenie 6 — Próchnica, choroby przyzębia, zakażenia krzyżowe', 7, 0),
  ('MJU-KZ2', 'stoma-mikrobio-ju', 'Kolokwium Zbiorcze II — Zaliczenia ćwiczeń 3, 4 i 5', 8, 0),
  ('MJU-ZAL', 'stoma-mikrobio-ju', 'Zaliczenie całościowe', 9, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- Przelicz question_count (pytania mogły już istnieć przed zmianą kolejności)
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id LIKE 'MJU-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
