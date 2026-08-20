-- Anatomia: ANA-CZA — nazwa wyświetlana „Głowa” (było „Czaszka i kości twarzoczaszki”).

UPDATE public.topics
SET name = 'Głowa'
WHERE id = 'ANA-CZA'
  AND name IS DISTINCT FROM 'Głowa';
