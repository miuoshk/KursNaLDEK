# EVENT — PACZKA G-Black (atlas zębów wg klas), tura 2

Atlas: **G.V. Black, *Descriptive Anatomy of the Human Teeth*, 1890** — skan archive.org,
JP2 400 ppi (2238×3426 px na stronę). Pierwsza paczka w całym zleceniu na źródle o **prawdziwie
produkcyjnej rozdzielczości**; wszystko wcześniej szło z 500–800 px.

`viewBox 0 0 128 128`, każda pozycja w dwóch wariantach: `currentColor` (emblemat) i `-sage` (tło).
**40 plików**, 20 identyfikatorów.

## 1. Komplet — 20 z 20

| id | strona skanu / figura | bytes | gzip |
|---|---|---|---|
| tooth-incisor-crown | s. 25, fig. 1 — siekacz przyśrodkowy górny, powierzchnia wargowa | 18 544 | 8 279 |
| tooth-incisor-root | s. 25, fig. 4 — profil korzenia | 17 455 | 7 775 |
| tooth-incisor-section | s. 111 — komora miazgi i kanał, przekrój | 10 853 | 5 186 |
| tooth-lateral-crown | s. 29, fig. 6 — siekacz boczny | 16 626 | 7 464 |
| tooth-lateral-root | s. 29, fig. 9 | 24 203 | 10 645 |
| tooth-lateral-section | s. 111 | 9 802 | 4 671 |
| tooth-canine-crown | s. 37, fig. 18 — kieł | 23 564 | 10 200 |
| tooth-canine-root | s. 37, fig. 21 | 25 527 | 11 168 |
| tooth-canine-section | s. 111 | 11 173 | 5 264 |
| tooth-premolar-crown | s. 45, fig. 30 — przedtrzonowiec | 21 459 | 9 598 |
| tooth-premolar-root | s. 45, fig. 31 — dwa korzenie | 40 446 | 17 269 |
| tooth-premolar-section | s. 125 — dwa kanały | 11 422 | 5 430 |
| tooth-molar-upper-crown | s. 97 — trzonowiec górny | 63 287 | 26 367 |
| tooth-molar-upper-root | s. 97 — trzy korzenie | 55 159 | 23 137 |
| tooth-molar-upper-section | s. 125 — trzy kanały | 11 418 | 5 422 |
| tooth-molar-lower-crown | s. 87 — trzonowiec dolny | 39 605 | 16 842 |
| tooth-molar-lower-root | s. 87 — dwa korzenie | 44 072 | 18 741 |
| tooth-molar-lower-section | s. 125 | 13 209 | 6 216 |
| tooth-dec-incisor | s. 101 — siekacz mleczny | 27 284 | 11 776 |
| tooth-dec-molar | s. 101 — trzonowiec mleczny, korzenie rozstawione | 58 388 | 24 439 |

**Wszystkie mieszczą się w 4,7–26,4 KB gzip.** Przekroje są najlżejsze (4,7–6,2 KB) — to czyste
kontury zęba i jamy miazgi, bez cieniowania.

## 2. Dwie techniki, które to umożliwiły

### Automatyczna detekcja figur
Zamiast ustawiać kadry ręcznie dla 20 zębów rozrzuconych po 176 stronach, napisałem `figdetect.py`:
progowanie tuszu → domknięcie morfologiczne (9×9) → dylatacja (13×13) → etykietowanie spójnych
obszarów → odrzucenie linii tekstu po proporcjach i wypełnieniu. Na 22 stronach wykrył **73 figury**,
z których wybrałem 20. Podgląd wszystkich wykrytych figur jako miniatur pozwolił zmapować klasy
zębów bez otwierania każdej strony osobno.

### `keep_main` — usuwanie liter bez OCR
Figury Blacka mają rozsiane wokół zęba **kursywne litery** (a, b, c, d, e, f, g, h, i, k) z linijkami
odniesienia. OCR ich nie łapie, bo to pojedyncze znaki. Podnoszenie `turdsize` też nie działa —
przy wartości, która zjada litery, znika też cieniowanie zęba (testowałem 200 / 400 / 700).

Rozwiązanie: **litery leżą poza sylwetką zęba**. Po ekstrakcji tuszu etykietuję spójne obszary
i zostawiam tylko te o powierzchni ≥ 18% największego — czyli sam ząb. Litery i strzałki znikają
w jednym kroku, geometria zęba jest nietknięta. To jest w `plate.py` jako `keep_main=True`
i przyda się wszędzie, gdzie figura jest **jednym obiektem** z podpisami wokół.

## 3. Kompromis — czego nie zdjąłem

Litery **stykające się z zębem przez linijkę odniesienia** zostają, bo dla algorytmu są częścią
tej samej plamy. To 1–3 znaki na figurze (widać je na contact sheetcie: `d` przy siekaczu,
`g` przy kle, `c` i `b` przy trzonowcu). Przy 128 px są czytelne jako litery, przy 48 px stają się
fakturą kreski. Jeśli chcesz absolutne „zero liter" — to jest 20 × 30 sekund w Illustratorze,
albo powiedz, to dołożę krok odcinający cienkie łączniki (erozja + ponowne etykietowanie), ale
ryzykuje przerwaniem konturu w wąskich miejscach korzenia.

## 4. Uwaga o `-sage`

Zamówienie mówi „svg currentColor + svg sage (tła)". Warianty `-sage` mają kolor `#7FA697`
zaszyty w pliku, więc działają przez `<img src>`. Warianty bez sufiksu biorą kolor z CSS przez
`color:` i **muszą być wstawione inline** (`@svgr/webpack`) — `<img>` nie dziedziczy `currentColor`.

## 5. Parametry

Wspólne: kanał `L` (Black jest monochromatyczny — bez `channel=max`), `t2 48`, `gamma 0.75`,
`threshold 175`, canvas 1100, `zoom 0.94`, `keep_main` z progiem 0.18.
Korony i korzenie: `t1 10`, `radius 4`, `turdsize 55`.
Przekroje (lite sylwetki z komorą miazgi): `t1 26`, `radius 7`, `turdsize 60`.

## 6. Źródło i licencja

Black, Greene Vardiman (1836–1915). *Descriptive Anatomy of the Human Teeth*, wyd. 1,
The Wilmington Dental Manufacturing Co., Philadelphia 1890. **Domena publiczna** (autor zm. 1915).
Skan: Internet Archive, https://archive.org/details/descriptiveanato00blaciala — SINGLE PAGE
PROCESSED JP2, 400 ppi. Pełny tom (176 stron) leży w `ryciny_zrodla/black/`, strony robocze
przekonwertowane do `black/sel/`.

## 7. Co zostało z paczki G

**G-Gray** — 19 pozycji twarzoczaszki (czaszka w trzech ujęciach, oczodół, szczęka, żuchwa, TMJ,
nerwy V i VII, ślinianki, mięśnie żucia i mimiczne, język, podniebienie, łuki mleczny i stały,
naczynia głowy) plus 16 pozycji ciała (serce, aorta, płuca, mózg, kręgosłup, krąg, dłoń, stopa,
oko, ucho, nerka, wątroba, żołądek, szkielet, klatka, miednica). Każda jako tło sage ~1200 px
i emblemat currentColor 64 px. To druga połowa paczki G — większość źródeł już mam z paczek D, E i F.
