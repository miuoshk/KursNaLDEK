-- ============================================================
-- LDEW — przedmioty kliniczne (nostryfikacja) + tematy Periodontologii
-- Źródło mapy tematów PER: Periodontologia Górska (OCR), wykład 1–22
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('ldew-stomatologia-zachowawcza', 'Stomatologia zachowawcza',           'Zachowawcza',  'heart-pulse',     1, 'stomatologia', 'ldew',  1),
  ('ldew-endodoncja',               'Endodoncja',                         'Endodoncja',   'zap',             1, 'stomatologia', 'ldew',  2),
  ('ldew-periodontologia',          'Periodontologia',                    'Periodont.',   'activity',        1, 'stomatologia', 'ldew',  3),
  ('ldew-choroby-sluzowki',         'Choroby błony śluzowej jamy ustnej', 'Błona śluzowa','microscope',      1, 'stomatologia', 'ldew',  4),
  ('ldew-stomatologia-dziecieca',   'Stomatologia dziecięca',             'Pedodoncja',   'users',           1, 'stomatologia', 'ldew',  5),
  ('ldew-ortodoncja',               'Ortodoncja',                         'Ortodoncja',   'bone',            1, 'stomatologia', 'ldew',  6),
  ('ldew-protetyka',                'Protetyka stomatologiczna',          'Protetyka',    'pill',            1, 'stomatologia', 'ldew',  7),
  ('ldew-chirurgia-stomatologiczna','Chirurgia stomatologiczna',          'Chir. stom.',  'scan',            1, 'stomatologia', 'ldew',  8),
  ('ldew-chirurgia-szczekowo-twarzowa', 'Chirurgia szczękowo-twarzowa',   'Chir. szcz.',  'clipboard-check', 1, 'stomatologia', 'ldew',  9),
  ('ldew-radiologia',               'Radiologia stomatologiczna',         'Radiologia',   'flask-conical',   1, 'stomatologia', 'ldew', 10),
  ('ldew-zdrowie-publiczne',        'Zdrowie publiczne',                   'Zd. publiczne','languages',       1, 'stomatologia', 'ldew', 11),
  ('ldew-orzecznictwo',             'Orzecznictwo',                       'Orzecznictwo', 'book-open',       1, 'stomatologia', 'ldew', 12)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

-- Periodontologia — 22 tematy (PER-01 … PER-22)
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PER-01', 'ldew-periodontologia', 'Budowa i czynność tkanki przyzębia', 1, 0),
  ('PER-02', 'ldew-periodontologia', 'Etiologia i patogeneza chorób przyzębia', 2, 0),
  ('PER-03', 'ldew-periodontologia', 'Rozpoznanie chorób przyzębia', 3, 0),
  ('PER-04', 'ldew-periodontologia', 'Współistniejące schorzenia ogólnoustrojowe', 4, 0),
  ('PER-05', 'ldew-periodontologia', 'Przewlekłe zapalenie dziąseł', 5, 0),
  ('PER-06', 'ldew-periodontologia', 'Przewlekłe zapalenie przyzębia', 6, 0),
  ('PER-07', 'ldew-periodontologia', 'Agresywne zapalenie przyzębia', 7, 0),
  ('PER-08', 'ldew-periodontologia', 'ZAP choroba w okresie okołoporodowym', 8, 0),
  ('PER-09', 'ldew-periodontologia', 'Zapalenie przyzębia jako powikłanie leczenia endodontycznego', 9, 0),
  ('PER-10', 'ldew-periodontologia', 'Nekrotyzujące zapalenie dziąseł', 10, 0),
  ('PER-11', 'ldew-periodontologia', 'Nekrotyzujące zapalenie przyzębia', 11, 0),
  ('PER-12', 'ldew-periodontologia', 'Przyzębie zębów mlecznych', 12, 0),
  ('PER-13', 'ldew-periodontologia', 'Wrodzone wady przyzębia', 13, 0),
  ('PER-14', 'ldew-periodontologia', 'Przyzębie wokół zębów utrwalonych', 14, 0),
  ('PER-15', 'ldew-periodontologia', 'Przyzębie wokół koron protetycznych', 15, 0),
  ('PER-16', 'ldew-periodontologia', 'Przyzębie wokół implantów', 16, 0),
  ('PER-17', 'ldew-periodontologia', 'Choroby tkanek miękkich jamy ustnej', 17, 0),
  ('PER-18', 'ldew-periodontologia', 'Choroby tkanek twardych jamy ustnej', 18, 0),
  ('PER-19', 'ldew-periodontologia', 'Metody leczenia chorób przyzębia — ogólne zasady', 19, 0),
  ('PER-20', 'ldew-periodontologia', 'Leczenie zachowawcze', 20, 0),
  ('PER-21', 'ldew-periodontologia', 'Leczenie chirurgiczne', 21, 0),
  ('PER-22', 'ldew-periodontologia', 'Leczenie wspomagające', 22, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
