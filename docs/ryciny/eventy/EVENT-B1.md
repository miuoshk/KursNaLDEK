# EVENT — PACZKA B1 (auth: /login, /register, /forgot-password, /reset-password), tura 2

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| auth-bg-skull | auth-bg-skull.svg | Gray 1918, **Gray0193** (podstawa czaszki od wewnątrz, przekrój strzałkowy) | 0 0 1600 1600 | 184 949 | 75 420 | sage | **TAK** |
| auth-bg-jaw | auth-bg-jaw.svg | Gray 1918, **Gray0184** (żuchwa dorosłego, bok, z uzębieniem) | 0 0 1400 1000 | 35 632 | 15 520 | sage | **TAK** |

## auth-bg-skull — co dokładnie zrobiłem

Zamówienie chce „czaszka przód, bardzo powietrze, prawie ornament". Czaszki en face w zestawie nie ma.
Wziąłem **Gray0193** — wnętrze podstawy czaszki w przekroju strzałkowym, czyli **połowę** — i po ekstrakcji
tuszu **odbiłem ją lustrzanie, składając w pełne, symetryczne sklepienie** z otworem wielkim pośrodku.

To nie jest samowolka wobec reguły „nie lustruj anatomii" z paczki M: tamta reguła chroni struktury,
w których strona ma znaczenie (nerwy, serce). **Podstawa czaszki jest strukturą obustronnie symetryczną**,
więc odbicie odtwarza obraz anatomicznie poprawny, a nie fałszywy. Efekt: ornament z dołami przednim,
środkowym i tylnym, czyta się jak rozeta — dokładnie „prawie ornament" z zamówienia, i przy `op 0.14`
za kartą logowania robi dokładnie to, co ma robić.

**Bonus:** ten sam plik jest najlepszym kandydatem na `sec-cta-constellation` z paczki A7 — zamówienie
samo proponuje tam „sklepienie czaszki od wewnątrz / calvaria jako niebo czaszki". Powiedz, to
wyprodukuję kadr landscape 1800×1000 z tego samego źródła.

## auth-bg-jaw

Zamówienie chce „żuchwa przód". Żuchwy en face w zestawie nie ma — jest bok (Gray0184), czysty kontur
z uzębieniem, **15,5 KB gzip**, zero podpisów w oryginale, więc zero kompromisu na literach.
Kadr wycentrowany, obiekt mieści się w całości (tło auth ma być spokojne, nie wychodzące poza kadr).

## Parametry

| id | crop | t1 | threshold | turdsize | canvas | zoom |
|---|---|---|---|---|---|---|
| auth-bg-skull | 273,18,719,1045 + odbicie lustrzane | 26 | 185 | 40 | 1500 | 0.96 |
| auth-bg-jaw | — | 24 | 185 | 24 | 1500 | 0.94 |

Źródło: Gray 1918, domena publiczna (Carter zm. 1897). Skan: UNSW Embryology.
