# EVENT ZWROTNY — tura 1 (środowisko: claude.ai sandbox, bez sieci)

## Stan: 24 SVG dostarczone (17 produkcyjnych + 7 DRAFT), reszta zamówienia ZABLOKOWANA na źródle — patrz §3.

## 1. Co jest produkcyjne (Gray 1918, kreska, zero rastra, minifikacja scour)

| id | plik(i) | viewBox | gzip | kreska | uwagi |
|---|---|---|---|---|---|
| hero-ldek-palate | hero-ldek-palate.svg, -currentColor.svg | 0 0 1600 1600 | 16 KB | gold / currentColor | wersja LINIOWA z tablicy podniebienia Graya (stipple odrzucony progiem 185, turdsize 28). Obiekt wychodzi prawo-dół. Gęstość pod op 0.36 OK, pod 0.60 mobile OK. **Zostały 2 cienkie linie odniesienia nad siekaczami** (idą przez zęby, nie da się ich zdjąć automatycznie bez dziurawienia koron) — 30 s w Illustratorze albo hi-res źródło. |
| hero-ldek-palate-left | hero-ldek-palate-left.svg | 0 0 1600 1600 | 16 KB | gold | wariant M: obiekt lewo-dół (palate jest symetryczne, więc to kadr, nie flip). |
| og-ldek | og-ldek.svg | 0 0 1200 630 | 16 KB | gold | ten sam obiekt, prawa strona, lewe ~55% puste. |
| sec-session-trigeminal | sec-session-trigeminal.svg, -currentColor.svg | 0 0 1600 2000 | 73 KB | gold / currentColor | najlepsza rzecz w paczce, naturalnie liniowa. Zewnętrzne podpisy zdjęte (OCR + ręcznie). **Wewnętrzne obrócone podpisy wzdłuż nerwów zostały** (~10 drobnych: „Maxillary", „Lingual"…) — przy op 0.22 są fakturą; „zero liter" wymaga ręcznego przejścia w AI (~10 min) albo hi-res źródła + jeszcze raz OCR. |
| sec-progress-spine | sec-progress-spine.svg | 0 0 1000 1800 | 20 KB | sage | kręgosłup bok, cover, wychodzi górą i dołem. Numeracja kręgów zdjęta. Czysta. |
| mark-ldek | mark-ldek.svg | 0 0 64 64 | 5 KB | currentColor | łuk zębowy uproszczony; czytelny przy 32 px. |
| orn-footer-mark | orn-footer-mark.svg | 0 0 64 64 | 5 KB | currentColor | = mark-ldek (ten sam obiekt; zamówienie: „mały łuk zębowy"). |
| ach-tysiac | ach-tysiac.svg | 0 0 64 64 | 5 KB | currentColor | pełny łuk. |
| onboarding-track-stoma | onboarding-track-stoma.svg | 0 0 96 96 | 5 KB | currentColor | łuk zębowy. |
| empty-404-missing-tooth | empty-404-missing-tooth.svg | 0 0 256 256 | ~8 KB | currentColor | **łuk BEZ wyciętej luki** — luka to edycja ręczna (usunąć jeden ząb w AI: 1 min). Nie robię tego automatycznie, bo wybór zęba to decyzja projektowa. |
| ach-maraton, anat-spine-mark | *.svg | 0 0 64 64 | 4 KB | currentColor | kręgosłup cały; przy 32 px czyta się jako pionowa oś. |
| empty-stats | empty-stats.svg | 0 0 128 128 | 4 KB | currentColor | kręgosłup. |
| ach-tygodniowy-rytm | ach-tygodniowy-rytm.svg | 0 0 64 64 | ~5 KB | currentColor | odcinek szyjny (7 kręgów) z tej samej tablicy. |
| anat-trigeminal-mark | anat-trigeminal-mark.svg | 0 0 64 64 | 7 KB | currentColor | profil z nerwem, uproszczony; przy 32 px czyta się jako profil twarzy. |

## 2. DRAFT — dostarczone, ale NIE wdrażać (nazwa z sufiksem -DRAFT)

| id | dlaczego draft |
|---|---|
| hero-ldek-skull-oblique(-currentColor) | źródło = kolorowana tablica czaszki 500 px; wypełnienia kolorem po przejściu na L dają fragmentaryczny kontur, nie ciągłą kreskę. Zostały 2 obrócone podpisy („Zygomatic (cut)", fragment „Squama"). Do produkcji: **Commons Gray188 (monochromatyczna, 1000+ px)**. |
| auth-bg-skull | ten sam obiekt; dodatkowo zamówienie chce czaszkę EN FACE — w dostępnym źródle jej nie ma. |
| path-stoma-skull(-currentColor) | ten sam problem źródła; rotowany podpis „Zygomatic" został. |
| path-lek-heart-lungs(-currentColor) | serce z tablicy „heart & lungs in situ": tonalne, 5 podpisów wewnątrz serca, płuca-stipple obcięte kadrem. Do produkcji: **Commons Gray490 / Gray491 (samo serce, monochrom)** — po hi-res źródle to będzie liniowe i czyste. |

## 3. ZABLOKOWANE — brak źródła w tym środowisku

Sandbox claude.ai nie ma dostępu do Wikimedia/archive.org/Wellcome. Miałem tylko lokalny zestaw plansz Graya (31 plansz 500–600 px + 270 kolaży 400×300, za małe na cokolwiek poza emblematami). Dlatego:

- **Paczka H/G-Black (zęby wg klasy, przekroje, endo), B2 pricing-card-*, D1 rank-praktykant…rezydent-3, ldew-* z zębami** — wymaga G.V. Black. Brak.
- **Paczka I (niebo: ZENIT/ANTARES/KALIBRA, gwiazdozbiory, sekstant, astrolabium, mode-*, mark-zenit-labs, og-antares)** — wymaga Cellarius/Flamsteed. Brak.
- **Paczka J (narzędzia, satyra), empty-404-dentist, onboarding-welcome, scene-*** — wymaga Hunter/Wellcome. Brak.
- **Paczka K (histo/chem/pharma/micro)** — brak atlasu botanicznego/chemicznego. Brak.
- **Gray, ale brak w lokalnym zestawie w użytecznej rozdzielczości:** czaszka przód/podstawa (auth, rank-mistrz, ldew-orzecznictwo, subj-*), żuchwa bok/przód (hero-ldew-jaw, mark-ldew, og-ldew, auth-bg-jaw, ldew-protetyka/chirurgia), TMJ (path-stoma-tmj, anat-tmj), nerw twarzowy (sec-session-facial-n, anat-facial-n), dłoń (sec-pulpit-hand, ach-miesieczna-dyscyplina, subj-prof-humanizm), oko/ucho (card-goal-target, card-reviews-clock, sec-faq-ear, ach-snajper, ach-nocny-maratonczyk, ach-wczesny-ptak, subj-biofizyka), szkielet całej postaci (hero-knnp-skeleton, ldew-zdrowie-pub, ach-kwartalna), klatka/miednica, mózg (sec-progress-brain — tablica sagittal jest tonalna + 20 linii odniesienia, nie nadaje się), calvaria (sec-cta-constellation), ślinianki, mięśnie żucia/mimiczne, język, naczynia głowy, nerki/wątroba/żołądek.

**Odblokowanie = jedno z dwóch:**
1. Uruchomić `RYCINY_BOT.md` w **Claude Code** (pełna sieć): bot sam pobierze „Original file" z Commons dla każdego ID i przejdzie identycznym pipeline (`engrave.py` → `vectorize.py`). Przy hi-res monochromatycznych planszach (Gray188, Gray490, Gray160, Gray778, Gray187…) drafty z §2 staną się produkcją bez zmiany parametrów.
2. Wrzucić plansze ręcznie do czatu — wtedy robię je tu, ale przy ~230 pozycjach to nie ma sensu.

## 4. Odstępstwa techniczne od §0 zamówienia — świadome

- **`fill="currentColor"` zamiast `fill="none" stroke="currentColor"`.** Potrace daje obrys plamy tuszu (wypełniony kształt kreski), nie linię środkową. Wizualnie identyczne przy każdej skali, kolor steruje się z CSS tak samo (`color:`). Prawdziwy centerline (autotrace) na rycinach daje szarpane, przerwane linie — testowałem wcześniej, nie polecam. Jeśli Cursor potrzebuje `stroke` do animacji `stroke-dasharray` — to osobne zamówienie na uproszczone ręcznie ścieżki, nie na trace.
- **Emblematy 64 px z rycin** czytają się tylko dla obiektów o prostej sylwetce (łuk zębowy, kręgosłup, profil). Czaszka i serce z obecnego źródła przy 32 px to plama — dlatego nie ma ich w §1. Z hi-res źródłem będzie lepiej, ale przy 64 px i tak polecam uproszczenie ręczne (AI › Object › Path › Simplify) po trace.
- **„Zero liter"** — zewnętrzne podpisy zdejmuję automatycznie (OCR psm 11 + ręczne boxy). Podpisy **obrócone wzdłuż struktur** OCR nie łapie; przy hi-res źródle łapie więcej, resztę trzeba zdjąć ręcznie. Wskazane w tabeli per plik.
- **Contact sheety:** SVG + PNG (`sheet-*.svg/.png`) na `#002A27`, karty `#0a2322`, etykiety tylko na sheetcie.

## 5. Snippet

```css
/* tła: kolor jest w pliku (gold/sage); wariant -currentColor bierze color: z CSS */
.plate{position:absolute;pointer-events:none;opacity:var(--plate-op,.3);
  -webkit-mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent);
          mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent)}
.plate>svg{width:100%;height:100%}
@media (max-width:640px){.plate{position:relative;width:100%;height:340px;--plate-op:.6;
  -webkit-mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000);mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000)}}
.emblem{color:var(--rycina-sage,#7FA697);width:48px;height:48px}
.emblem.is-gold{color:#CDB56E}
```
```html
<div class="plate" aria-hidden="true" style="--plate-op:.36;right:-40px;top:40px;width:600px;height:600px">
  <!-- inline SVG z hero-ldek-palate.svg albo <img src="/img/ryciny/hero-ldek-palate.svg" alt=""> -->
</div>
<svg class="emblem"><use href="/img/ryciny/mark-ldek.svg#root"/></svg>  <!-- albo inline -->
```
Uwaga: `<img src=…svg>` nie dziedziczy `currentColor` — warianty currentColor wstawiaj **inline** (Next: import jako komponent przez @svgr/webpack) albo używaj plików z kolorem w środku.

## 6. Źródło + licencja
Gray, Henry; Carter, Henry Vandyke (ilustracje). *Anatomy of the Human Body*, 20. wyd., Lea & Febiger, Philadelphia 1918. Domena publiczna (Carter zm. 1897, wydanie 1918). Kolekcja plansz: https://commons.wikimedia.org/wiki/Category:Gray%27s_Anatomy_plates — ID tablic do potwierdzenia przy hi-res pobraniu (lokalne źródło miało nazwy opisowe, nie numery Graya).
