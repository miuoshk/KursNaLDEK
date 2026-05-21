-- Mikrobiologia (ogólna): wspólne repozytorium treści
-- stomatologia rok 2 (stoma-mikrobio) + lekarski rok 3 (lek-mikrobio)
-- Model jak fizjologia / biofizyka — track-specific ID to powłoka UI.
-- Mikrobiologia JU (stoma-mikrobio-ju) pozostaje osobno — tylko stomatologia.

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'mikrobiologia',
  'Mikrobiologia',
  'Mikrobiologia',
  'bug',
  2,
  'shared',
  'knnp',
  99
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.topics
SET subject_id = 'mikrobiologia'
WHERE subject_id = 'mikrobiologia-2-stom';

DELETE FROM public.subjects
WHERE id = 'mikrobiologia-2-stom';
