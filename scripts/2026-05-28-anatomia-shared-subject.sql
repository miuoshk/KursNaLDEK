-- Anatomia: wspólne repozytorium (stomatologia + lekarski).
-- Pełna migracja danych: scripts/migrate-anatomia-apply.mjs --apply
-- Powłoki UI: stoma-anatomia, lek-anatomia

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'anatomia',
  'Anatomia',
  'Anatomia',
  'bone',
  1,
  'shared',
  'knnp',
  99
)
ON CONFLICT (id) DO NOTHING;

-- Po migracji JS: topics.subject_id = 'anatomia', brak LEK-ANA-* / lek-ana-*
