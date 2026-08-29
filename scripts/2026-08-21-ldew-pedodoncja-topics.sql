-- ============================================================
-- LDEW — Stomatologia dziecięca: 19 tematów (PED-01 … PED-19)
-- Przedmiot ldew-stomatologia-dziecieca musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PED-01', 'ldew-stomatologia-dziecieca', 'Rozwój zęba, przyzębia i błony śluzowej', 1, 0),
  ('PED-02', 'ldew-stomatologia-dziecieca', 'Mechanizm wyrzynania zębów', 2, 0),
  ('PED-03', 'ldew-stomatologia-dziecieca', 'Morfologia i fizjologia zębów', 3, 0),
  ('PED-04', 'ldew-stomatologia-dziecieca', 'Mikrobiom jamy ustnej', 4, 0),
  ('PED-05', 'ldew-stomatologia-dziecieca', 'Parafunkcje i dysfunkcje narządu żucia', 5, 0),
  ('PED-06', 'ldew-stomatologia-dziecieca', 'Wybrane patologie rozwoju twarzoczaszki', 6, 0),
  ('PED-07', 'ldew-stomatologia-dziecieca', 'Dziecko jako pacjent w gabinecie stomatologicznym', 7, 0),
  ('PED-08', 'ldew-stomatologia-dziecieca', 'Choroby twardych tkanek zębów', 8, 0),
  ('PED-09', 'ldew-stomatologia-dziecieca', 'Postępowanie lecznicze w chorobie próchnicowej', 9, 0),
  ('PED-10', 'ldew-stomatologia-dziecieca', 'Profilaktyka próchnicy zębów', 10, 0),
  ('PED-11', 'ldew-stomatologia-dziecieca', 'Żywienie a zdrowie jamy ustnej', 11, 0),
  ('PED-12', 'ldew-stomatologia-dziecieca', 'Choroby miazgi zębów', 12, 0),
  ('PED-13', 'ldew-stomatologia-dziecieca', 'Pourazowe uszkodzenia zębów', 13, 0),
  ('PED-14', 'ldew-stomatologia-dziecieca', 'Częste choroby infekcyjne w wieku rozwojowym. Zmiany nieinfekcyjne', 14, 0),
  ('PED-15', 'ldew-stomatologia-dziecieca', 'Zmiany i stany zagrożone transformacją nowotworową', 15, 0),
  ('PED-16', 'ldew-stomatologia-dziecieca', 'Choroby przyzębia u dzieci i młodzieży', 16, 0),
  ('PED-17', 'ldew-stomatologia-dziecieca', 'Opieka stomatologiczna nad dziećmi niepełnosprawnymi i z przewlekłymi chorobami ogólnymi', 17, 0),
  ('PED-18', 'ldew-stomatologia-dziecieca', 'Zapalenia w obrębie twarzoczaszki', 18, 0),
  ('PED-19', 'ldew-stomatologia-dziecieca', 'Ekstrakcje zębów u dzieci i młodzieży', 19, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
