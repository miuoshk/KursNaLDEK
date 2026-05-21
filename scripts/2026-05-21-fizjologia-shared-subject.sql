-- Fizjologia: wspólne repozytorium treści dla stomatologii i lekarskiego (rok 2)
-- (model jak histologia / biofizyka — track-specific ID to powłoka UI).

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'fizjologia',
  'Fizjologia',
  'Fizjologia',
  'heart-pulse',
  2,
  'shared',
  'knnp',
  99
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.topics
SET subject_id = 'fizjologia'
WHERE subject_id = 'fizjologia-2-stom';

DELETE FROM public.subjects
WHERE id = 'fizjologia-2-stom';
