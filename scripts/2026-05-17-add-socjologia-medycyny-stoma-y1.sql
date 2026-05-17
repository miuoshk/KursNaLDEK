-- ============================================================
-- Dodanie przedmiotu "Socjologia medycyny" do 1 roku stomatologii
-- Track: stomatologia · Year: 1 · Product: knnp
-- ============================================================
-- 1. Wstawia/aktualizuje rekord w `subjects` (idempotentne)
-- 2. Wstawia 10 topików (SOC-*) z `question_count = 0` (pytania
--    będą dorzucane batchami później wg FormatPisaniaPytan-Socjologia.md)
-- 3. NIE wstawia pytań — to robi się osobnym batchem
--
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT DO UPDATE).
-- ============================================================

-- 1. Subject
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

-- 2. Topiki
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count)
VALUES
  ('SOC-WPR', 'stoma-socjologia',
   'Wprowadzenie do socjologii medycyny', 1, 0),
  ('SOC-ZDR', 'stoma-socjologia',
   'Zdrowie i choroba jako kategorie społeczne', 2, 0),
  ('SOC-ROL', 'stoma-socjologia',
   'Role społeczne lekarza i pacjenta', 3, 0),
  ('SOC-KOM', 'stoma-socjologia',
   'Komunikacja lekarz–pacjent', 4, 0),
  ('SOC-ZAW', 'stoma-socjologia',
   'Profesja lekarska i instytucje opieki zdrowotnej', 5, 0),
  ('SOC-DET', 'stoma-socjologia',
   'Społeczne determinanty zdrowia', 6, 0),
  ('SOC-NIE', 'stoma-socjologia',
   'Nierówności w zdrowiu i dostęp do opieki', 7, 0),
  ('SOC-ETK', 'stoma-socjologia',
   'Etyka, bioetyka i prawa pacjenta', 8, 0),
  ('SOC-PRZ', 'stoma-socjologia',
   'Choroba przewlekła, niepełnosprawność, stygmatyzacja', 9, 0),
  ('SOC-UMI', 'stoma-socjologia',
   'Umieranie, śmierć i opieka paliatywna', 10, 0),
  ('SOC-STM', 'stoma-socjologia',
   'Stomatologia społeczna (lęk, dostęp, komunikacja w gabinecie)', 11, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id     = EXCLUDED.subject_id,
  name           = EXCLUDED.name,
  display_order  = EXCLUDED.display_order;
  -- question_count celowo NIE jest tu aktualizowany — utrzymujemy
  -- realny licznik, który podbija się skryptem po każdym INSERT-cie pytań.
