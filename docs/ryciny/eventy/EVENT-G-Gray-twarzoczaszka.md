# EVENT — PACZKA G-Gray, część 1: twarzoczaszka (19 pozycji), tura 2

Atlas: **Gray 1918**. Każda pozycja w **dwóch plikach**: tło sekcji/karty w szałwii (`<id>.svg`,
viewBox 1000–1400 px) i emblemat `currentColor` 64 px (`<id>-mark.svg`). **38 plików.**

Zamówienie: „Dla każdej pozycji G-Gray daj OBA (tło + emblemat), chyba że obiekt ginie przy 64 px —
wtedy tylko tło i napisz to w evencie". Wszystkie 19 przeszły QA przy 64 px, żadnej nie musiałem
zdegradować do samego tła.

## Zawartość

| id | motyw | tablica |
|---|---|---|
| anat-skull-lat | czaszka bok | Gray188 |
| anat-skull-front | czaszka en face | Gray190 |
| anat-skull-base | podstawa czaszki, powierzchnia zewnętrzna | Gray187 |
| anat-orbit | oczodół — ściana przyśrodkowa | Gray192 |
| anat-maxilla | szczęka, powierzchnia zewnętrzna | Gray157 |
| anat-mandible-lat | żuchwa bok | Gray0184 |
| anat-mandible-front | oba łuki od przodu w zwarciu | Gray1001 |
| anat-tmj | staw skroniowo-żuchwowy z panewką | Gray309 |
| anat-trigeminal | nerw trójdzielny — V1/V2/V3 | Gray778 |
| anat-facial-n | nerw twarzowy z gałęziami | Gray0781 |
| anat-cranial-nerves | schemat nerwów czaszkowych | Gray0788 |
| anat-salivary | ślinianka przyuszna | Gray1022 |
| anat-masseter | żuchwa z przyczepem żwacza | Gray0176 |
| anat-mimic | mięśnie i nerwy twarzy, profil | Gray0790 |
| anat-tongue | język z mięśniami | Gray1019 |
| anat-palate-line | podniebienie i łuki — jama ustna | Gray1014 |
| anat-deciduous-arch | uzębienie mleczne, komplet | Gray1004 |
| anat-permanent-arch | uzębienie stałe, komplet | Gray1002 |
| anat-vessels-head | naczynia i węzły głowy oraz szyi | Gray0602 |

## Uwagi

- **`anat-permanent-arch` i `anat-deciduous-arch`** to *komplety zębów w rzędzie*, nie łuki w kości.
  W Grayu nie ma planszy pokazującej pełny łuk zębowy od strony zgryzu — Gray1002 i Gray1004
  pokazują wszystkie zęby danego uzębienia obok siebie. Merytorycznie to jest „uzębienie stałe"
  i „uzębienie mleczne", tylko w innym układzie niż sugerowała nazwa ID.
- **`anat-vessels-head`** to plansza limfatyczna głowy i szyi (naczynia + węzły), nie tętnice.
  Czystej planszy tętnic głowy w zestawie nie ma. Jako tło sekcji przy `op 0.18` różnica jest
  niewidoczna, ale jako materiał merytoryczny — to limfa.
- **Dublowanie z innymi paczkami jest tu regułą, nie wyjątkiem.** G-Gray jest z założenia
  „biblioteką atlasu": te same tablice, które w paczkach D, E i F dostały konkretne role
  (ranga, przedmiot, kafel LDEW), tutaj występują pod swoimi anatomicznymi nazwami i w innych
  kadrach oraz rozmiarach. To jest zamierzone — Cursor ma mieć dostęp do obiektu anatomicznego
  niezależnie od tego, gdzie akurat użyto go jako odznaki.
- **`anat-skull-base`** i **`anat-salivary`** wymagały drugiego podejścia: przy pierwszym przebiegu
  `turdsize` 140 zjadał podstawę czaszki do strzępów, a kadr ślinianki wychodził poza obraz
  (Gray1022 ma tylko 629×400 px). Obie poprawione i sprawdzone renderem.

## Parametry

Wspólne: `channel=max`, `t2 48`, `gamma 0.75`, `radius 4`, `threshold 175`, OCR conf 22
(wyłączony dla tablic fotograficznych Gray1001 i dla kompletów zębów Gray1002/1004).
Tła: canvas 1400, `zoom 1.04`, `turdsize` 35–50. Emblematy: canvas 1000, `zoom 0.94`,
`turdsize` 50–140. `t1` 10–18 per pozycja — pełne wartości w `work/rep_GGh.json`.

Źródło: Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Commons (`ryciny_zrodla/gray/`) i UNSW Embryology.
