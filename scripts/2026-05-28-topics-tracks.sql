-- Ograniczenie działów do wybranych kierunków (NULL = oba).
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS tracks TEXT[] DEFAULT NULL;

-- FARM-19: tylko lekarski (onkologia / leki przeciwnowotworowe).
UPDATE public.topics
SET tracks = ARRAY['lekarski']::TEXT[]
WHERE id = 'FARM-19';
