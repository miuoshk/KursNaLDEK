-- ============================================================
-- LDEW — Stomatologia zachowawcza: 23 tematy (ZAC-01 … ZAC-23)
-- Przedmiot ldew-stomatologia-zachowawcza musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('ZAC-01', 'ldew-stomatologia-zachowawcza', 'Postępowanie lekarsko-stomatologiczne', 1, 0),
  ('ZAC-02', 'ldew-stomatologia-zachowawcza', 'Zasady ergonomii pracy w stomatologii zachowawczej', 2, 0),
  ('ZAC-03', 'ldew-stomatologia-zachowawcza', 'Komputer i internet – nowe elementy ergonomii stomatologicznej', 3, 0),
  ('ZAC-04', 'ldew-stomatologia-zachowawcza', 'Materiały stosowane w leczeniu zachowawczym zębów', 4, 0),
  ('ZAC-05', 'ldew-stomatologia-zachowawcza', 'Nieprawidłowości rozwojowe zębów', 5, 0),
  ('ZAC-06', 'ldew-stomatologia-zachowawcza', 'Choroby twardych tkanek zębów', 6, 0),
  ('ZAC-07', 'ldew-stomatologia-zachowawcza', 'Nadwrażliwość zębiny', 7, 0),
  ('ZAC-08', 'ldew-stomatologia-zachowawcza', 'Epidemiologia próchnicy zębów', 8, 0),
  ('ZAC-09', 'ldew-stomatologia-zachowawcza', 'Zapobieganie próchnicy zębów', 9, 0),
  ('ZAC-10', 'ldew-stomatologia-zachowawcza', 'Etiologia próchnicy', 10, 0),
  ('ZAC-11', 'ldew-stomatologia-zachowawcza', 'Patologia próchnicy', 11, 0),
  ('ZAC-12', 'ldew-stomatologia-zachowawcza', 'Przebieg kliniczny i podział próchnicy zębów', 12, 0),
  ('ZAC-13', 'ldew-stomatologia-zachowawcza', 'Diagnostyka próchnicy', 13, 0),
  ('ZAC-14', 'ldew-stomatologia-zachowawcza', 'Leczenie próchnicy', 14, 0),
  ('ZAC-15', 'ldew-stomatologia-zachowawcza', 'Choroby miazgi zęba', 15, 0),
  ('ZAC-16', 'ldew-stomatologia-zachowawcza', 'Choroby tkanek okołowierzchołkowych zęba', 16, 0),
  ('ZAC-17', 'ldew-stomatologia-zachowawcza', 'Leczenie endodontyczne', 17, 0),
  ('ZAC-18', 'ldew-stomatologia-zachowawcza', 'Izolacja pola operacyjnego', 18, 0),
  ('ZAC-19', 'ldew-stomatologia-zachowawcza', 'Trudności i powikłania w leczeniu endodontycznym', 19, 0),
  ('ZAC-20', 'ldew-stomatologia-zachowawcza', 'Resorpcja zębów', 20, 0),
  ('ZAC-21', 'ldew-stomatologia-zachowawcza', 'Gerostomatologia', 21, 0),
  ('ZAC-22', 'ldew-stomatologia-zachowawcza', 'Zakażenie ogniskowe', 22, 0),
  ('ZAC-23', 'ldew-stomatologia-zachowawcza', 'Wybielanie przebarwionych zębów', 23, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
