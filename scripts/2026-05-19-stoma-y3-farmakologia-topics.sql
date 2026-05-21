-- ============================================================
-- Stomatologia rok 3: tylko Farmakologia + tematy FARM-01…17
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

-- Usuń sesje powiązane z przedmiotami wycofanymi z roku 3 (jeśli były)
DELETE FROM public.study_sessions
 WHERE subject_id IN ('stoma-pediatria', 'stoma-chirurgia');

UPDATE public.daily_challenges
   SET subject_id = NULL
 WHERE subject_id IN ('stoma-pediatria', 'stoma-chirurgia');

-- Usuń przedmioty (kaskada: topics → questions)
DELETE FROM public.subjects
 WHERE id IN ('stoma-pediatria', 'stoma-chirurgia');

-- Upewnij się, że farmakologia jest jedynym przedmiotem roku 3
INSERT INTO public.subjects
  (id, name, short_name, icon_name, year, track, product, display_order)
VALUES
  ('stoma-farmakologia', 'Farmakologia', 'Farmakologia', 'pill', 3, 'stomatologia', 'knnp', 13)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

-- Tematy programowe farmakologii (stomatologia, rok 3)
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('FARM-01', 'stoma-farmakologia', 'Farmakodynamika, farmakokinetyka i interakcje leków', 1, 0),
  ('FARM-02', 'stoma-farmakologia', 'Autakoidy (aminowe, peptydowe, purynowe, gazowe, lipidowe)', 2, 0),
  ('FARM-03', 'stoma-farmakologia', 'NLPZ, leczenie RZS i dny moczanowej. Opioidowe leki przeciwbólowe', 3, 0),
  ('FARM-04', 'stoma-farmakologia', 'Leki autonomicznego układu nerwowego', 4, 0),
  ('FARM-05', 'stoma-farmakologia', 'Płytki krwi, leki przeciwkrzepliwe, leczenie niedokrwistości', 5, 0),
  ('FARM-06', 'stoma-farmakologia', 'Leki moczopędne. Układ krążenia cz. I – nadciśnienie tętnicze i płucne', 6, 0),
  ('FARM-07', 'stoma-farmakologia', 'Układ krążenia cz. II – HF, dławica, OZW, antyarytmiczne, hipolipemizujące', 7, 0),
  ('FARM-08', 'stoma-farmakologia', 'Leki psychotropowe – przeciwdepresyjne, anksjolityczne, neuroleptyczne', 8, 0),
  ('FARM-09', 'stoma-farmakologia', 'OUN i obwodowy UN – znieczulenie miejscowe i ogólne, miorelaksacja, leki nasenne', 9, 0),
  ('FARM-10', 'stoma-farmakologia', 'Leki przeciwpadaczkowe, zespoły otępienne, choroba Parkinsona', 10, 0),
  ('FARM-11', 'stoma-farmakologia', 'Witaminy, biopierwiastki i suplementy diety', 11, 0),
  ('FARM-12', 'stoma-farmakologia', 'Układ oddechowy – wykrztuśne, przeciwkaszlowe, astma, POChP', 12, 0),
  ('FARM-13', 'stoma-farmakologia', 'Leki przeciwbakteryjne i środki odkażające. Farmakobiologia infekcji', 13, 0),
  ('FARM-14', 'stoma-farmakologia', 'Leki przeciwwirusowe, przeciwgrzybicze i przeciwpasożytnicze. Medycyna podróży', 14, 0),
  ('FARM-15', 'stoma-farmakologia', 'Leki układu pokarmowego', 15, 0),
  ('FARM-16', 'stoma-farmakologia', 'Hormony – podwzgórze, przysadka, tarczyca, kora nadnerczy, hormony płciowe', 16, 0),
  ('FARM-17', 'stoma-farmakologia', 'Metabolizm wapnia, homeostaza węglowodanowa, leczenie otyłości', 17, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
