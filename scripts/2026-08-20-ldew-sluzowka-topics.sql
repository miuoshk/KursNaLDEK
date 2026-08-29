-- ============================================================
-- LDEW — Choroby błony śluzowej: 14 tematów (SLU-01 … SLU-14)
-- Przedmiot ldew-choroby-sluzowki musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('SLU-01', 'ldew-choroby-sluzowki', 'Podstawy anatomii i fizjologii jamy ustnej', 1, 0),
  ('SLU-02', 'ldew-choroby-sluzowki', 'Badanie pacjenta i symptomatologia chorób błony śluzowej jamy ustnej', 2, 0),
  ('SLU-03', 'ldew-choroby-sluzowki', 'Wady i choroby języka', 3, 0),
  ('SLU-04', 'ldew-choroby-sluzowki', 'Objawy chorób wirusowych w jamie ustnej', 4, 0),
  ('SLU-05', 'ldew-choroby-sluzowki', 'Kandydozy jamy ustnej', 5, 0),
  ('SLU-06', 'ldew-choroby-sluzowki', 'Swoiste choroby bakteryjne', 6, 0),
  ('SLU-07', 'ldew-choroby-sluzowki', 'Aftozy', 7, 0),
  ('SLU-08', 'ldew-choroby-sluzowki', 'Potencjalnie złośliwiejące zaburzenia błony śluzowej jamy ustnej', 8, 0),
  ('SLU-09', 'ldew-choroby-sluzowki', 'Choroby skórno-śluzówkowe', 9, 0),
  ('SLU-10', 'ldew-choroby-sluzowki', 'Alergie w jamie ustnej', 10, 0),
  ('SLU-11', 'ldew-choroby-sluzowki', 'Choroby układowe tkanki łącznej', 11, 0),
  ('SLU-12', 'ldew-choroby-sluzowki', 'Zaburzenia wydzielania śliny', 12, 0),
  ('SLU-13', 'ldew-choroby-sluzowki', 'BMS (zespół pieczenia jamy ustnej)', 13, 0),
  ('SLU-14', 'ldew-choroby-sluzowki', 'Zmiany na błonach śluzowych jamy ustnej w przebiegu chorób układu krwiotwórczego i chłonnego', 14, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
