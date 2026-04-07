-- UWAGA: ten skrypt kasuje istniejące subjects! Uruchom PRZED seed-content.sql
-- ============================================
-- PEŁNE CURRICULUM — Kurs na LDEK
-- UWAGA: kasuje istniejące subjects + kaskadowo topics/questions!
-- ============================================

-- Wyczyść
DELETE FROM subjects;

-- ============================================
-- STOMATOLOGIA (track = 'stomatologia', product = 'knnp')
-- ============================================

-- Rok 1
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-anatomia',     'Anatomia',                  'Anatomia',      'bone',           1, 'stomatologia', 'knnp', 1),
  ('stoma-angielski',    'Język angielski medyczny',   'Angielski',     'languages',      1, 'stomatologia', 'knnp', 2),
  ('stoma-histologia',   'Histologia i embriologia',  'Histologia',    'microscope',     1, 'stomatologia', 'knnp', 3),
  ('stoma-biofizyka',    'Biofizyka',                 'Biofizyka',     'zap',            1, 'stomatologia', 'knnp', 4),
  ('stoma-biologia',     'Biologia z genetyką',       'Biologia',      'dna',            1, 'stomatologia', 'knnp', 5),
  ('stoma-chemia',       'Chemia medyczna',           'Chemia',        'flask-conical',  1, 'stomatologia', 'knnp', 6);

-- Rok 2
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-patologia',    'Patomorfologia',            'Patologia',     'scan',           2, 'stomatologia', 'knnp', 7),
  ('stoma-osce',         'OSCE',                      'OSCE',          'clipboard-check', 2, 'stomatologia', 'knnp', 8),
  ('stoma-biochemia',    'Biochemia',                 'Biochemia',     'flask-round',    2, 'stomatologia', 'knnp', 9),
  ('stoma-fizjologia',   'Fizjologia',                'Fizjologia',    'heart-pulse',    2, 'stomatologia', 'knnp', 10),
  ('stoma-mikrobio',     'Mikrobiologia',             'Mikrobiologia', 'bug',            2, 'stomatologia', 'knnp', 11),
  ('stoma-mikrobio-ju',  'Mikrobiologia jamy ustnej', 'Mikro JU',      'microscope',     2, 'stomatologia', 'knnp', 12);

-- Rok 3
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-pediatria',    'Pediatria',                 'Pediatria',     'baby',           3, 'stomatologia', 'knnp', 13),
  ('stoma-chirurgia',    'Chirurgia',                 'Chirurgia',     'scissors',       3, 'stomatologia', 'knnp', 14),
  ('stoma-farmakologia', 'Farmakologia',              'Farmakologia',  'pill',           3, 'stomatologia', 'knnp', 15);

-- ============================================
-- LEKARSKI (track = 'lekarski', product = 'knnp')
-- ============================================

-- Rok 1
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-anatomia',       'Anatomia',                  'Anatomia',      'bone',           1, 'lekarski', 'knnp', 1),
  ('lek-biofizyka',      'Biofizyka',                 'Biofizyka',     'zap',            1, 'lekarski', 'knnp', 2),
  ('lek-histologia',     'Histologia i embriologia',  'Histologia',    'microscope',     1, 'lekarski', 'knnp', 3),
  ('lek-biologia-mol',   'Biologia molekularna',      'Bio. mol.',     'dna',            1, 'lekarski', 'knnp', 4);

-- Rok 2
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-biochemia',      'Biochemia',                 'Biochemia',     'flask-round',    2, 'lekarski', 'knnp', 5),
  ('lek-fizjologia',     'Fizjologia',                'Fizjologia',    'heart-pulse',    2, 'lekarski', 'knnp', 6),
  ('lek-angielski',      'Język angielski medyczny',  'Angielski',     'languages',      2, 'lekarski', 'knnp', 7),
  ('lek-immunologia',    'Immunologia',               'Immunologia',   'shield',         2, 'lekarski', 'knnp', 8);

-- Rok 3
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-patofizjologia', 'Patofizjologia',            'Patofizjo.',    'activity',       3, 'lekarski', 'knnp', 9),
  ('lek-farmakologia',   'Farmakologia',              'Farmakologia',  'pill',           3, 'lekarski', 'knnp', 10),
  ('lek-mikrobio',       'Mikrobiologia',             'Mikrobiologia', 'bug',            3, 'lekarski', 'knnp', 11);
