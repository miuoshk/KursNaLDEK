-- Choroby zakaźne (STOMA): 23 tematy z handover Zenit (TEMAT_NR 1–23) + CHZ-ZAL.
-- subject_id: stoma-zakazne
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('CHZ-01', 'stoma-zakazne', 'Zjawiska immunologiczne w chorobach zakaźnych i pasożytnicznych', 1, 0),
  ('CHZ-02', 'stoma-zakazne', 'Związki między gospodarzem a patogenem', 2, 0),
  ('CHZ-03', 'stoma-zakazne', 'Ogólna etiopatogeneza chorób zakaźnych', 3, 0),
  ('CHZ-04', 'stoma-zakazne', 'Leczenie etiotropowe - antybiotyki i chemioterapeutyki', 4, 0),
  ('CHZ-05', 'stoma-zakazne', 'Posocznica - wstrząs septyczny', 5, 0),
  ('CHZ-06', 'stoma-zakazne', 'Zakażenia szpitalne', 6, 0),
  ('CHZ-07', 'stoma-zakazne', 'Gorączka', 7, 0),
  ('CHZ-08', 'stoma-zakazne', 'Zakażenia wywołane przez bakterie Gram-dodatnie', 8, 0),
  ('CHZ-09', 'stoma-zakazne', 'Zakażenia wywołane przez bakterie Gram-ujemne', 9, 0),
  ('CHZ-10', 'stoma-zakazne', 'Inne choroby bakteryjne', 10, 0),
  ('CHZ-11', 'stoma-zakazne', 'Zakażenia wywołane przez DNA-wirusy', 11, 0),
  ('CHZ-12', 'stoma-zakazne', 'Zakażenia wywołane przez RNA-wirusy', 12, 0),
  ('CHZ-13', 'stoma-zakazne', 'Zakażenia wirusami hepatotropowymi', 13, 0),
  ('CHZ-14', 'stoma-zakazne', 'Grzybice głębokie', 14, 0),
  ('CHZ-15', 'stoma-zakazne', 'Inwazje pierwotniaków-pasożytów przewodu pokarmowego', 15, 0),
  ('CHZ-16', 'stoma-zakazne', 'Inwazje pierwotniaków-pasożytów pozajelitowych', 16, 0),
  ('CHZ-17', 'stoma-zakazne', 'Inwazje „egzotycznych” pierwotniaków', 17, 0),
  ('CHZ-18', 'stoma-zakazne', 'Inwazje nicieni przewodu pokarmowego', 18, 0),
  ('CHZ-19', 'stoma-zakazne', 'Inwazje tasiemców przewodu pokarmowego', 19, 0),
  ('CHZ-20', 'stoma-zakazne', 'Robaczyce tkankowe', 20, 0),
  ('CHZ-21', 'stoma-zakazne', 'Robaczyce „egzotyczne”', 21, 0),
  ('CHZ-22', 'stoma-zakazne', 'Wyodrębnione zespoły kliniczne', 22, 0),
  ('CHZ-23', 'stoma-zakazne', 'Inne zagadnienia', 23, 0),
  ('CHZ-ZAL', 'stoma-zakazne', 'Zaliczenie / egzamin (worek zbiorczy)', 24, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
