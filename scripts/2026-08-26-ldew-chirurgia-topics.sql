-- ============================================================
-- LDEW — Chirurgia stomatologiczna i szczękowo-twarzowa
-- 1) Rename kafle chirurgii + usunięcie 4 kafli bez programu
-- 2) 25 tematów CHS-01 … CHS-25
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT / DELETE by id).
-- ============================================================

UPDATE public.subjects
   SET name          = 'Chirurgia stomatologiczna i szczękowo-twarzowa',
       short_name    = 'Chirurgia',
       icon_name     = 'scissors',
       display_order = 8
 WHERE id = 'ldew-chirurgia-stomatologiczna';

-- Kafle usunięte z oferty LDEW (brak osobnego programu / scalone z CHS)
DELETE FROM public.subjects
 WHERE id IN (
   'ldew-chirurgia-szczekowo-twarzowa',
   'ldew-radiologia',
   'ldew-zdrowie-publiczne',
   'ldew-orzecznictwo'
 );

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('CHS-01', 'ldew-chirurgia-stomatologiczna', 'Rys historyczny chirurgii stomatologicznej i szczękowo-twarzowej w Polsce', 1, 0),
  ('CHS-02', 'ldew-chirurgia-stomatologiczna', 'Profilaktyka zakażeń w gabinecie chirurgii stomatologicznej i szczękowo-twarzowej', 2, 0),
  ('CHS-03', 'ldew-chirurgia-stomatologiczna', 'Znieczulenie w chirurgii szczękowo-twarzowej', 3, 0),
  ('CHS-04', 'ldew-chirurgia-stomatologiczna', 'Podstawy chirurgii wyrostka zębodołowego cz. I', 4, 0),
  ('CHS-05', 'ldew-chirurgia-stomatologiczna', 'Podstawy chirurgii wyrostka zębodołowego cz. II', 5, 0),
  ('CHS-06', 'ldew-chirurgia-stomatologiczna', 'Podstawy chirurgii wyrostka zębodołowego cz. III', 6, 0),
  ('CHS-07', 'ldew-chirurgia-stomatologiczna', 'Implantologia stomatologiczna', 7, 0),
  ('CHS-08', 'ldew-chirurgia-stomatologiczna', 'Podstawy farmakoterapii w stomatologii', 8, 0),
  ('CHS-09', 'ldew-chirurgia-stomatologiczna', 'Stany zapalne tkanek miękkich i kości części twarzowej czaszki', 9, 0),
  ('CHS-10', 'ldew-chirurgia-stomatologiczna', 'Torbiele kości szczękowych', 10, 0),
  ('CHS-11', 'ldew-chirurgia-stomatologiczna', 'Schorzenia zatok przynosowych', 11, 0),
  ('CHS-12', 'ldew-chirurgia-stomatologiczna', 'Onkologia głowy i szyi', 12, 0),
  ('CHS-13', 'ldew-chirurgia-stomatologiczna', 'Traumatologia szczękowo-twarzowa cz. I', 13, 0),
  ('CHS-14', 'ldew-chirurgia-stomatologiczna', 'Traumatologia szczękowo-twarzowa cz. II', 14, 0),
  ('CHS-15', 'ldew-chirurgia-stomatologiczna', 'Traumatologia szczękowo-twarzowa cz. III', 15, 0),
  ('CHS-16', 'ldew-chirurgia-stomatologiczna', 'Wady rozwojowe i ortognatyka cz. I', 16, 0),
  ('CHS-17', 'ldew-chirurgia-stomatologiczna', 'Wady rozwojowe i ortognatyka cz. II - Chirurgia ortognatyczna', 17, 0),
  ('CHS-18', 'ldew-chirurgia-stomatologiczna', 'Wady rozwojowe i ortognatyka cz. III', 18, 0),
  ('CHS-19', 'ldew-chirurgia-stomatologiczna', 'Choroby i leczenie stawu skroniowo-żuchwowego cz. I', 19, 0),
  ('CHS-20', 'ldew-chirurgia-stomatologiczna', 'Choroby i leczenie stawu skroniowo-żuchwowego cz. II', 20, 0),
  ('CHS-21', 'ldew-chirurgia-stomatologiczna', 'Rehabilitacja narządu żucia', 21, 0),
  ('CHS-22', 'ldew-chirurgia-stomatologiczna', 'Rehabilitacja protetyczna pacjentów po leczeniu nowotworów części twarzowej czaszki', 22, 0),
  ('CHS-23', 'ldew-chirurgia-stomatologiczna', 'Zastosowanie laseroterapii w chirurgii stomatologicznej', 23, 0),
  ('CHS-24', 'ldew-chirurgia-stomatologiczna', 'Chirurgia plastyczna', 24, 0),
  ('CHS-25', 'ldew-chirurgia-stomatologiczna', 'Dokumentacja medyczna w praktyce lekarza dentysty', 25, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
