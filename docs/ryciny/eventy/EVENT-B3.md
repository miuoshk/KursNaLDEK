# EVENT — PACZKA B3 (404 i empty states), tura 2 — CZĘŚCIOWA

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| empty-404-missing-tooth | empty-404-missing-tooth.svg | Gray 1918, łuk zębowy | 0 0 256 256 | 27 274 | 11 458 | currentColor | tura 1 — **bez luki** |
| empty-404-missing-tooth-gap | empty-404-missing-tooth-gap.svg | Gray 1918, **Gray1003** (uzębienie dolne w zębodołach, bok) | 0 0 256 256 | 49 173 | 20 827 | currentColor | **nowe — Z LUKĄ** |
| empty-session | empty-session.svg | Gray 1918, **Gray0182** (żuchwa **bezzębna**) | 0 0 128 128 | 37 819 | 15 834 | currentColor | **TAK** |
| empty-reviews | empty-reviews.svg | Gray 1918, **Gray0184** (żuchwa z uzębieniem, zwarta) | 0 0 128 128 | 28 367 | 12 446 | currentColor | **TAK** |
| empty-stats | empty-stats.svg | Gray 1918, kręgosłup | 0 0 128 128 | 9 761 | 4 479 | currentColor | nie (tura 1) |

## 404 — luka wreszcie jest

Tura 1 oddała łuk **bez** wyciętego zęba, bo wybór zęba to decyzja projektowa. Zrobiłem to teraz inaczej,
niż planowaliśmy: zamiast wycinać ząb z gotowego wektora (co daje szarpaną dziurę), **zamalowałem jeden
ząb bielą na skanie, PRZED ekstrakcją tuszu** — potrace nigdy go nie zobaczył, więc luka ma naturalne
krawędzie zębodołu, a nie ślad po gumce. Ząb: drugi od przodu w dolnym łuku, widok boczny.

Zostawiam **oba pliki** — wersję z tury 1 (czysty łuk, 11 KB, ładniejsza jako ornament) i nową z luką
(21 KB, czytelna narracyjnie). Wybierz, którą wstawiasz; nie kasuję niczego za Ciebie.
Czytelność luki: oczywista od ~128 px, przy 64 px jeszcze widoczna, przy 32 px ginie — 404 wyświetlasz
duże, więc to nie problem, ale nie używaj tego pliku jako ikony w nawigacji.

## Empty states — zamienniki

- **empty-session** („puste zębodoły"): **Gray0182 to żuchwa bezzębna** — czyli dosłownie puste
  zębodoły, nie metafora. Trafienie w zamówienie co do słowa. Czyta się przy 32 px.
- **empty-reviews** („cisza, zamknięte szczęki"): żuchwa z pełnym uzębieniem, spokojny kontur.
  Czaszki w zestawie nie ma, więc zamiast niej szczęka — sens „cisza / nic do zrobienia" zostaje.
  **12,4 KB gzip, najczystszy emblemat paczki.**

## NIE zrobione i dlaczego

| id | blokada |
|---|---|
| empty-404-dentist, scene-*, onboarding-welcome | wymaga **Huntera / Rowlandsona (Wellcome)** — satyra dentystyczna. W zestawie Graya jej nie ma i nie da się jej podrobić anatomią. |
| empty-achievements („czaszka en face bez wieńca") | wymaga czaszki od przodu. Brak. Nie podstawiam żuchwy, bo to już byłoby oszustwo wobec sensu ikony. |
| empty-saved | „rama tablicy atlasu + mały ząb" — rama to element graficzny, nie anatomiczny; pojedynczy ząb mam (Gray1002), ale sama rama wymaga innego źródła. |
| onboarding-track-lek („serce kontur", 96 px) | **wyprodukowałem i odrzuciłem po QA.** Serce z Gray0492 przy 96 px to plama — sprawdziłem przy 128/64/32 px, na żadnym rozmiarze nie czyta się jako serce. Potrzebny czysty kontur serca (Gray490/491 hi-res), nie plansza z naczyniami wieńcowymi. |

Źródło: Gray 1918, domena publiczna. Skan: UNSW Embryology.
