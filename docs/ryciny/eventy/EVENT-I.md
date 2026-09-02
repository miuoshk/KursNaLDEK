# EVENT — PACZKA I (niebo: ZENIT / ANTARES / KALIBRA), tura 2

Atlas: **Andreas Cellarius, *Harmonia Macrocosmica*, wyd. 1708** — jeden atlas na całą paczkę,
zgodnie z §0 zamówienia. Flamsteeda nie ruszałem.

## 1. Dostarczone

| id | plik | tablica (strona skanu) | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|---|---|
| sky-zenit | sky-zenit.svg, -currentColor.svg | s. 176 — *Planisphaerium Copernicanum*, Słońce w centrum z promieniowaniem i pierścieniem zodiaku | 0 0 1800 1200 | 378 712 | 158 390 | gold / currentColor |
| sky-antares | sky-antares.svg, -currentColor.svg | s. 409 — *Hemisphaerium Boreale*, wycinek ze **Skorpionem** (podpis SCORPIVS w kadrze) | 0 0 1600 1200 | 271 828 | 112 303 | sage / currentColor |
| sky-kalibra | sky-kalibra.svg, -currentColor.svg | s. 249 — sfera armilarna z pierścieniem HORIZON | 0 0 1400 1400 | 210 791 | 90 404 | sage / currentColor |
| sky-grid | sky-grid.svg, -currentColor.svg | s. 262 — podwójna półkula z pełną siatką południków i równoleżników | 0 0 1600 1600 | 172 427 | 74 437 | sage / currentColor |
| sky-rose | sky-rose.svg, -currentColor.svg | s. 312 — diagram aspektów, promienie z centrum | 0 0 1400 1400 | 165 806 | 70 379 | sage / currentColor |
| sky-cellarius-full | sky-cellarius-full.svg | s. 409 — pas półkuli północnej, kadr 1800×1000 pod OG/CTA | 0 0 1800 1000 | 294 912 | 120 422 | sage |
| sky-constellation-01…08 | 8 plików | s. 409 — osiem różnych kadrów z gwiazdozbiorami (m.in. Ursa Maior, Aquila) | 0 0 1000 1000 | 152–204 KB | 63–84 KB | sage |
| mode-przeglad | mode-przeglad.svg | s. 312 — centrum róży aspektów | 0 0 64 64 | 21 267 | 10 117 | currentColor |
| mode-katalog | mode-katalog.svg | s. 262 — fragment siatki z gwiazdami | 0 0 64 64 | 29 659 | 13 746 | currentColor |
| mark-zenit-labs | mark-zenit-labs.svg | s. 312 — gwiazda w centrum | 0 0 64 64 | 50 099 | 22 315 | currentColor |

Contact sheet: `sheet-I.png` (opacity docelowe) i `sheet-I-op1.png` (kontrola kreski).

## 2. Przełom techniczny — ekstrakcja po kanale maksimum

Tablice Cellariusa są **ręcznie kolorowane**. Pierwsze podejście standardowym pipeline'em (konwersja
na skalę szarości → high-pass) dało to samo, co zabiło drafty w turze 1: **została sama typografia
i parę łuków, cała kreska rytownicza zniknęła** — bo po grayscale lawowanie barwne bywa ciemniejsze
niż cienka linia.

Rozwiązanie: zamiast `convert('L')` biorę **maksimum z kanałów RGB**. Czarny tusz jest ciemny
we *wszystkich* trzech kanałach, więc przeżywa; barwna laserunek jest jasny w co najmniej jednym,
więc po maksimum staje się prawie biały i wypada. Różnica jest drastyczna — z 12 KB szczątków
zrobiło się 260 KB pełnej kreski rytowniczej.

To jest w `tools/plate.py` jako `channel='max'` i **należy tego używać do każdej ręcznie kolorowanej
planszy** — także gdyby wróciły kolorowane tablice Graya.

## 3. Kompromisy — czytaj, zanim wdrożysz

**Wagi są powyżej celu z zamówienia.** Cel to gzip < 80 KB dla teł; trzymają się w nim tylko
`sky-grid` (74 KB), `sky-rose` (70 KB) i większość gwiazdozbiorów (63–78 KB). Poza celem:
`sky-zenit` **158 KB**, `sky-cellarius-full` 120 KB, `sky-antares` 112 KB, `sky-kalibra` 90 KB.
Zbijałem to `turdsize` do granicy — przy wyższych wartościach mapa nieba przestaje być mapą nieba
i zostaje kilka łuków (testowałem `turdsize 110` na `sky-zenit`: plik 24 KB i pusty kadr).
To jest realny wybór między wagą a tym, żeby rycina cokolwiek przedstawiała. Żaden plik nie przekracza
twardego limitu 400 KB. Jeśli waga uwiera na produkcji — powiedz, wytnę węższe kadry (mniej mapy,
więcej powietrza), to zbije pliki o połowę bez utraty czytelności.

**Liter nie da się zdjąć.** Na mapie nieba napisy (nazwy gwiazdozbiorów, „EQVATOR", „HORIZON",
skala stopni) są **grawerowane w tę samą płytę co rysunek** i biegną po łukach. To nie są podpisy
zewnętrzne jak u Graya — to część ryciny. OCR ich nie łapie (tekst po okręgu), a ręczne wycięcie
zniszczyłoby siatkę pod spodem. Przy docelowych `op 0.22–0.30` czytają się jako faktura, nie jako tekst
— i szczerze mówiąc, na mapie nieba to wygląda dobrze. Ale formalnie **zasada „zero liter" jest tu złamana**
i musisz o tym wiedzieć, zanim Cursor to wstawi.

**Dwa emblematy odrzucone po QA:**
- `mode-inteligentna` (Skorpion jako znak 64 px) — sprawdziłem przy 128/64/32 px, na każdym rozmiarze
  to plama. Figura Skorpiona u Cellariusa jest zbyt gęsto kreskowana, żeby zejść do ikony.
  Użyj `sky-antares` jako tła sekcji, a jako znak trybu weź Lucide — albo daj mi prostszy motyw.
- `mark-zenit-labs` — **dostarczam, ale z ostrzeżeniem**: przy 64 px czyta się jako gwiazda,
  przy 32 px rozpada się. 22 KB gzip to też dużo jak na emblemat (cel < 15 KB). Zostawiam decyzję Tobie.

`mode-przeglad` (10 KB) i `mode-katalog` (13,7 KB) przeszły QA — czytają się przy 64 px, przy 32 px
jeszcze rozpoznawalne.

## 4. Parametry

Wspólne dla całej paczki: `channel=max`, `t1 8`, `t2 45`, `gamma 0.75`, `radius 5`, `threshold 170`,
upscaling ×2, `alphamax 1.0`, `opttolerance 0.4`, scour `--set-precision=3`.

| id | crop (px oryginału) | turdsize | canvas |
|---|---|---|---|
| sky-zenit | 560,480,2760,1950 | 45 | 1900 |
| sky-antares | 1950,1400,2800,2200 | 210 | 1400 |
| sky-kalibra | 620,280,2700,2480 | 130 | 1400 |
| sky-grid | 700,430,2620,2370 | 95 | 1400 |
| sky-rose | 700,300,2680,2470 | 70 | 1500 |
| sky-cellarius-full | 330,700,2900,2130 | 110 | 1900 |
| sky-constellation-01…08 | 8 kadrów z pl409 | 110 | 1000 |
| mode-przeglad / mode-katalog / mark-zenit-labs | kadry centralne | 240 / 260 / 90 | 800 |

## 5. Źródło i licencja

Cellarius, Andreas (1596–1665). *Harmonia Macrocosmica Seu Atlas Universalis Et Novus*, wyd. 1708.
**Public Domain Mark.** Skan: e-rara.ch (ETH-Bibliothek Zürich) — https://www.e-rara.ch/zut/content/titleinfo/18789590
Pełny skan liczy 460 stron; 29 plansz zidentyfikowałem i wyrenderowałem w 150 dpi (~3300×2770 px)
do `ryciny_zrodla/sky/plates/` — reszta paczki I i ewentualne nowe kadry mogą iść z tego samego zapasu
bez ponownego pobierania.

## 6. Co dalej z nieba

Nietknięte, a dostępne w `sky/plates/`: s. 153, 160, 169, 187, 204, 211, 290, 307, 323, 328, 339, 352,
361, 368, 379, 400, 420, 427, 434, 441. Są tam m.in. druga półkula (południowa, ze Skorpionem
w innym ujęciu), fazy Księżyca (s. 339) i teoria planet — materiał na `og-antares`, warianty M
i osiągnięcia, gdyby były potrzebne.
