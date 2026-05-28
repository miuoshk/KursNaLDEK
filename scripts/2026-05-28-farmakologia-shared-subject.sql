-- Farmakologia: wspólne repozytorium treści dla stomatologii i lekarskiego (rok 3).
-- Powłoki UI: stoma-farmakologia, lek-farmakologia (bez własnych topików).

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'farmakologia',
  'Farmakologia',
  'Farmakologia',
  'pill',
  3,
  'shared',
  'knnp',
  99
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.topics
SET subject_id = 'farmakologia'
WHERE subject_id = 'stoma-farmakologia';

-- Działy dodane po migracji na powłoce stoma-farmakologia — przenieś na kanon.
UPDATE public.topics
SET subject_id = 'farmakologia'
WHERE id IN ('FARM-18', 'FARM-19') AND subject_id = 'stoma-farmakologia';
