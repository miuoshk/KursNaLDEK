-- ============================================================
-- Dodanie przedmiotu "Socjologia medycyny" do 1 roku stomatologii
-- Track: stomatologia · Year: 1 · Product: knnp
-- ============================================================
-- Wstawia/aktualizuje TYLKO rekord w `subjects` (idempotentne).
--
-- Topików ŚWIADOMIE NIE WSTAWIAMY z góry — mają być definiowane
-- razem z pierwszym batchem pytań, na podstawie realnego materiału
-- źródłowego (program nauczania / pytania egzaminacyjne).
-- Wzór INSERT-u dla topiku i pytań znajduje się w
-- FormatPisaniaPytan-Socjologia.md.
--
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT DO UPDATE).
-- ============================================================

INSERT INTO public.subjects
  (id, name, short_name, icon_name, year, track, product, display_order)
VALUES
  ('stoma-socjologia',
   'Socjologia medycyny',
   'Socjologia',
   'users',
   1,
   'stomatologia',
   'knnp',
   7)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;
