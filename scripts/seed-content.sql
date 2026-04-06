-- ============================================
-- KURS NA LDEK — seed tematów i przykładowych pytań
-- Wklej w Supabase SQL Editor i uruchom (Run).
-- Możesz uruchomić wielokrotnie — konflikty ID są pomijane.
-- ============================================

-- Kolejka pytań w sesji (odświeżenie strony / wznowienie)
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS question_ids jsonb DEFAULT '[]'::jsonb;

-- Tematy: Biochemia
INSERT INTO topics (id, subject_id, name, display_order, question_count) VALUES
  ('BIO-AA', 'biochemia', 'Aminokwasy i białka', 1, 5),
  ('BIO-ENZ', 'biochemia', 'Enzymy i kinetyka enzymatyczna', 2, 5),
  ('BIO-MET', 'biochemia', 'Metabolizm węglowodanów', 3, 5),
  ('BIO-LIP', 'biochemia', 'Metabolizm lipidów', 4, 5),
  ('BIO-ETC', 'biochemia', 'Łańcuch oddechowy i fosforylacja oksydacyjna', 5, 5),
  ('BIO-NK', 'biochemia', 'Kwasy nukleinowe i replikacja DNA', 6, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  question_count = EXCLUDED.question_count;

-- Tematy: Anatomia
INSERT INTO topics (id, subject_id, name, display_order, question_count) VALUES
  ('ANA-CZA', 'anatomia', 'Czaszka i kości twarzoczaszki', 1, 5),
  ('ANA-MIE', 'anatomia', 'Mięśnie żucia i mimiczne', 2, 5),
  ('ANA-NAC', 'anatomia', 'Naczynia głowy i szyi', 3, 5),
  ('ANA-NER', 'anatomia', 'Nerwy czaszkowe', 4, 5),
  ('ANA-JAM', 'anatomia', 'Jama ustna i jej struktury', 5, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  question_count = EXCLUDED.question_count;

-- Przykładowe pytania (BIO-ETC, BIO-AA)
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty, source_exam, source_code) VALUES

('bio-etc-001', 'BIO-ETC',
 'Który kompleks łańcucha oddechowego NIE pompuje protonów przez wewnętrzną błonę mitochondrialną?',
 '[{"id":"a","text":"Kompleks I (dehydrogenaza NADH)"},{"id":"b","text":"Kompleks II (dehydrogenaza bursztynianowa)"},{"id":"c","text":"Kompleks III (cytochrom bc₁)"},{"id":"d","text":"Kompleks IV (oksydaza cytochromowa)"},{"id":"e","text":"Syntaza ATP (kompleks V)"}]'::jsonb,
 'b',
 $E$Kompleks II (dehydrogenaza bursztynianowa) jest jedynym kompleksem łańcucha oddechowego, który NIE pompuje protonów (H⁺) przez wewnętrzną błonę mitochondrialną. Dlatego FADH₂, który oddaje elektrony do kompleksu II, daje mniej ATP (~1,5) niż NADH (~2,5), który oddaje elektrony do kompleksu I. Kompleks II przyjmuje elektrony z FADH₂ i przekazuje je na ubichinon (CoQ), ale nie generuje gradientu protonowego.$E$,
 'srednie', NULL, NULL),

('bio-etc-002', 'BIO-ETC',
 'Ile cząsteczek ATP (netto) powstaje z pełnego utlenienia jednej cząsteczki glukozy w warunkach tlenowych?',
 '[{"id":"a","text":"2 ATP"},{"id":"b","text":"4 ATP"},{"id":"c","text":"30-32 ATP"},{"id":"d","text":"36-38 ATP"},{"id":"e","text":"24 ATP"}]'::jsonb,
 'c',
 $E$Współczesne obliczenia uwzględniające stosunek P/O i koszt transportu wskazują na ~30-32 ATP netto z jednej cząsteczki glukozy. Dawniej podawano 36-38, ale ta wartość nie uwzględnia kosztu transportu NADH z cytoplazmy do mitochondrium (wahadło malat-asparaginian lub glicerolo-3-fosforanowe) oraz dokładnego stosunku H⁺/ATP w syntazie ATP.$E$,
 'srednie', NULL, NULL),

('bio-etc-003', 'BIO-ETC',
 'Cyjanek hamuje łańcuch oddechowy poprzez blokowanie:',
 '[{"id":"a","text":"Kompleksu I"},{"id":"b","text":"Kompleksu II"},{"id":"c","text":"Kompleksu III"},{"id":"d","text":"Kompleksu IV (oksydazy cytochromowej)"},{"id":"e","text":"Syntazy ATP"}]'::jsonb,
 'd',
 $E$Cyjanek (CN⁻) jest klasycznym inhibitorem kompleksu IV (oksydazy cytochromowej). Wiąże się z jonem żelaza (Fe³⁺) w centrum aktywnym, uniemożliwiając transfer elektronów na tlen. Efekt: całkowite zatrzymanie łańcucha oddechowego, brak produkcji ATP, śmierć komórki. Inne inhibitory kompleksu IV to: tlenek węgla (CO) i siarkowodór (H₂S).$E$,
 'latwe', NULL, NULL),

('bio-etc-004', 'BIO-ETC',
 'Oligomycyna jest inhibitorem:',
 '[{"id":"a","text":"Kompleksu I"},{"id":"b","text":"Kompleksu III"},{"id":"c","text":"Kompleksu IV"},{"id":"d","text":"Syntazy ATP (kompleksu V)"},{"id":"e","text":"Translokazy ADP/ATP"}]'::jsonb,
 'd',
 $E$Oligomycyna blokuje podjednostkę F₀ syntazy ATP, zamykając kanał protonowy. Protony nie mogą przepływać z powrotem do matrix mitochondrialnej, więc ATP nie jest syntetyzowane. Co ważne, oligomycyna hamuje również łańcuch oddechowy (pośrednio), ponieważ nagromadzenie protonów w przestrzeni międzybłonowej hamuje dalsze pompowanie przez kompleksy I, III i IV.$E$,
 'latwe', NULL, NULL),

('bio-etc-005', 'BIO-ETC',
 'Rozkurczyciele (uncouplers) łańcucha oddechowego, takie jak 2,4-dinitrofenol (DNP), powodują:',
 '[{"id":"a","text":"Zahamowanie transportu elektronów"},{"id":"b","text":"Zwiększenie syntezy ATP"},{"id":"c","text":"Rozproszenie gradientu protonowego jako ciepło"},{"id":"d","text":"Zahamowanie syntazy ATP"},{"id":"e","text":"Odwrócenie kierunku transportu elektronów"}]'::jsonb,
 'c',
 $E$DNP i inne rozkurczyciele (np. termogenina/UCP1 w brunatnej tkance tłuszczowej) są lipofilowymi słabymi kwasami, które przenoszą protony przez wewnętrzną błonę mitochondrialną z pominięciem syntazy ATP. Gradient protonowy jest rozpraszany jako ciepło zamiast być wykorzystywany do syntezy ATP. Transport elektronów jest przyspieszony (brak hamowania zwrotnego), ale ATP nie powstaje — energia jest uwalniana jako ciepło.$E$,
 'trudne', NULL, NULL),

('bio-aa-001', 'BIO-AA',
 'Który aminokwas jest jedynym iminokwasem wśród standardowych aminokwasów białkowych?',
 '[{"id":"a","text":"Glicyna"},{"id":"b","text":"Prolina"},{"id":"c","text":"Histydyna"},{"id":"d","text":"Tryptofan"},{"id":"e","text":"Cysteina"}]'::jsonb,
 'b',
 $E$Prolina jest jedynym iminokwasem — jej grupa aminowa jest częścią pierścienia pirolidynowego (cykliczna struktura, w której łańcuch boczny jest połączony zarówno z atomem azotu, jak i z węglem α). To sprawia, że prolina wprowadza sztywne zagięcia w łańcuchu polipeptydowym i jest częstym „łamaczem” struktur α-helisy.$E$,
 'latwe', NULL, NULL),

('bio-aa-002', 'BIO-AA',
 'Które aminokwasy są uważane za całkowicie ketogenne (wyłącznie ketogenne)?',
 '[{"id":"a","text":"Leucyna i alanina"},{"id":"b","text":"Leucyna i lizyna"},{"id":"c","text":"Izoleucyna i walina"},{"id":"d","text":"Fenyloalanina i tyrozyna"},{"id":"e","text":"Treonina i metionina"}]'::jsonb,
 'b',
 $E$Leucyna i lizyna to jedyne dwa aminokwasy całkowicie ketogenne — ich szkielet węglowy jest przekształcany wyłącznie w acetylo-CoA lub acetoacetylo-CoA, nigdy w pirogronian ani pośredniki cyklu Krebsa. Nie mogą więc być źródłem glukozy (brak glukoneogenezy z acetylo-CoA). Mnemonik: „LL = Leucyna + Lizyna = Lipidy (ketony)".$E$,
 'srednie', NULL, NULL),

('bio-aa-003', 'BIO-AA',
 'Wiązanie peptydowe ma charakter:',
 '[{"id":"a","text":"Pojedynczego wiązania z pełną swobodą rotacji"},{"id":"b","text":"Podwójnego wiązania"},{"id":"c","text":"Częściowo podwójnego wiązania (rezonansowego) — płaskie i sztywne"},{"id":"d","text":"Wiązania jonowego"},{"id":"e","text":"Wiązania kowalencyjnego bez ograniczeń konformacyjnych"}]'::jsonb,
 'c',
 $E$Wiązanie peptydowe (-CO-NH-) ma charakter częściowo podwójny dzięki rezonansowi — wolna para elektronów azotu jest zdelokalizowana na grupę karbonylową. Konsekwencje: wiązanie jest płaskie (6 atomów w jednej płaszczyźnie), sztywne (brak swobodnej rotacji), a konfiguracja jest zwykle trans (łańcuchy boczne po przeciwnych stronach).$E$,
 'latwe', NULL, NULL),

('bio-aa-004', 'BIO-AA',
 'Który aminokwas zawiera grupę tiolową (-SH) zdolną do tworzenia mostków disiarczkowych?',
 '[{"id":"a","text":"Metionina"},{"id":"b","text":"Seryna"},{"id":"c","text":"Cysteina"},{"id":"d","text":"Treonina"},{"id":"e","text":"Tyrozyna"}]'::jsonb,
 'c',
 $E$Cysteina posiada grupę sulfhydrylową (-SH) w łańcuchu bocznym. Dwie reszty cysteinowe mogą tworzyć mostek disiarczkowy (-S-S-) przez utlenianie, tworząc cystynę. Mostki disiarczkowe stabilizują strukturę trzeciorzędową i czwartorzędową białek, szczególnie białek wydzielniczych (np. insulina, immunoglobuliny). Metionina też zawiera siarkę, ale w formie tioeterowej (-S-CH₃), niezdolnej do tworzenia mostków.$E$,
 'latwe', NULL, NULL),

('bio-aa-005', 'BIO-AA',
 'Punkt izoelektryczny (pI) aminokwasu z kwaśnym łańcuchem bocznym (np. kwas asparaginowy) wynosi:',
 '[{"id":"a","text":"Powyżej 7 (zasadowy)"},{"id":"b","text":"Dokładnie 7 (obojętny)"},{"id":"c","text":"Poniżej 7 (kwaśny)"},{"id":"d","text":"Zależy od temperatury"},{"id":"e","text":"Zawsze równy pKa grupy α-aminowej"}]'::jsonb,
 'c',
 $E$Punkt izoelektryczny aminokwasu z dodatkową grupą kwaśną w łańcuchu bocznym (Asp: pI ≈ 2,77; Glu: pI ≈ 3,22) jest średnią z dwóch najniższych wartości pKa (pKa₁ grupy α-karboksylowej i pKa łańcucha bocznego), więc jest poniżej 7. Przy pH = pI aminokwas jest w formie obojnaczej (zwitterjonowej) i nie migruje w polu elektrycznym.$E$,
 'srednie', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  text = EXCLUDED.text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  difficulty = EXCLUDED.difficulty;
