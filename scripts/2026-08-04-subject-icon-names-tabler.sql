-- Semantyczne icon_name pod ikony Tabler (subjectIconMap.tsx).
-- Bezpieczne do wielokrotnego uruchomienia.

-- LDEW — kliniczne przedmioty stomatologiczne
UPDATE public.subjects SET icon_name = 'dental'          WHERE id = 'ldew-stomatologia-zachowawcza';
UPDATE public.subjects SET icon_name = 'needle'          WHERE id = 'ldew-endodoncja';
UPDATE public.subjects SET icon_name = 'dental-broken'   WHERE id = 'ldew-periodontologia';
UPDATE public.subjects SET icon_name = 'microscope'      WHERE id = 'ldew-choroby-sluzowki';
UPDATE public.subjects SET icon_name = 'baby-carriage'   WHERE id = 'ldew-stomatologia-dziecieca';
UPDATE public.subjects SET icon_name = 'braces'          WHERE id = 'ldew-ortodoncja';
UPDATE public.subjects SET icon_name = 'crown'           WHERE id = 'ldew-protetyka';
UPDATE public.subjects SET icon_name = 'scissors'        WHERE id = 'ldew-chirurgia-stomatologiczna';
UPDATE public.subjects SET icon_name = 'skull'           WHERE id = 'ldew-chirurgia-szczekowo-twarzowa';
UPDATE public.subjects SET icon_name = 'photo-scan'      WHERE id = 'ldew-radiologia';
UPDATE public.subjects SET icon_name = 'hospital'        WHERE id = 'ldew-zdrowie-publiczne';
UPDATE public.subjects SET icon_name = 'gavel'           WHERE id = 'ldew-orzecznictwo';

-- KNNP — stomatologia
UPDATE public.subjects SET icon_name = 'language'        WHERE id = 'stoma-angielski';
UPDATE public.subjects SET icon_name = 'bolt'            WHERE id = 'stoma-biofizyka';
UPDATE public.subjects SET icon_name = 'flask'           WHERE id = 'stoma-chemia';
UPDATE public.subjects SET icon_name = 'flask-2'         WHERE id = 'stoma-biochemia';
UPDATE public.subjects SET icon_name = 'heart-rate'      WHERE id = 'stoma-fizjologia';
UPDATE public.subjects SET icon_name = 'virus'           WHERE id = 'stoma-zakazne';
UPDATE public.subjects SET icon_name = 'virus'           WHERE id = 'stoma-mikrobio-ju';
UPDATE public.subjects SET icon_name = 'heart-handshake' WHERE id = 'stoma-socjologia';

-- KNNP — lekarski
UPDATE public.subjects SET icon_name = 'bolt'            WHERE id = 'lek-biofizyka';
UPDATE public.subjects SET icon_name = 'flask-2'         WHERE id = 'lek-biochemia';
UPDATE public.subjects SET icon_name = 'heart-rate'      WHERE id = 'lek-fizjologia';
UPDATE public.subjects SET icon_name = 'language'        WHERE id = 'lek-angielski';
UPDATE public.subjects SET icon_name = 'shield-plus'     WHERE id = 'lek-immunologia';
UPDATE public.subjects SET icon_name = 'heart-handshake' WHERE id = 'lek-prof-humanizm';

-- Wspólne repozytoria treści
UPDATE public.subjects SET icon_name = 'bolt'            WHERE id = 'biofizyka';
UPDATE public.subjects SET icon_name = 'heart-rate'      WHERE id = 'fizjologia';
