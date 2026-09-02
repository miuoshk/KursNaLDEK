# EVENT — PACZKA F (przedmioty LDEW), tura 2

Atlas: **Gray 1918** na całą paczkę. Zamówienie dawało wybór „Gray **albo** Black". Wybrałem Graya
i uzasadniam to niżej — to była realna decyzja, nie domyślna.

## 1. Emblematy — 11 z 12

| id | motyw | tablica | viewBox | bytes | gzip |
|---|---|---|---|---|---|
| ldew-zachowawcza | ząb w przekroju podłużnym z komorą miazgi | Gray1005 | 0 0 64 64 | 59 467 | 25 411 |
| ldew-endodoncja | **trzonowiec w przekroju z kanałami korzeniowymi** | Gray1006 | 0 0 64 64 | 57 340 | 23 828 |
| ldew-periodontologia | ząb w zębodole, kość gąbczasta wokół korzenia | Gray1003 | 0 0 64 64 | 31 012 | 13 699 |
| ldew-sluzowka | jama ustna: podniebienie, łuki, język | Gray1014 | 0 0 64 64 | 39 852 | 17 523 |
| ldew-pedo | uzębienie mieszane — mleczne + zawiązki stałych | Gray1000 | 0 0 64 64 | 65 231 | 27 777 |
| ldew-ortodoncja | oba łuki w zwarciu, widok od przodu | Gray1001 | 0 0 64 64 | 52 257 | 22 881 |
| ldew-protetyka | **żuchwa bezzębna** | Gray0182 | 0 0 64 64 | 21 153 | 9 445 |
| ldew-chirurgia | żuchwa uzębiona, okolica trzonowców | Gray0184 | 0 0 64 64 | 20 518 | 9 152 |
| ldew-chst | oczodół — ściana przyśrodkowa | Gray192 | 0 0 64 64 | 39 616 | 17 441 |
| ldew-radiologia | czaszka bok (projekcja boczna) | Gray188 | 0 0 64 64 | 44 278 | 19 070 |
| ldew-orzecznictwo | czaszka en face („identyfikacja") | Gray190 | 0 0 64 64 | 35 252 | 15 399 |

## 2. Tła kart — 11, komplet do emblematów

`ldew-card-*`, `viewBox 0 0 800 600`, szałwia, ten sam obiekt w luźniejszym kadrze,
kotwica prawo-dół, obiekt wychodzi poza kartę. **Wszystkie mieszczą się w celu <80 KB gzip**
(17,8–42,9 KB). Najcięższa: `ldew-card-sluzowka` 42,9 KB. Najlżejsza: `ldew-card-chirurgia` 17,8 KB.

## 3. Dlaczego Gray, a nie Black

Black leżał gotowy — 176 stron w 400 ppi, najlepszy atlas zębów jaki istnieje. Mimo to:

1. **Gray pokrywa 11 z 12 przedmiotów LDEW jednym atlasem.** Black pokrywa zęby znakomicie, ale
   nie ma czaszki en face, podstawy czaszki ani oczodołu — a to trzy pozycje z tej paczki
   (`orzecznictwo`, `chst`, `radiologia`). Przy Blacku musiałbym albo złamać zasadę jednego atlasu,
   albo oddać Ci trzy dziury.
2. **Spójność z paczką D.** Rangi i osiągnięcia są z Graya i siedzą w tym samym interfejsie co kafle
   przedmiotów. Gdyby F było z Blacka, użytkownik zobaczyłby na jednym ekranie dwie różne ręce
   rytownicze — grubszą kreskę Blacka obok cieńszej Graya. To jest dokładnie ten rodzaj niespójności,
   przed którym ostrzega §0 zamówienia.

**Black nie idzie do kosza** — zamówienie wymaga go wprost w paczce G-Black (zęby wg klas:
korona / korzeń / przekrój dla ośmiu klas). Tam wejdzie w całości i tam jego 400 ppi się opłaci.

## 4. Trafienia i kompromisy

**Trafienia co do słowa:** `ldew-endodoncja` to naprawdę trzonowiec w przekroju z widocznymi
kanałami korzeniowymi — czyta się przy 32 px. `ldew-protetyka` to naprawdę **żuchwa bezzębna**,
nie „żuchwa udająca bezzębną". `ldew-pedo` to uzębienie mieszane z zawiązkami zębów stałych
w kości, czyli dokładnie „ząb mleczny vs zawiązek stałego" z zamówienia.

**Świadome dublowanie źródeł.** Trzy pozycje dzielą tablicę z paczką D: `ldew-radiologia` z
`rank-specjalista` (Gray188), `ldew-orzecznictwo` z `rank-mistrz` (Gray190), a `ldew-protetyka`
z `empty-session` (Gray0182). To nie jest niedopatrzenie — w atlasie jest jedna czaszka i jedna
żuchwa bezzębna, a te pozycje żyją w różnych miejscach aplikacji (kafel przedmiotu vs odznaka vs
empty state). Kadry są różne. Jeśli Cię to uwiera na produkcji, powiedz — przekadruję.

**`ldew-chst`** to oczodół, nie podstawa czaszki. Zamówienie dopuszczało oba („czaszka podstawa /
oczodół"). Podstawę (Gray187) wyprodukowałem i **odrzuciłem po QA** — przy 64 px to nieczytelna
plątanina otworów, testowałem przy `turdsize` 70, 140 i 300.

## 5. NIE zrobione

| id | dlaczego |
|---|---|
| **ldew-zdrowie-pub** („szkielet całej postaci — populacja") | Trzeci raz ta sama blokada: **w Grayu z Commons nie ma szkieletu całej postaci** w użytecznej rozdzielczości. Nie podstawiam klatki piersiowej, bo „populacja" wymaga sylwetki człowieka, a żebra to nie sylwetka. Potrzebny Albinus (*Tabulae sceleti et musculorum*) albo Bourgery — i wtedy jedną planszą załatwiam też `hero-knnp-skeleton`, `ach-kwartalna-konsekwencja` i `ach-wszechstronny`. **To jest teraz najbardziej opłacalny pojedynczy plik do dociągnięcia w całym zleceniu.** |

## 6. Błąd techniczny, który znalazłem i naprawiłem

Przy tej paczce wyszło, że **scour skraca `1000` do zapisu naukowego `1e3`**, a mój podmieniacz
`viewBox` miał regex `[\d.]+`, który tego nie łapał. Efekt: pliki generowane z płótnem 1000 px
zostawały z `viewBox="0 0 1e3 1e3"` i `width="1e3pt"` zamiast docelowego rozmiaru.

Dotknęło to **19 plików**: 11 emblematów tej paczki i **8 gwiazdozbiorów z paczki I,
które już Ci wysłałem**. Wszystkie poprawione — przeliczyłem skalę z istniejącego `viewBox`,
bez ponownego trace'owania, więc geometria jest identyczna. **Pobierz `sky-constellation-01…08`
jeszcze raz**, wersje z poprzedniej tury mają zły `viewBox`.

Przy okazji przepuściłem **wszystkie 93 SVG** przez walidator: zero rastra, zero fontów, zero
`<text>`, każdy `viewBox` zgodny ze specyfikacją. Czysto.

## 7. Parametry

Wspólne: `channel=max`, `t2 48`, `gamma 0.75`, `radius 4`, `threshold 175`, OCR `--psm 11` conf 22
(wyłączony dla tablic fotograficznych Gray1000/1001, gdzie OCR wykrywał „tekst" w szarościach zdjęcia
i wycinał białe prostokąty). Emblematy: canvas 1000, `zoom 0.94`. Karty: canvas 1400, `zoom 1.16–1.30`.
`t1` 10–26, `turdsize` 26–110 per pozycja — pełne wartości w `work/rep_F.json` i `work/rep_Fcards.json`.

## 8. Źródło i licencja

Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Tablice Gray188, Gray190, Gray192, Gray1001 — Wikimedia Commons (`ryciny_zrodla/gray/`, z `.meta.json`).
Tablice Gray0182, Gray0184, Gray1000, Gray1003, Gray1005, Gray1006, Gray1014 — UNSW Embryology.
