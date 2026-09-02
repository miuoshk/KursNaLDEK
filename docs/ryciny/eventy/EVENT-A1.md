# EVENT — PACZKA A1 (hero landingu), tura 2

Środowisko: Cowork, kontener w chmurze. potrace 1.16 · tesseract 5.3.4 · scour 0.38 · Pillow 12.
Źródło: zestaw `gray_embedded_399` (386 tablic Gray 1918 wyciągniętych ze strony UNSW Embryology).
**Rozdzielczość źródła: mediana 613 px, maks. 2042 px** — to jest poniżej progu „produkcja" z SKILL.md §6.
Konsekwencje są opisane per pozycja; nie udaję, że ich nie ma.

## 1. Dostarczone

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| hero-ldek-palate | hero-ldek-palate.svg, -currentColor.svg | Gray 1918, podniebienie + łuk górny | 0 0 1600 1600 | 40 156 | 17 331 | gold / currentColor | nie (z tury 1, bez zmian) |
| hero-ldek-skull-oblique | hero-ldek-skull-oblique.svg, -currentColor.svg | Gray 1918, **Gray1003** (szczęka + żuchwa z uzębieniem in situ, bok) | 0 0 1600 1600 | 120 508 | 49 118 | gold / currentColor | **TAK** — patrz §2 |
| hero-ldew-jaw | hero-ldew-jaw.svg, -currentColor.svg | Gray 1918, **Gray0185** (żuchwa dorosłego, bok) | 0 0 1600 1600 | 62 385 | 25 632 | gold / currentColor | nie |
| hero-knnp-skeleton | hero-knnp-skeleton.svg, -currentColor.svg | Gray 1918, **Gray0599** (rdzeń kręgowy z korzeniami, całą długość) | 0 0 1200 1800 | 197 318 | 80 981 | gold / currentColor | **TAK** — patrz §2 |
| hero-lek-heart | hero-lek-heart.svg, -currentColor.svg | Gray 1918, **Gray0492** (serce, powierzchnia przednia, naczynia wieńcowe) | 0 0 1600 1600 | 176 036 | 70 892 | gold / currentColor | nie |

Contact sheet: `sheet-A1.png` (opacity docelowe) i `sheet-A1-op1.png` (opacity 1.0, kontrola kreski),
oba na `#002A27`, karty `#0a2322`, etykiety tylko na sheetcie.

## 2. Zamienniki — co i dlaczego

**hero-ldek-skull-oblique** — zamówienie chce „czaszka bok + zęby, 3/4". W zestawie 386 tablic
**nie ma ani jednej całej czaszki bocznej** (to wyciąg embriologiczny Graya, nie rozdział osteologii).
Zamiennik z tego samego atlasu: **Gray1003** — szczęka i żuchwa z pełnym uzębieniem w przekroju bocznym,
z zębodołami i korzeniami. Czyta się jednoznacznie jako „aparat zębowy z boku" i jest wyraźnie inny
niż podniebienie z hero LDEK, czyli spełnia warunek „żeby LDEK i LDEW nie miały tej samej twarzy".

**hero-knnp-skeleton** — zamówienie chce „szkielet całej postaci, Albinus/Gray, linia".
Szkieletu w zestawie nie ma. Przetestowałem **Gray0621** (tułów z klatką piersiową i pniem współczulnym)
— po potrace rozpadał się na prostokątne strzępy, odrzucone. Zamiennik: **Gray0599** — rdzeń kręgowy
z korzeniami nerwowymi na całej długości, pion, symetryczny, wychodzi górą i dołem. To nadal „oś
nauk podstawowych", ale **to nie jest szkielet** — jeśli upierasz się przy szkielecie, potrzebny jest
Albinus albo osteologiczny rozdział Graya z Commons, i wtedy CAŁA paczka A idzie na to źródło.

## 3. Kompromisy — czego nie zdjąłem

- **hero-lek-heart:** zostały 3 podpisy wewnętrzne kursywą („Right", „Left ventricle", strzęp
  „conus arteriosus") wprost na mięśniu sercowym. OCR przy `--psm 11` i conf 25 ich nie łapie, bo leżą
  na gęstym szrafie. Podniesienie `--turdsize` do 45 zdejmuje je razem z **konturem serca** — sprawdziłem,
  zostają same naczynia wieńcowe w powietrzu, czyli lekarstwo gorsze od choroby. Zostawiam z podpisami:
  30 sekund w Illustratorze albo hi-res monochromatyczne źródło z Commons (Gray490/491).
- **hero-ldek-skull-oblique:** kość gąbczasta wokół korzeni to szraf punktowy, po trace zostaje jako
  pole drobnych plamek. Przy `op 0.34` czyta się jako faktura kości, nie jako brud — ale to jest
  faktura, nie czysty kontur. `--turdsize 90` to już maksimum przed utratą zębów.
- **hero-knnp-skeleton:** 3 drobne podpisy (m.in. „Lumbar plexus") zostały, ta sama przyczyna.
- **Rozdzielczość:** wszystkie źródła 400–800 px. SVG skaluje się bez utraty, ale kreska ma
  nieregularne brzegi z JPEG-owych artefaktów — widać to dopiero przy `op 1.0`, przy docelowych
  0.28–0.36 jest niewidoczne. Do druku bym tego nie dał; na dark-only web jest OK.

## 4. Parametry (do powtórzenia / batchowania)

| id | crop (px oryginału) | t1 | threshold | turdsize | canvas | zoom | kotwica |
|---|---|---|---|---|---|---|---|
| hero-ldek-skull-oblique | 18,96,428,398 | 38 | 185 | 90 | 1400 | 1.24 | prawo-dół |
| hero-ldew-jaw | — | 22 | 185 | 20 | 1800 | 1.20 | prawo, y 0.60 |
| hero-knnp-skeleton | — | 22 | 185 | 30 | 1500 | 1.04 | środek, góra |
| hero-lek-heart | 50,96,596,478 | 22 | 185 | 14 | 1600 | 1.02 | x 0.70 / y 0.66 |

Wspólne: `radius 4`, `t2 55`, `gamma 0.8`, upscaling ×2 przed high-passem, `alphamax 1.0`,
`opttolerance 0.4`, minifikacja scour `--set-precision=3`.

## 5. Odstępstwa techniczne — jak w turze 1

`fill="currentColor"` zamiast `fill="none" stroke="currentColor"`. Potrace zwraca obrys plamy tuszu,
nie linię środkową; wizualnie identyczne, kolor steruje się z CSS przez `color:`. Nie zmieniam bez pytania.

## 6. Źródło i licencja

Gray, Henry; Carter, Henry Vandyke (ilustracje). *Anatomy of the Human Body*, 20. wyd.,
Lea & Febiger, Philadelphia 1918. **Domena publiczna** (Carter zm. 1897; wydanie 1918).
Skany: UNSW Embryology, *Anatomy of the Human Body by Henry Gray*,
https://embryology.med.unsw.edu.au/embryology/index.php/Anatomy_of_the_Human_Body_by_Henry_Gray
Numery tablic (Gray1003, Gray0185, Gray0599, Gray0492) są numerami figur z tego wydania.

## 7. Snippet

```css
.plate{position:absolute;pointer-events:none;opacity:var(--plate-op,.3);
  -webkit-mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent);
          mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent)}
.plate>svg,.plate>img{width:100%;height:100%;object-fit:contain}
@media (max-width:640px){.plate{position:relative;width:100%;height:340px;--plate-op:.6;
  -webkit-mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000);
          mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000)}}
```
```html
<div class="plate" aria-hidden="true" style="--plate-op:.36;right:-40px;top:40px;width:600px;height:600px">
  <!-- inline SVG hero-ldew-jaw.svg  albo  <img src="/img/ryciny/hero-ldew-jaw.svg" alt=""> -->
</div>
```
Warianty `-currentColor` wstawiaj **inline** (`@svgr/webpack`) — `<img src=…svg>` nie dziedziczy `color`.

## 8. Co dalej

Kolejka priorytetu: **A2** (`sec-session-trigeminal` już jest z tury 1; `sec-session-facial-n` —
w zestawie jest **Gray0788** nerwy czaszkowe i **Gray0790** profil głowy z unerwieniem) → **A6**
(`path-stoma-skull`, `path-lek-heart-lungs`, `path-stoma-tmj`, `path-lek-skeleton`).

Zestaw ma też mocne rzeczy pod późniejsze paczki, znalezione przy indeksowaniu:
**Gray1002** (zęby stałe, czysta linia, zero podpisów — rangi D1, pricing, G-Black zamiennik),
**Gray1004** (mleczne), **Gray1006/1007** (przekroje korona–szyjka–korzeń — endo, zachowawcza),
**Gray1013/1014** (jama ustna, język — śluzówka, empty-session),
**Gray1022/1023** (ślinianki), **Gray0608** (dłoń), **Gray0869/0878** (oko, tęczówka),
**Gray0720** (mózg strzałkowy), **Gray0788** (nerwy czaszkowe).
