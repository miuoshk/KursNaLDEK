-- ============================================================
-- LDEW — Protetyka stomatologiczna: 28 tematów (PRO-01 … PRO-28)
-- Przedmiot ldew-protetyka musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PRO-01', 'ldew-protetyka', 'Protetyka stomatologiczna jako dziedzina współczesnej nauki i praktyki medycznej', 1, 0),
  ('PRO-02', 'ldew-protetyka', 'Układ stomatognatyczny (US) - wzajemne relacje morfologii i czynności', 2, 0),
  ('PRO-03', 'ldew-protetyka', 'Anatomia i topografia elementów składowych układu stomatognatycznego o szczególnym znaczeniu dla praktyki protetycznej', 3, 0),
  ('PRO-04', 'ldew-protetyka', 'Elementy fizjologii jamy ustnej w aspekcie protetyki', 4, 0),
  ('PRO-05', 'ldew-protetyka', 'Stany artykulacyjne żuchwy w warunkach normy morfologiczno-funkcjonalnej', 5, 0),
  ('PRO-06', 'ldew-protetyka', 'Zmiany w układzie stomatognatycznym związane z wiekiem i utratą zębów', 6, 0),
  ('PRO-07', 'ldew-protetyka', 'Estetyka twarzy jako jeden z celów leczenia protetycznego', 7, 0),
  ('PRO-08', 'ldew-protetyka', 'Psychologiczne aspekty leczenia protetycznego', 8, 0),
  ('PRO-09', 'ldew-protetyka', 'Diagnostyka i wskazania do leczenia protetycznego', 9, 0),
  ('PRO-10', 'ldew-protetyka', 'Planowanie leczenia i zabiegi przygotowawcze oraz przykłady leczenia etapowego w przypadkach trudnych', 10, 0),
  ('PRO-11', 'ldew-protetyka', 'Procedury zabiegowe - wyciski, płaszczyzna protetyczna, zwarcie centralne oraz przenoszenie danych klinicznych na modele', 11, 0),
  ('PRO-12', 'ldew-protetyka', 'Charakterystyka ogólna podstawowych konstrukcji protetycznych', 12, 0),
  ('PRO-13', 'ldew-protetyka', 'Procedury zabiegowe w protetyce protez stałych', 13, 0),
  ('PRO-14', 'ldew-protetyka', 'Leczenie protetyczne z zastosowaniem ruchomych protez częściowych', 14, 0),
  ('PRO-15', 'ldew-protetyka', 'Rehabilitacja protetyczna pacjentów bezzębnych z zastosowaniem protez całkowitych', 15, 0),
  ('PRO-16', 'ldew-protetyka', 'Specyfika leczenia protetycznego pacjentów w wieku rozwojowym', 16, 0),
  ('PRO-17', 'ldew-protetyka', 'Implantoprotetyczna metoda rekonstrukcji uzębienia', 17, 0),
  ('PRO-18', 'ldew-protetyka', 'Mikrobiologiczne aspekty leczenia protetycznego i profilaktyka przeciwzakaźna', 18, 0),
  ('PRO-19', 'ldew-protetyka', 'Stomatopatie protetyczne - diagnostyka i leczenie', 19, 0),
  ('PRO-20', 'ldew-protetyka', 'Patologiczne starcie zębów', 20, 0),
  ('PRO-21', 'ldew-protetyka', 'Okluzja urazowa - zaburzenia okluzyjne', 21, 0),
  ('PRO-22', 'ldew-protetyka', 'Dysfunkcje układu stomatognatycznego', 22, 0),
  ('PRO-23', 'ldew-protetyka', 'Zasady profilaktyki periodontologicznej w postępowaniu protetycznym', 23, 0),
  ('PRO-24', 'ldew-protetyka', 'Zasady współpracy zespołu kliniczno-laboratoryjnego', 24, 0),
  ('PRO-25', 'ldew-protetyka', 'Pracownia techniki dentystycznej i nowe technologie laboratoryjnego wykonawstwa uzupełnień protetycznych', 25, 0),
  ('PRO-26', 'ldew-protetyka', 'Kliniczne i laboratoryjne materiały protetyczne', 26, 0),
  ('PRO-27', 'ldew-protetyka', 'Tkankowa reaktywność na protezy i materiały protetyczne', 27, 0),
  ('PRO-28', 'ldew-protetyka', 'Kliniczne aspekty technicznego wykonawstwa uzupełnień protetycznych', 28, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
