-- Stomatologia rok 3: Choroby zakaźne (tylko track stomatologia).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'stoma-zakazne',
  'Choroby zakaźne',
  'Ch. zakaźne',
  'shield-alert',
  3,
  'stomatologia',
  'knnp',
  14
)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

-- Działy — doprecyzuj nazwy po sylabusie uczelni (ON CONFLICT aktualizuje etykiety).
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('CHZ-01', 'stoma-zakazne', 'Epidemiologia i ogniska epidemii', 1, 0),
  ('CHZ-02', 'stoma-zakazne', 'Szczepienia ochronne', 2, 0),
  ('CHZ-03', 'stoma-zakazne', 'Infekcje wirusowe (wybrane)', 3, 0),
  ('CHZ-04', 'stoma-zakazne', 'Infekcje bakteryjne (wybrane)', 4, 0),
  ('CHZ-05', 'stoma-zakazne', 'HBV, HCV, HIV — stomatolog', 5, 0),
  ('CHZ-06', 'stoma-zakazne', 'Profilaktyka zakażeń krzyżowych w gabinecie', 6, 0),
  ('CHZ-07', 'stoma-zakazne', 'Gruźlica i inne choroby zakaźne w praktyce', 7, 0),
  ('CHZ-ZAL', 'stoma-zakazne', 'Zaliczenie / egzamin', 8, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
