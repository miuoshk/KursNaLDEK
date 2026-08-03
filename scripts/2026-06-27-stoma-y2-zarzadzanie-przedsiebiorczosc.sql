-- ============================================================
-- Stomatologia rok 2: Zarządzanie + Przedsiębiorczość
-- Kafelki ukryte globalnie — widoczne tylko dla kont preview
-- (catalogSubjectVisibility.ts → milosz.krysiak@icloud.com)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-zarzadzanie',       'Zarządzanie',       'Zarządzanie',       'users',    2, 'stomatologia', 'knnp', 13),
  ('stoma-przedsiebiorczosc', 'Przedsiębiorczość', 'Przedsięb.',        'activity', 2, 'stomatologia', 'knnp', 14)
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  short_name    = EXCLUDED.short_name,
  icon_name     = EXCLUDED.icon_name,
  year          = EXCLUDED.year,
  track         = EXCLUDED.track,
  product       = EXCLUDED.product,
  display_order = EXCLUDED.display_order;

-- Zarządzanie — 30 tematów (ZAR-01 … ZAR-30)
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('ZAR-01', 'stoma-zarzadzanie', 'Zarządzanie a przywództwo — istota, różnice, typy przywództwa', 1, 0),
  ('ZAR-02', 'stoma-zarzadzanie', 'Formalizacja organizacji — znaczenie, wady i zalety biurokracji', 2, 0),
  ('ZAR-03', 'stoma-zarzadzanie', 'Struktura organizacji — rodzaje, czynniki i determinanty skuteczności', 3, 0),
  ('ZAR-04', 'stoma-zarzadzanie', 'Organizacja i otoczenie — typy, sposoby analizy otoczenia', 4, 0),
  ('ZAR-05', 'stoma-zarzadzanie', 'Zarządzanie zasobami i procesami — łańcuch wartości', 5, 0),
  ('ZAR-06', 'stoma-zarzadzanie', 'Zarządzanie wiedzą — wiedza jako zasób organizacji', 6, 0),
  ('ZAR-07', 'stoma-zarzadzanie', 'Analiza SWOT — elementy, łączenie i tworzenie strategii', 7, 0),
  ('ZAR-08', 'stoma-zarzadzanie', 'Model biznesowy — istota, elementy, klasyfikacja', 8, 0),
  ('ZAR-09', 'stoma-zarzadzanie', 'Strategia organizacji — istota, charakterystyka i funkcje', 9, 0),
  ('ZAR-10', 'stoma-zarzadzanie', 'Kultura organizacyjna — poziomy, zmiana kulturowa i akulturacja', 10, 0),
  ('ZAR-11', 'stoma-zarzadzanie', 'Umiędzynarodowienie i zarządzanie międzynarodowe', 11, 0),
  ('ZAR-12', 'stoma-zarzadzanie', 'Cykl życia organizacji — fazy życia', 12, 0),
  ('ZAR-13', 'stoma-zarzadzanie', 'Współczesne koncepcje zarządzania — istota, zalety i krytyka', 13, 0),
  ('ZAR-14', 'stoma-zarzadzanie', 'Dylematy etyczne w organizacjach — zrównoważony rozwój', 14, 0),
  ('ZAR-15', 'stoma-zarzadzanie', 'Teoria–empiria–praktyka: socjologia a problemy badawcze', 15, 0),
  ('ZAR-16', 'stoma-zarzadzanie', 'Psychologia — metody badawcze i etyka', 16, 0),
  ('ZAR-17', 'stoma-zarzadzanie', 'Wzrost gospodarczy — źródła, mierniki, czynniki i bariery', 17, 0),
  ('ZAR-18', 'stoma-zarzadzanie', 'Budżet państwa, dług publiczny i polityka fiskalna', 18, 0),
  ('ZAR-19', 'stoma-zarzadzanie', 'Rynek pracy i bezrobocie — teoria zatrudnienia', 19, 0),
  ('ZAR-20', 'stoma-zarzadzanie', 'Popyt i podaż — analiza w gospodarce rzeczy i informacji', 20, 0),
  ('ZAR-21', 'stoma-zarzadzanie', 'Podmioty prawa — osoby fizyczne i prawne', 21, 0),
  ('ZAR-22', 'stoma-zarzadzanie', 'Istota i instrumenty marketingu', 22, 0),
  ('ZAR-23', 'stoma-zarzadzanie', 'Komunikacja marketingowa a promocja — narzędzia', 23, 0),
  ('ZAR-24', 'stoma-zarzadzanie', 'Badania marketingowe — cele, zakres, klasyfikacja', 24, 0),
  ('ZAR-25', 'stoma-zarzadzanie', 'Rola przedsiębiorców w gospodarce — praca przedsiębiorcy vs menedżera', 25, 0),
  ('ZAR-26', 'stoma-zarzadzanie', 'Motywacja w organizacji — teorie i systemy motywowania', 26, 0),
  ('ZAR-27', 'stoma-zarzadzanie', 'Proces komunikacji — zasady interpersonalne i ograniczenia', 27, 0),
  ('ZAR-28', 'stoma-zarzadzanie', 'Spółki prawa handlowego — rodzaje, tworzenie, organy', 28, 0),
  ('ZAR-29', 'stoma-zarzadzanie', 'Sprawozdanie finansowe — bilans, RZiS, rachunek przepływów', 29, 0),
  ('ZAR-30', 'stoma-zarzadzanie', 'Finanse publiczne — budżet, deficyt, polityka podatkowa', 30, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- Przedsiębiorczość — 30 tematów (PRZ-01 … PRZ-30)
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PRZ-01', 'stoma-przedsiebiorczosc', 'Metafory organizacji — istota, funkcje, przykłady', 1, 0),
  ('PRZ-02', 'stoma-przedsiebiorczosc', 'Elementy biznesplanu', 2, 0),
  ('PRZ-03', 'stoma-przedsiebiorczosc', 'Model 7S — zasoby i procesy w zarządzaniu', 3, 0),
  ('PRZ-04', 'stoma-przedsiebiorczosc', 'Proces badawczy — formułowanie problemu badawczego', 4, 0),
  ('PRZ-05', 'stoma-przedsiebiorczosc', 'Badania jakościowe vs ilościowe — cele, narzędzia, różnice', 5, 0),
  ('PRZ-06', 'stoma-przedsiebiorczosc', 'Modele biznesowe — rola przedsiębiorcy i menedżera', 6, 0),
  ('PRZ-07', 'stoma-przedsiebiorczosc', 'Przedsiębiorczość cyfrowa — definicja i konsekwencje', 7, 0),
  ('PRZ-08', 'stoma-przedsiebiorczosc', 'Społeczna odpowiedzialność biznesu (CSR)', 8, 0),
  ('PRZ-09', 'stoma-przedsiebiorczosc', 'Firma rodzinna — bariery wzrostu', 9, 0),
  ('PRZ-10', 'stoma-przedsiebiorczosc', 'Etapy rozwoju firmy rodzinnej — poziom rodziny i własność', 10, 0),
  ('PRZ-11', 'stoma-przedsiebiorczosc', 'System nadzoru w firmie rodzinnej', 11, 0),
  ('PRZ-12', 'stoma-przedsiebiorczosc', 'Sukcesja w firmie rodzinnej — czynniki sukcesu i porażki', 12, 0),
  ('PRZ-13', 'stoma-przedsiebiorczosc', 'Startup jako metodologia budowania firmy', 13, 0),
  ('PRZ-14', 'stoma-przedsiebiorczosc', 'Model uppsalski w umiędzynarodowieniu firmy', 14, 0),
  ('PRZ-15', 'stoma-przedsiebiorczosc', 'Formuły INCOTERMS (FOB, CIF, Ex Works)', 15, 0),
  ('PRZ-16', 'stoma-przedsiebiorczosc', 'Szablony modeli biznesowych — konstrukcja i praktyka', 16, 0),
  ('PRZ-17', 'stoma-przedsiebiorczosc', 'Bariera nowości (liability of newness)', 17, 0),
  ('PRZ-18', 'stoma-przedsiebiorczosc', 'Small business vs przedsiębiorczość dynamiczna', 18, 0),
  ('PRZ-19', 'stoma-przedsiebiorczosc', 'Przedsiębiorczość lokalna — specyfika i rola społeczno-gospodarcza', 19, 0),
  ('PRZ-20', 'stoma-przedsiebiorczosc', 'Podatek — konstrukcja, funkcje i klasyfikacja', 20, 0),
  ('PRZ-21', 'stoma-przedsiebiorczosc', 'Bootstrapping — strategia stania na własnych nogach', 21, 0),
  ('PRZ-22', 'stoma-przedsiebiorczosc', 'Formy finansowania przedsiębiorstw — zalety i wady', 22, 0),
  ('PRZ-23', 'stoma-przedsiebiorczosc', 'Klastry — istota, typologia, czynniki rozwoju', 23, 0),
  ('PRZ-24', 'stoma-przedsiebiorczosc', 'Forma prawna działalności a strategia rozwoju biznesu', 24, 0),
  ('PRZ-25', 'stoma-przedsiebiorczosc', 'Reguły komunikacji z otoczeniem przedsiębiorcy', 25, 0),
  ('PRZ-26', 'stoma-przedsiebiorczosc', 'Budowanie wizerunku przedsiębiorcy i firmy', 26, 0),
  ('PRZ-27', 'stoma-przedsiebiorczosc', 'Transformacja cyfrowa i skutki cyfryzacji', 27, 0),
  ('PRZ-28', 'stoma-przedsiebiorczosc', 'Rodzaje innowacji — rola w przedsiębiorstwie i gospodarce', 28, 0),
  ('PRZ-29', 'stoma-przedsiebiorczosc', 'Metody identyfikacji szans rynkowych', 29, 0),
  ('PRZ-30', 'stoma-przedsiebiorczosc', 'Proces tworzenia innowacji i techniki kreatywnego rozwiązywania problemów', 30, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
