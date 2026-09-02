# EVENT — PACZKA L (OpenGraph 1200×630), tura 2

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| og-ldek | og-ldek.svg | Gray 1918, podniebienie + łuk górny | 0 0 1200 630 | 40 160 | 17 335 | gold | nie (tura 1) |
| og-ldew | og-ldew.svg | Gray 1918, **Gray0185** (żuchwa bok) | 0 0 1200 630 | 20 542 | 9 115 | gold | nie |
| og-knnp | og-knnp.svg | Gray 1918, **Gray0599** (rdzeń kręgowy z korzeniami) | 0 0 1200 630 | 54 044 | 22 925 | gold | **TAK** |

## Uwagi

- Wszystkie trzy trzymają układ z zamówienia: **obiekt po prawej, lewe ~55% kadru puste pod napis**.
  Kotwice: og-ldew `x 0.94`, og-knnp `x 0.86` (rdzeń jest wąski, więc siedzi trochę bliżej środka,
  żeby nie wypadł za krawędź).
- **og-ldew to najlżejszy plik całej tury: 9,1 KB gzip.** Czysty kontur żuchwy, zero podpisów.
- **og-knnp** dziedziczy zamiennik z `hero-knnp-skeleton` — to rdzeń kręgowy, nie szkielet całej postaci.
  Uzasadnienie w EVENT-A1 §2. Przy kadrze 1200×630 wygląda jak pionowa oś po prawej stronie i działa,
  ale to nadal nie jest sylwetka człowieka.
- **og-antares** z zamówienia **NIE zrobiony** — wymaga atlasu nieba (Cellarius/Flamsteed), którego nie ma.
- OG dziś jest generowany w `app/opengraph-image.tsx` jako czyste typo na `#002A27`. Te SVG wchodzą
  jako warstwa tła po prawej; złoto na OG to jedyne złoto w kadrze, tytuł zostaje kremowy.

Źródło: Gray 1918, domena publiczna. Skan: UNSW Embryology.
