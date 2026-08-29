-- ============================================================
-- LDEW — przedmioty kliniczne (nostryfikacja) — aktualna lista kafli
-- Tematy per przedmiot: osobne skrypty 2026-08-* / handovery w exports/
-- Usunięte kafle: radiologia, zdrowie publiczne, orzecznictwo,
--   chirurgia szczękowo-twarzowa (scalone z chirurgią stom.)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('ldew-stomatologia-zachowawcza', 'Stomatologia zachowawcza',                        'Zachowawcza',    'dental',          1, 'stomatologia', 'ldew', 1),
  ('ldew-endodoncja',               'Endodoncja',                                      'Endodoncja',     'needle',          1, 'stomatologia', 'ldew', 2),
  ('ldew-periodontologia',          'Periodontologia',                                  'Periodont.',     'dental-broken',   1, 'stomatologia', 'ldew', 3),
  ('ldew-choroby-sluzowki',         'Choroby błony śluzowej jamy ustnej',               'Błona śluzowa',  'microscope',      1, 'stomatologia', 'ldew', 4),
  ('ldew-stomatologia-dziecieca',   'Stomatologia dziecięca',                           'Pedodoncja',     'baby-carriage',   1, 'stomatologia', 'ldew', 5),
  ('ldew-ortodoncja',               'Ortodoncja',                                       'Ortodoncja',     'braces',          1, 'stomatologia', 'ldew', 6),
  ('ldew-protetyka',                'Protetyka stomatologiczna',                        'Protetyka',      'crown',           1, 'stomatologia', 'ldew', 7),
  ('ldew-chirurgia-stomatologiczna','Chirurgia stomatologiczna i szczękowo-twarzowa',  'Chirurgia',      'scissors',        1, 'stomatologia', 'ldew', 8)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

-- Usuń kafle poza ofertą (idempotent)
DELETE FROM public.subjects
 WHERE id IN (
   'ldew-chirurgia-szczekowo-twarzowa',
   'ldew-radiologia',
   'ldew-zdrowie-publiczne',
   'ldew-orzecznictwo'
 );
