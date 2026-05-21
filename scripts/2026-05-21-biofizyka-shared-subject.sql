-- Biofizyka: wspólne repozytorium treści dla stomatologii i lekarskiego
-- (model jak `histologia` — track-specific ID to powłoka UI).

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'biofizyka',
  'Biofizyka',
  'Biofizyka',
  'zap',
  1,
  'shared',
  'knnp',
  99
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.topics
SET subject_id = 'biofizyka'
WHERE subject_id = 'biofizyka-1-stom';

DELETE FROM public.subjects
WHERE id = 'biofizyka-1-stom';
