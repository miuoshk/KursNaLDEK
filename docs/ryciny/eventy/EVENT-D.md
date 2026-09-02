# EVENT — PACZKA D (rangi i osiągnięcia), tura 2

Jeden atlas na cały zestaw: **Gray 1918**, zgodnie z §D zamówienia („Nie Black tu — spójność
z czaszką mistrza"). Jedna grubość kreski, `viewBox 0 0 64 64`, `fill="currentColor"`.
Wszystkie pozycje sprawdzone renderem przy **96 / 48 / 32 px** na `#002A27`.

## D1 — rangi (7/7 kompletne)

| id | motyw | tablica | bytes | gzip |
|---|---|---|---|---|
| rank-praktykant | siekacz mleczny | Gray1004 (uzębienie mleczne) | 8 328 | 3 874 |
| rank-asystent | kieł stały | Gray1002 | 10 102 | 4 752 |
| rank-rezydent-1 | przedtrzonowiec | Gray1002 | 8 054 | 3 783 |
| rank-rezydent-2 | trzonowiec — korona z guzkami | Gray1002 | 10 822 | 5 133 |
| rank-rezydent-3 | trzonowiec z korzeniami | Gray1002 | 17 588 | 8 111 |
| rank-specjalista | czaszka bok | **Gray188** | 38 148 | 16 568 |
| rank-mistrz | czaszka en face | **Gray190** | 32 847 | 14 430 |

**Progresja działa wizualnie:** ząb mleczny → kieł → przedtrzonowiec → korona trzonowca →
trzonowiec z korzeniami → czaszka z boku → czaszka na wprost. Rośnie i złożoność obiektu,
i „powaga" — dokładnie tak, jak ma działać drabinka rang. Pięć pierwszych waży **poniżej 9 KB gzip**.

Dwie czaszki są cięższe (16,5 i 14,4 KB), bo mają wewnętrzną kreskę szwów i zębów — przy 32 px
nadal czytelne, sprawdziłem.

## D2 — osiągnięcia (10 z 12)

| id | motyw | tablica | bytes | gzip |
|---|---|---|---|---|
| ach-pierwsza-sesja | pojedynczy siekacz | Gray1002 | 11 651 | 5 394 |
| ach-setka | siekacz boczny | Gray1002 | 9 647 | 4 570 |
| ach-tysiac | pełny łuk zębowy | Gray 1918 (tura 1) | 12 887 | 5 739 |
| ach-maraton | kręgosłup | Gray 1918 (tura 1) | 9 760 | 4 478 |
| ach-perfekcyjna-sesja | przedtrzonowiec, czysty kontur | Gray1002 | 12 166 | 5 659 |
| ach-snajper | tęczówka i źrenica od przodu | Gray0878 | 29 111 | 12 561 |
| ach-tygodniowy-rytm | odcinek szyjny, 7 kręgów | Gray 1918 (tura 1) | 6 018 | 2 928 |
| ach-miesieczna-dyscyplina | dłoń | Gray0608 | 55 340 | 23 500 |
| ach-kwartalna-konsekwencja | klatka piersiowa | Gray0621 | 91 830 | 39 433 |
| ach-nocny-maratonczyk | przekrój gałki ocznej | **Gray869** | 48 876 | 21 092 |

### Zamiany świadome

- **ach-pierwsza-sesja** — zamówienie chciało „otwarte kleszcze / pierwszy ząb". Kleszcze są
  u Huntera, nie u Graya, a mieszania atlasów w zestawie D zabrania §D. Wziąłem pierwszy ząb.
- **ach-snajper** to **tęczówka od przodu**, nie przekrój — okrągła, z centralną źrenicą, czyta się
  jak celownik. Przekrój dałem `ach-nocny-maratonczyk`, żeby te dwa nie były bliźniakami.

### NIE zrobione (2 z 12)

| id | dlaczego |
|---|---|
| **ach-wszechstronny** („czaszka + klatka, całość") | Nie ma w zestawie planszy pokazującej jedno i drugie razem. Próbowałem podstawy czaszki (Gray187) przy `turdsize` 140 i 300 — przy 64 px wychodzi nieczytelna plątanina, odrzucone po QA. Potrzebny **szkielet całej postaci**, którego w Grayu z Commons nie ma w użytecznej rozdzielczości. |
| **ach-wczesny-ptak** („małżowina uszna albo tęczówka") | Tęczówkę zużyłem na `ach-snajper`, a **plansz ucha w zestawie nie ma** (są tylko embrionalne pęcherzyki słuchowe). Nie podstawiam trzeciego oka, bo trzy okrągłe ikony w jednym zestawie 12 osiągnięć to już bełkot wizualny. |

### Uwaga o wagach

Trzy pozycje są grubo powyżej celu 15 KB dla emblematu: `ach-kwartalna-konsekwencja` (39 KB),
`ach-miesieczna-dyscyplina` (23,5 KB) i `ach-nocny-maratonczyk` (21 KB). To obiekty o dużej ilości
kreski wewnętrznej — żebra, ścięgna dłoni, warstwy gałki ocznej. Podnoszenie `turdsize` powyżej
tych wartości zjada rozpoznawalność (testowałem: dłoń przy `turdsize 300` przestaje być dłonią).
Trzy pozostałe czaszkowo-oczne siedzą w 12–17 KB, a pięć zębów w 3,8–8,1 KB.

## Parametry

Wspólne: `channel=max` (tablice Graya z Commons są kolorowane — patrz EVENT-I §2),
`t2 48`, `gamma 0.75`, `radius 4`, `threshold 175`, canvas 900, `zoom 0.94`, kadr wycentrowany.
`t1` 8–26 i `turdsize` 40–200 dobierane per pozycja — pełne wartości w `work/rep_CD.json`.

## Źródło i licencja

Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Tablice Gray188, Gray190, Gray309, Gray869, Gray187, Gray1004 — skany Wikimedia Commons
(pobrane w tej turze do `ryciny_zrodla/gray/`, każdy z `.meta.json` i licencją).
Gray1002, Gray0608, Gray0621, Gray0878 — skany UNSW Embryology.
