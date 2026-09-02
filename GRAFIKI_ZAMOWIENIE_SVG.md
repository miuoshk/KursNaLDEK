# ZAMÓWIENIE RYCIN — Kurs na LDEK (marketing + katalog na zapas)

Jedna wiadomość do bota **Ryciny**. To jest komplet: landing, auth, cennik, 404, onboarding, empty states, produkty, tryby, rangi, osiągnięcia, przedmioty KNNP/LDEW, atlas zębów, niebo ZENIT/ANTARES/KALIBRA. Lepiej za dużo niż za mało.

**Konsument:** Cursor wstawia do Next.js (`/public/img/ryciny/`).  
**Producent:** bot Ryciny. Nie AI-obrazy, nie rysunek od zera — skany z domeny publicznej → SVG.

---

## 0. Twarde wymogi (czytaj zanim cokolwiek wyeksportujesz)

### Format
- **Wyłącznie SVG.** PNG, JPEG, WebP — nie. Contact sheet też jako SVG (ew. jeden PNG contact sheet *oprócz* SVG, nie zamiast).
- Plansze tonalne (stipple, gęsty szraf: płuca, podniebienie, skóra Albinusa): **nie wektoruj szrafu**. Weź tę samą rycinę, wyciągnij **warstwę kreski / kontur**, potrace, agresywna redukcja. Cel: gzip **< 80 KB** (tło) / **< 15 KB** (emblemat). Jeśli potrace daje plamę albo >200 KB — **zamień na inną planszę LINIOWĄ z tego samego atlasu** i napisz w evencie, którą i dlaczego. Nie odpuszczaj SVG.
- `fill="none"` + `stroke="currentColor"` na emblematach. Na hero/tłach: stroke w tokenie gold albo sage (poniżej), albo `currentColor` jeśli zamówienie mówi `svg currentColor`.
- Minifikacja SVG obowiązkowa. Bez fontów, bez `<image href=...>`, bez rastera w środku, bez data-URI PNG.
- Usuń **wszystkie** podpisy (łacińskie, angielskie, numery tablic, skale). Zewnętrzne i wewnętrzne. Zero liter na rycinie.
- Widok: sam obiekt / kompozycja, dużo powietrza, cienka kreska, bez wypełnień, bez gradientów, bez poświat.

### Kolor (kreska rycin ≠ token UI — nie mylić)
Aplikacja jest **dark-only**. Contact sheety na zieleni aplikacji, nie na białym.

| Token ryciny | Hex | Kiedy |
|---|---|---|
| gold | `#CDB56E` | hero + max 1 druga rycina na stronę |
| sage | `#7FA697` | tła kart, sekcje, druga liga |
| currentColor | — | emblematy; kolor z CSS (`#7FA697` default) |

Tła, na których to leży w apce (do contact sheetu):
- `--bg` `#002A27`
- `--card` `#0a2322`
- UI gold (nie kreska) `#C9A84C` · UI sage (nie kreska) `#367368`

Opacity docelowe (Cursor i tak da maskę CSS; Ty dobierasz **gęstość kreski** pod te wartości):
- za tekstem: 0.28–0.38
- figura mobile (pełna szerokość): 0.50–0.65
- tło karty: 0.16–0.28
- emblemat: 1.0

### Atlas — jedna ręka na paczkę
Nie mieszaj Graya z Blackiem w jednym zestawie emblematów.

| Paczka | Atlas (obowiązkowy) |
|---|---|
| A–G, anatomia, sesja, ścieżki, auth | **Gray 1918** |
| H zęby wg klasy, endo/przekroje | **G.V. Black** (Hunter jako zapas) |
| I niebo / ZENIT / ANTARES / KALIBRA | **Cellarius** albo **Flamsteed** — jeden na całą paczkę I |
| J narzędzia / satyra dentysta | **Hunter** albo Black — jeden atlas |
| K histologia / biochemia / farmakologia / mikro | Sobotta 1906 albo Gray — jeden atlas na zestaw |

Jeśli motywu nie ma jako plansza liniowa: zaproponuj zamiennik **liniowy** z tego samego atlasu i wyprodukuj go. Nie wrzucaj PNG.

### Dostawa każdej paczki
1. Pliki SVG nazwane jak `id` poniżej, do wrzucenia w `/public/img/ryciny/`.
2. Contact sheet na `#002A27`, kreska gold/sage, etykiety ID (etykiety tylko na sheetcie, nie na rycinach).
3. Snippet CSS/HTML pod wzorzec `.plate` / `.emblem` z briefu.
4. Linia źródło + licencja (atlas, tablica, rok, Commons URL Original file).
5. Dla każdego SVG: wymiary viewBox, rozmiar pliku, gzip.

Wzorzec wstawienia (już ustalony, nie wymyślaj innego):

```css
.plate{position:absolute;pointer-events:none;/* maska radialna desktop, liniowa mobile */}
.emblem{color:var(--rycina-sage,#7FA697);width:48px;height:48px}
```

`aria-hidden="true"` — Cursor doda. Ty daj czyste SVG.

---

## PACZKA A — Landing `/` hero i ornamenty strony (Gray 1918)

Landing jest jeden: `app/(marketing)/page.tsx` + `LandingContent` + `HeroMotion`. Teraz hero to puste okręgi. Ryciny wchodzą tu.

### A1. Hero LDEK (gold) — pierwsza pozycja, produkcja nie mockup

```
[hero-ldek-palate] hero-ldek-palate.svg
  Gdzie:        <HeroMotion>, /  (landing LDEK)
  Przeznaczenie: hero
  Motyw:        podniebienie + łuk zębowy górny, widok od dołu (Gray). LINIA, nie szraf.
                Jeśli Gray palate jest za tonalny — żuchwa/szczęka od dołu albo łuk zębowy
                liniowy z tej samej tablicy. Ma być rozpoznawalne jako jama ustna.
  Format:       svg (stroke gold #CDB56E) + identyczny svg currentColor
                [hero-ldek-palate-currentColor.svg]
  Kolor:        gold
  Rozmiar:      viewBox kwadrat ~0 0 1600 1600, kreska czytelna przy wyświetleniu 800–1200 px
  Kadr:         obiekt wychodzi poza prawą i dolną krawędź; lewa-góra powietrze pod copy
  Opacity:      0.36 desktop / 0.60 mobile
  Uwagi:        to JEDYNE złoto w hero. Retina: SVG więc skaluje się. Zero podpisów.
                Wariant currentColor obowiązkowy (dark/hover/inne produkty).
```

```
[hero-ldek-skull-oblique] hero-ldek-skull-oblique.svg
  Gdzie:        /  hero — wariant B (A/B albo LDEK vs LDEW)
  Przeznaczenie: hero
  Motyw:        czaszka bok + zęby (Gray), 3/4, nie en face
  Format:       svg gold + svg currentColor
  Kolor:        gold
  Rozmiar:      ~0 0 1600 1600
  Kadr:         prawa połowa kadru, żuchwa ucięta dolną krawędzią
  Opacity:      0.34
  Uwagi:        inny niż palate — żeby LDEK i LDEW nie miały tej samej twarzy
```

```
[hero-ldew-jaw] hero-ldew-jaw.svg
  Gdzie:        przyszły /ldew <Hero> (jeszcze nie ma routa — produkujemy na zapas)
  Przeznaczenie: hero
  Motyw:        żuchwa bok z zębami, staw skroniowo-żuchwowy w kadrze (Gray)
  Format:       svg gold + svg currentColor
  Kolor:        gold
  Rozmiar:      ~0 0 1600 1600
  Kadr:         obiekt wychodzi poza prawą krawędź
  Opacity:      0.36
  Uwagi:        NIE to samo co hero LDEK. LDEW = egzamin kliniczny, bardziej „kość + staw”.
```

```
[hero-knnp-skeleton] hero-knnp-skeleton.svg
  Gdzie:        przyszły /knnp albo karta „od podstaw”
  Przeznaczenie: hero
  Motyw:        szkielet całej postaci, Albinus/Gray, linia, nie muscle-man szraf
  Format:       svg gold + svg currentColor
  Kolor:        gold
  Rozmiar:      ~0 0 1200 1800 (portret)
  Kadr:         półpostać / cała figura, głowa ucięta górą OK
  Opacity:      0.28
  Uwagi:        KNNP = lata 1–3, nauki podstawowe, nie klinika zębów
```

```
[hero-lek-heart] hero-lek-heart.svg
  Gdzie:        karta / sekcja kierunku lekarskiego, ewentualny landing LEK
  Przeznaczenie: hero
  Motyw:        serce z wielkimi naczyniami, kontur (Gray). Płuca TYLKO jeśli da się liniowo;
                w razie szrafu — samo serce + aorta.
  Format:       svg gold + svg currentColor
  Kolor:        gold
  Rozmiar:      ~0 0 1600 1600
  Kadr:         serce trochę prawo-dół
  Opacity:      0.34
```

### A2. Sekcja „Jak działa sesja” (`#jak-dziala`) — drugie złoto na stronie

```
[sec-session-trigeminal] sec-session-trigeminal.svg
  Gdzie:        LandingContent sekcja #jak-dziala (tło całej sekcji, prawa strona)
  Przeznaczenie: tło sekcji
  Motyw:        nerw trójdzielny i gałęzie (Gray) — to jest LINIOWE, SVG naturalne
  Format:       svg gold + svg currentColor
  Kolor:        gold
  Rozmiar:      ~0 0 1600 2000
  Kadr:         pień + V1/V2/V3, twarz jako powietrze nie jako portret
  Opacity:      0.22 za tekstem
  Uwagi:        JEDYNE drugie złoto na landingu. Demo pytania w hero mówi o n. twarzowym
                vs trójdzielnym — ta rycina jest easter egg merytoryczny.
```

```
[sec-session-facial-n] sec-session-facial-n.svg
  Gdzie:        #jak-dziala wariant / karta kroku 02 (odpowiedź)
  Przeznaczenie: tło karty
  Motyw:        nerw twarzowy (VII), rozgałęzienia mimiczne (Gray)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1200
  Kadr:         sam nerw, bez całej czaszki
  Opacity:      0.20
```

### A3. Sekcja pulpit / feature row

```
[sec-pulpit-hand] sec-pulpit-hand.svg
  Gdzie:        sekcja „Twój pulpit” / „Wiesz, co zrobić dzisiaj”
  Przeznaczenie: tło sekcji
  Motyw:        dłoń / ręka osteologia (Gray) — plan, działanie
  Format:       svg sage + svg currentColor
  Kolor:        sage
  Rozmiar:      ~0 0 1600 1200 landscape
  Kadr:         dłoń z prawej, wychodzi poza kadr
  Opacity:      0.18
```

```
[card-goal-target] card-goal-target.svg
  Gdzie:        feature card „Konkretny plan na dziś”
  Przeznaczenie: tło karty (NIE zamienia ikony Lucide Target)
  Motyw:        przekrój oka albo tarcza astrolabium — cel, ostrość
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 800 800
  Kadr:         sam obiekt
  Opacity:      0.16
  Uwagi:        Lucide zostaje. Rycina jest tłem karty, nie ikoną.
```

```
[card-reviews-clock] card-reviews-clock.svg
  Gdzie:        feature card „Powtórki we właściwym momencie”
  Przeznaczenie: tło karty
  Motyw:        przekrój ucha wewnętrznego ALBO klepsydra/sekstant (czas) — dobierz liniowe
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 800 800
  Opacity:      0.16
```

```
[card-rank-laurel] card-rank-laurel.svg
  Gdzie:        feature card „Postęp, który widać”
  Przeznaczenie: tło karty
  Motyw:        czaszka en face, uproszczona, „popiersie” (ranga)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 800 800
  Opacity:      0.16
```

### A4. Mock karty pulpitu (4 kafle: cel, streak, powtórki, ranga)

```
[orn-streak-flame] orn-streak-flame.svg
  Gdzie:        mock karta Seria (obok liczby)
  Przeznaczenie: emblemat
  Motyw:        nie płomień Lucide — pochodnia / lampa alkoholowa XIX w. albo serce z aortą
                jako „życie / ciągłość”. Dobierz z Gray/Hunter.
  Format:       svg currentColor
  Kolor:        currentColor (w UI gold)
  Rozmiar:      viewBox 0 0 64 64, czytelne przy 40 px
  Opacity:      1.0
```

```
[orn-goal-circle] orn-goal-circle.svg
  Gdzie:        mock karta Cel dzienny
  Przeznaczenie: emblemat
  Motyw:        róża wiatrów albo pierścień astrolabium (koło postępu)
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
  Opacity:      1.0
  Uwagi:        atlas: jeśli niebo, przenieś do paczki I i zrób w Cellariusie; wtedy tu
                daj krąg kręgowy (Gray) jako „cel / oś”.
```

### A5. Sekcja postęp (`progress`) + heatmapa

```
[sec-progress-spine] sec-progress-spine.svg
  Gdzie:        sekcja „Twoja aktywność” — lewa kolumna za copy
  Przeznaczenie: tło sekcji
  Motyw:        kręgosłup / krąg z wyrostkami (Gray), oś postępu
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1000 1800
  Kadr:         pion, wychodzi górą i dołem
  Opacity:      0.20
```

```
[sec-progress-brain] sec-progress-brain.svg
  Gdzie:        ta sama sekcja — wariant B
  Przeznaczenie: tło sekcji
  Motyw:        mózg przekrój strzałkowy, kontur (Gray)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1200
  Opacity:      0.18
```

### A6. Ścieżki `#dla-kogo` — dwie karty produktu

```
[path-stoma-skull] path-stoma-skull.svg
  Gdzie:        karta „Stomatologia” (paths.dentistry)
  Przeznaczenie: tło karty
  Motyw:        oczodół + szczęka + zęby (Gray) — to, co było 03_skull_sage
  Format:       svg sage + svg currentColor
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000 landscape
  Kadr:         prawa-dół, wychodzi poza kartę
  Opacity:      0.22
  Uwagi:        karta ma overflow-hidden. Lucide GraduationCap zostaje.
```

```
[path-lek-heart-lungs] path-lek-heart-lungs.svg
  Gdzie:        karta „Kierunek lekarski”
  Przeznaczenie: tło karty
  Motyw:        serce + zarys klatki / żebra. Płuca tylko liniowo; jak szraf — serce + aorta + tchawica.
  Format:       svg sage + svg currentColor
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Kadr:         prawa strona karty
  Opacity:      0.20
```

```
[path-stoma-tmj] path-stoma-tmj.svg
  Gdzie:        karta Stomatologia — wariant B
  Przeznaczenie: tło karty
  Motyw:        staw skroniowo-żuchwowy
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1200
  Opacity:      0.20
```

```
[path-lek-skeleton] path-lek-skeleton.svg
  Gdzie:        karta lekarski — wariant B
  Przeznaczenie: tło karty
  Motyw:        klatka piersiowa + kręgosłup, muscle-man Albinus TYLKO jeśli linia
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1600
  Opacity:      0.18
```

### A7. FAQ, final CTA, footer

```
[sec-faq-ear] sec-faq-ear.svg
  Gdzie:        #faq tło lewej kolumny
  Przeznaczenie: tło sekcji
  Motyw:        ucho — słuchanie pytań (Gray)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1200
  Opacity:      0.16
```

```
[sec-cta-constellation] sec-cta-constellation.svg
  Gdzie:        final CTA „Mniej planowania. Więcej świadomej nauki.”
  Przeznaczenie: tło sekcji
  Motyw:        gwiazdozbiór z siatką (przenieś do atlasu Cellarius jeśli reszta A jest Gray
                — WTEDY wyprodukuj tu Gray: sklepienie czaszki od wewnątrz / calvaria
                jako „niebo czaszki”). Nie mieszaj atlasów w paczce A.
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1800 1000 landscape
  Opacity:      0.22
  Uwagi:        złoto jest w italicu tytułu, nie na rycinie.
```

```
[orn-footer-mark] orn-footer-mark.svg
  Gdzie:        footer „Kurs na LDEK”
  Przeznaczenie: emblemat
  Motyw:        mały łuk zębowy albo czaszka uproszczona, 1 obiekt
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64, czytelne przy 24 px
  Opacity:      1.0
```

---

## PACZKA B — Auth, cennik, 404, onboarding, empty (Gray 1918, satyra: Hunter)

### B1. Auth (`/login`, `/register`, `/forgot-password`, `/reset-password`)

```
[auth-bg-skull] auth-bg-skull.svg
  Gdzie:        app/(auth)/layout.tsx tło za kartą
  Przeznaczenie: tło sekcji
  Motyw:        czaszka przód, bardzo powietrze, prawie ornament
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1600 1600
  Kadr:         centrowany, wyżej niż karta logowania
  Opacity:      0.14
```

```
[auth-bg-jaw] auth-bg-jaw.svg
  Gdzie:        /register wariant
  Przeznaczenie: tło sekcji
  Motyw:        żuchwa przód
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Opacity:      0.14
```

### B2. Cennik `/cennik` + PricingGate (checkout)

```
[pricing-bg-scales] pricing-bg-scales.svg
  Gdzie:        /cennik, <PricingGate>
  Przeznaczenie: tło sekcji
  Motyw:        nie waga sprawiedliwości nowożytna — astrolabium / sekstant (pomiar, wybór)
                albo czaszka + żuchwa jako „dwa tory”. Dobierz liniowe z Gray.
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1600 1200
  Opacity:      0.16
```

```
[pricing-card-30] pricing-card-30.svg
  Gdzie:        karta oferty 30 dni
  Przeznaczenie: tło karty
  Motyw:        siekacz (korona), jeden ząb
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 800
  Opacity:      0.14
```

```
[pricing-card-180] pricing-card-180.svg
  Gdzie:        karta oferty 180 dni
  Przeznaczenie: tło karty
  Motyw:        kieł
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 800
  Opacity:      0.14
```

```
[pricing-card-365] pricing-card-365.svg
  Gdzie:        karta oferty 365 dni
  Przeznaczenie: tło karty
  Motyw:        trzonowiec (korona)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 800
  Opacity:      0.14
```

### B3. 404, błąd, puste stany

```
[empty-404-dentist] empty-404-dentist.svg
  Gdzie:        not-found / 404 marketing + app
  Przeznaczenie: 404
  Motyw:        satyryczna scena u dentysty XVIII–XIX w. (Hunter): pacjent + wyrywanie,
                ale CZYSTO liniowo, bez gęstego tła. Ma być czytelne i trochę gorzkie, nie cartoon.
  Format:       svg sage + svg currentColor
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Kadr:         scena jako figura, nie full-bleed tło
  Opacity:      0.55 jako figura
  Uwagi:        jeśli Hunter jest za tonalny — dentysta z kleszczami, pojedyncza figura.
```

```
[empty-404-missing-tooth] empty-404-missing-tooth.svg
  Gdzie:        404 wariant B
  Przeznaczenie: 404
  Motyw:        łuk zębowy z jedną luką (brakujący ząb = 404)
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 256 256
  Opacity:      1.0
```

```
[empty-reviews] empty-reviews.svg
  Gdzie:        empty state „brak powtórek”
  Przeznaczenie: empty state
  Motyw:        ptak / gołąb anatomiczny? lepiej: czaszka spokojna, zamknięte szczęki, „cisza”
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 128 128, czytelne przy 64 px
  Opacity:      1.0
```

```
[empty-saved] empty-saved.svg
  Gdzie:        /zapisane pusto
  Przeznaczenie: empty state
  Motyw:        zakładka jako… nie UI. Księga anatomiczna / tablica atlasu pusta rama + mały ząb
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 128 128
```

```
[empty-stats] empty-stats.svg
  Gdzie:        /statystyki pusto
  Przeznaczenie: empty state
  Motyw:        kręgosłup albo puste klatki żebrowe
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 128 128
```

```
[empty-achievements] empty-achievements.svg
  Gdzie:        /osiagniecia pusto
  Przeznaczenie: empty state
  Motyw:        czaszka en face, mała, „jeszcze bez wieńca”
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 128 128
```

```
[empty-session] empty-session.svg
  Gdzie:        brak sesji / brak pytań
  Przeznaczenie: empty state
  Motyw:        otwarta jama ustna / spekulum? lepiej: pusta zębodoły
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 128 128
```

```
[onboarding-welcome] onboarding-welcome.svg
  Gdzie:        onboarding / wybór roku `/wybor-roku`
  Przeznaczenie: onboarding
  Motyw:        satyryczna scena „pierwsza wizyta u dentysty” ALBO szkielet wskazujący (Albinus)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Opacity:      0.45 figura
```

```
[onboarding-track-stoma] onboarding-track-stoma.svg
  Gdzie:        wybór kierunku stomatologia
  Przeznaczenie: onboarding
  Motyw:        łuk zębowy
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 96 96
```

```
[onboarding-track-lek] onboarding-track-lek.svg
  Gdzie:        wybór kierunku lekarski
  Przeznaczenie: onboarding
  Motyw:        serce kontur
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 96 96
```

---

## PACZKA C — Znaki produktów i silników (marketing + UI)

Dwa atlasy: **Gray** na produkty kliniczne/anatomiczne, **Cellarius/Flamsteed** na silniki nieba. Rozdziel pliki i contact sheety.

### C1. Produkty (Gray) — emblematy 64×64, czytelne przy 32 px

```
[mark-ldek] mark-ldek.svg
  Gdzie:        nav, OG, cennik, karta produktu LDEK
  Przeznaczenie: emblemat
  Motyw:        łuk zębowy górny uproszczony (LDEK = egzamin dentystyczny końcowy)
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
  Kadr:         sam obiekt, zero podpisów, ta sama grubość kreski co reszta C1
  Opacity:      1.0
```

```
[mark-ldew] mark-ldew.svg
  Gdzie:        karta LDEW
  Przeznaczenie: emblemat
  Motyw:        żuchwa bok + staw (egzamin weryfikacyjny, klinika)
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
```

```
[mark-knnp] mark-knnp.svg
  Gdzie:        karta KNNP (kurs nauk podstawowych)
  Przeznaczenie: emblemat
  Motyw:        czaszka bok uproszczona ALBO krąg
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
```

```
[mark-zenit-labs] mark-zenit-labs.svg
  Gdzie:        footer, /kalkulator „ZENIT LABS”
  Przeznaczenie: emblemat
  Motyw:        — TEN idzie do paczki I (niebo). Tutaj placeholder: nie mieszaj.
                Produkuj w paczce I jako [mark-zenit-labs].
```

### C2. Tryby sesji — nazwy kodowe (niebo, paczka I poniżej)
ANTARES = inteligentna sesja, KALIBRA = kalibracja pewności, ZENIT = laboratorium / kalkulator / „zenit nauki”.
FSRS nie dostaje osobnej maskotki — jest w ANTARES.

---

## PACZKA D — Rangi (7) i osiągnięcia (12) — Gray, zestaw jednolity

Jedna grubość kreski, viewBox 0 0 64 64, currentColor, czytelne przy 32 px. Contact sheet: 7 rang w rzędzie, 12 osiągnięć w rzędzie.

### D1. Rangi (`RANK_TIERS`)

```
[rank-praktykant] rank-praktykant.svg
  Motyw: siekacz mleczny / prosty ząb · najniższy stopień
[rank-asystent] rank-asystent.svg
  Motyw: kieł
[rank-rezydent-1] rank-rezydent-1.svg
  Motyw: przedtrzonowiec
[rank-rezydent-2] rank-rezydent-2.svg
  Motyw: trzonowiec korona
[rank-rezydent-3] rank-rezydent-3.svg
  Motyw: trzonowiec z korzeniami
[rank-specjalista] rank-specjalista.svg
  Motyw: czaszka bok
[rank-mistrz] rank-mistrz.svg
  Motyw: czaszka en face + łuk zębowy (Mistrz LDEK) — nadal LINIA, nie herb
```

Wspólne pola dla wszystkich D1:
- Gdzie: `/osiagniecia`, mock rangi na landingu, pulpit
- Przeznaczenie: emblemat
- Format: svg currentColor
- Kolor: currentColor (UI barwi gold na wyższych)
- Kadr: sam obiekt, zero podpisów
- Opacity: 1.0
- Uwagi: jeden atlas Gray na cały zestaw D. Nie Black tu — spójność z czaszką mistrza.

### D2. Osiągnięcia

```
[ach-pierwsza-sesja] ach-pierwsza-sesja.svg     Motyw: otwarte kleszcze / pierwszy ząb
[ach-setka] ach-setka.svg                       Motyw: 1 ząb
[ach-tysiac] ach-tysiac.svg                     Motyw: pełny łuk
[ach-maraton] ach-maraton.svg                   Motyw: kręgosłup
[ach-perfekcyjna-sesja] ach-perfekcyjna-sesja.svg Motyw: ząb bez próchnicy, idealny kontur
[ach-snajper] ach-snajper.svg                   Motyw: oko
[ach-tygodniowy-rytm] ach-tygodniowy-rytm.svg   Motyw: 7 kręgów / odcinek szyjny
[ach-miesieczna-dyscyplina] ach-miesieczna-dyscyplina.svg Motyw: dłoń (30 paliczków skojarzenie — albo księżyc anatomiczny nie; dłoń)
[ach-kwartalna-konsekwencja] ach-kwartalna-konsekwencja.svg Motyw: szkielet półpostać
[ach-wszechstronny] ach-wszechstronny.svg       Motyw: czaszka + klatka (całość)
[ach-nocny-maratonczyk] ach-nocny-maratonczyk.svg Motyw: przekrój oka / źrenica
[ach-wczesny-ptak] ach-wczesny-ptak.svg         Motyw: krtań/ptasia? NIE. Wschód = oko w przekroju innym kadrze albo małżowina. Albo kogut NIE.
                                                Dobierz: małżowina uszna (wstawać) albo tęczówka.
```

Wspólne: emblemat, svg currentColor, 0 0 64 64, Gray, ta sama kreska co rangi.

---

## PACZKA E — Emblematy przedmiotów KNNP (Gray + Sobotta w JEDNYM atlasie — wybierz Gray i trzymaj)

Czytelne przy 32 px, 0 0 64 64, currentColor. Jeden contact sheet, wszystkie w jednym rzędzie/siatce. **Nie zastępują Tablera na małych kaflach, dopóki nie sprawdzimy czytelności** — i tak je chcemy, bo wejdą jako tło karty przedmiotu / marketing katalogu.

```
[subj-anatomia] subj-anatomia.svg                 Motyw: czaszka bok
[subj-histologia] subj-histologia.svg             Motyw: przekrój tkanki / nabłonek — TYLKO jeśli linia; inaczej: komórka jajowa/pęcherzyk Gray
[subj-biofizyka] subj-biofizyka.svg               Motyw: oko (optyka) albo ucho (akustyka)
[subj-biologia] subj-biologia.svg                 Motyw: mitoza/chromosomy jeśli linia; inaczej: dłoń
[subj-chemia] subj-chemia.svg                     Motyw: retorta / kolba XIX w.
[subj-biochemia] subj-biochemia.svg               Motyw: inna kolba + wężownica
[subj-fizjologia] subj-fizjologia.svg             Motyw: serce
[subj-mikrobiologia] subj-mikrobiologia.svg       Motyw: bakteria/ziarniak jeśli linia z atlasu; inaczej: mikroskop XIX w.
[subj-mikrobio-ju] subj-mikrobio-ju.svg           Motyw: ząb + płytka (korona z osadą liniową)
[subj-farmakologia] subj-farmakologia.svg         Motyw: roślina lecznicza (Digitalis/Belladonna z atlasu botanicznego XIX — jeśli miesza atlas,
                                                  ZOSTAŃ w Gray: żołądek/jelito jako „droga leku” albo nerka)
[subj-patologia] subj-patologia.svg               Motyw: płuco kontur albo wątroba
[subj-patofizjologia] subj-patofizjologia.svg     Motyw: serce + aorta (inny kadr niż fizjologia)
[subj-immunologia] subj-immunologia.svg           Motyw: węzeł chłonny / śledziona
[subj-zakazne] subj-zakazne.svg                   Motyw: płuco albo skóra/osutka liniowa; zapas: czaszka
[subj-angielski] subj-angielski.svg               Motyw: krtań / język anatomiczny
[subj-socjologia] subj-socjologia.svg             Motyw: dwie czaszki / dwie figury szkielet (Albinus para)
[subj-prof-humanizm] subj-prof-humanizm.svg       Motyw: dłoń (dotyk, opieka)
[subj-narzad-zucia] subj-narzad-zucia.svg         Motyw: mięśnie żucia / masseter na czaszce
[subj-biologia-mol] subj-biologia-mol.svg         Motyw: podwójna helisa NIE (za współczesne). Chromosomy/jądro komórki z atlasu.
```

Wspólne pola: `/przedmioty`, tło karty albo emblemat 48–64 px, svg currentColor, Opacity 1.0 emblemat / 0.18 jeśli użyte jako tło (dostarcz jedną wagę kreski; Cursor da opacity).

---

## PACZKA F — Emblematy przedmiotów LDEW (Gray albo Black — **jeden** atlas na całą F)

LDEW live: zachowawcza, endo, perio, śluzówka, pedo, orto, protetyka, chirurgia stom. (na prod 8 kafli). Na zapas też: ChST, radiologia, zdrowie publiczne, orzecznictwo.

```
[ldew-zachowawcza] ldew-zachowawcza.svg           Motyw: trzonowiec przekrój (ubytki)
[ldew-endodoncja] ldew-endodoncja.svg             Motyw: ząb przekrój z kanałami
[ldew-periodontologia] ldew-periodontologia.svg   Motyw: ząb w zębodole + ozębna
[ldew-sluzowka] ldew-sluzowka.svg                 Motyw: podniebienie / język grzbiet
[ldew-pedo] ldew-pedo.svg                         Motyw: ząb mleczny vs zawiązek stałego
[ldew-ortodoncja] ldew-ortodoncja.svg             Motyw: łuk zębowy z zgryzem / dwa łuki
[ldew-protetyka] ldew-protetyka.svg               Motyw: żuchwa bezzębna bok
[ldew-chirurgia] ldew-chirurgia.svg               Motyw: żuchwa + kleszcze (albo ząb mądrości)
[ldew-chst] ldew-chst.svg                         Motyw: czaszka podstawa / oczodół (ChST)
[ldew-radiologia] ldew-radiologia.svg             Motyw: czaszka bok (projekcja boczna)
[ldew-zdrowie-pub] ldew-zdrowie-pub.svg           Motyw: szkielet całej postaci (populacja)
[ldew-orzecznictwo] ldew-orzecznictwo.svg         Motyw: czaszka en face „identyfikacja”
```

Format: svg currentColor, 0 0 64 64, czytelne przy 32 px, contact sheet 12 w siatce. Ta sama kreska.

Dodatkowo **wersje tła karty** (większy kadr, nie ikona):

```
[ldew-card-zachowawcza] … [ldew-card-orzecznictwo]
  Przeznaczenie: tło karty
  Format: svg sage
  Rozmiar: ~0 0 800 600
  Opacity: 0.18
  Motyw: ten sam obiekt co emblemat, luźniejszy kadr, może wychodzić poza
```

Tak: 12 emblematów + 12 teł kart = 24 SVG w F. Warto.

---

## PACZKA G — Atlas zębów i twarzoczaszki (G.V. Black; Gray na kości/nerwy)

Rozdziel na G-Black i G-Gray, dwa contact sheety.

### G-Black — zęby (każdy: korona, korzeń, przekrój)

Dla klas: siekacz przyśrodkowy górny, siekacz boczny, kieł, przedtrzonowiec, trzonowiec górny, trzonowiec dolny, mleczny siekacz, mleczny trzonowiec.

```
[tooth-incisor-crown] [tooth-incisor-root] [tooth-incisor-section]
[tooth-lateral-crown] [tooth-lateral-root] [tooth-lateral-section]
[tooth-canine-crown] [tooth-canine-root] [tooth-canine-section]
[tooth-premolar-crown] [tooth-premolar-root] [tooth-premolar-section]
[tooth-molar-upper-crown] [tooth-molar-upper-root] [tooth-molar-upper-section]
[tooth-molar-lower-crown] [tooth-molar-lower-root] [tooth-molar-lower-section]
[tooth-dec-incisor] [tooth-dec-molar]
```

Format: svg currentColor + svg sage (tła). viewBox 0 0 128 128 (zęby muszą czytać się też przy 48 px). Sam obiekt.

### G-Gray — twarz, nerwy, ślinianki, żucie

```
[anat-skull-lat] anat-skull-lat.svg                 czaszka bok
[anat-skull-front] anat-skull-front.svg             czaszka przód
[anat-skull-base] anat-skull-base.svg               podstawa czaszki
[anat-orbit] anat-orbit.svg                         oczodół
[anat-maxilla] anat-maxilla.svg                     szczęka
[anat-mandible-lat] anat-mandible-lat.svg           żuchwa bok
[anat-mandible-front] anat-mandible-front.svg       żuchwa przód
[anat-tmj] anat-tmj.svg                             staw skroniowo-żuchwowy
[anat-trigeminal] anat-trigeminal.svg               n. V
[anat-facial-n] anat-facial-n.svg                   n. VII
[anat-cranial-nerves] anat-cranial-nerves.svg       nerwy czaszkowe zestaw
[anat-salivary] anat-salivary.svg                   ślinianki
[anat-masseter] anat-masseter.svg                   mięśnie żucia
[anat-mimic] anat-mimic.svg                         mięśnie mimiczne
[anat-tongue] anat-tongue.svg                       język
[anat-palate-line] anat-palate-line.svg             podniebienie LINIA (nie szraf)
[anat-deciduous-arch] anat-deciduous-arch.svg       uzębienie mleczne
[anat-permanent-arch] anat-permanent-arch.svg       uzębienie stałe
[anat-vessels-head] anat-vessels-head.svg           naczynia głowy i szyi
```

Format tła: svg sage, ~1200 px viewBox. Format emblematu: svg currentColor 64. **Dla każdej pozycji G-Gray daj OBA** (tło + emblemat), chyba że obiekt ginie przy 64 px — wtedy tylko tło i napisz to w evencie.

### G-Gray ciało (kierunek lekarski / KNNP)

```
[anat-heart] anat-heart.svg
[anat-aorta] anat-aorta.svg
[anat-lungs-line] anat-lungs-line.svg          TYLKO kontur płatów, zero stipple
[anat-brain-sagittal] anat-brain-sagittal.svg
[anat-spine] anat-spine.svg
[anat-vertebra] anat-vertebra.svg
[anat-hand] anat-hand.svg
[anat-foot] anat-foot.svg
[anat-eye] anat-eye.svg
[anat-ear] anat-ear.svg
[anat-kidney] anat-kidney.svg
[anat-liver] anat-liver.svg
[anat-stomach] anat-stomach.svg
[anat-skeleton-full] anat-skeleton-full.svg
[anat-thorax] anat-thorax.svg
[anat-pelvis] anat-pelvis.svg
```

To samo: sage tło + currentColor emblemat gdzie się da.

---

## PACZKA I — Niebo / nawigacja (Cellarius **albo** Flamsteed — wybierz jeden, trzymaj)

ZENIT LABS, ANTARES (silnik sesji), KALIBRA (kalibracja pewności). Marketing będzie tym oddychał.

```
[sky-zenit] sky-zenit.svg
  Gdzie:        ZENIT LABS, /kalkulator, footer brand
  Przeznaczenie: hero | emblemat
  Motyw:        zenit nieba — sklepienie z siatką, gwiazda w zenicie
  Format:       svg gold (hero) + svg currentColor (mark-zenit-labs)
  Kolor:        gold / currentColor
  Rozmiar:      hero ~0 0 1800 1200 · mark 0 0 64 64
  Opacity:      0.30 hero / 1.0 mark
```

```
[sky-antares] sky-antares.svg
  Gdzie:        tryb inteligentna sesja, marketing „adaptacyjna nauka”
  Przeznaczenie: tło sekcji + emblemat
  Motyw:        Skorpion / Antares na mapie nieba, siatka południków
  Format:       svg sage + svg currentColor
  Kolor:        sage
  Rozmiar:      tło ~0 0 1600 1200 · mark 0 0 64 64
```

```
[sky-kalibra] sky-kalibra.svg
  Gdzie:        kalibracja pewności, podsumowanie sesji
  Przeznaczenie: tło + emblemat
  Motyw:        astrolabium ALBO sekstant (pomiar, kalibracja instrumentu)
  Format:       svg sage + svg currentColor
  Kolor:        sage
```

```
[sky-cellarius-full] sky-cellarius-full.svg     pełna mapa hemisfery, tło CTA / OG
[sky-grid] sky-grid.svg                         sama siatka południków (pattern)
[sky-rose] sky-rose.svg                         róża wiatrów
[sky-sextant] sky-sextant.svg                   sekstant
[sky-astrolabe] sky-astrolabe.svg               astrolabium (jeśli kalibra to sekstant, tu astrolabium i odwrotnie)
[sky-constellation-01] … [sky-constellation-08]
  Motyw:        8 różnych gwiazdozbiorów z siatką (zapas na sekcje, osiągnięcia, tryby)
  Format:       svg sage + 8× currentColor 64
```

```
[mode-inteligentna] mode-inteligentna.svg       = antares mark (może być alias sky-antares-mark)
[mode-przeglad] mode-przeglad.svg               Motyw: róża wiatrów (swobodny przegląd)
[mode-katalog] mode-katalog.svg                 Motyw: siatka nieba / katalog gwiazd Flamsteed
```

---

## PACZKA J — Narzędzia i satyra (Hunter albo Black — jeden)

```
[tool-forceps] tool-forceps.svg                 kleszcze
[tool-elevator] tool-elevator.svg               dźwignia
[tool-mirror] tool-mirror.svg                   lusterko
[tool-probe] tool-probe.svg                     zgłębnik
[tool-key] tool-key.svg                         klucz dentystyczny XVIII w.
[tool-bow-drill] tool-bow-drill.svg             wiertło łukowe
[scene-extraction] scene-extraction.svg         scena ekstrakcji (404/onboarding)
[scene-waiting] scene-waiting.svg               poczekalnia / kolejka (empty reviews)
[scene-itinerant] scene-itinerant.svg           wędrowny dentysta (onboarding)
```

Format: tła svg sage duże + emblematy currentColor 64 gdzie narzędzie jest pojedyncze.

---

## PACZKA K — Histologia / biochemia / farmakologia / mikro (jeden atlas)

Emblematy 64 + kilka teł. Jeśli Gray nie ma botaniki — **Sobotta albo atlas botaniczny XIX, ale CAŁA paczka K z jednego źródła**.

```
[histo-epithelium] [histo-bone] [histo-cartilage] [histo-tooth-germ] [histo-enamel-organ]
[chem-retort] [chem-alembic] [chem-balance] [chem-flask]
[pharma-digitalis] [pharma-opium-poppy] [pharma-cinchona] [pharma-belladonna]
[micro-cocci] [micro-bacilli] [micro-spirochete] [micro-microscope]
```

svg currentColor 64 + wybrane tła sage (retort, microscope, tooth-germ, digitalis) ~1200.

---

## PACZKA L — Social / OG (SVG do wklejenia w opengraph-image albo jako tło 1200×630)

OG dziś jest czysty typo (`app/opengraph-image.tsx`, 1200×630, bg `#002A27`). Chcemy rycinę z prawej.

```
[og-ldek] og-ldek.svg
  Gdzie:        opengraph-image, Twitter
  Przeznaczenie: hero
  Motyw:        ten sam co hero-ldek-palate, kadr 1200×630 (viewBox 0 0 1200 630),
                obiekt po prawej, lewe 55% puste pod napis
  Format:       svg gold
  Kolor:        gold
  Opacity:      0.35
```

```
[og-ldew] og-ldew.svg          Motyw: żuchwa, kadr 1200×630
[og-knnp] og-knnp.svg          Motyw: szkielet/czaszka
[og-antares] og-antares.svg    Motyw: mapa nieba Antares (atlas I — jeśli tak, produkuj w I i tu tylko eksport kadru)
```

---

## PACZKA M — Warianty kadru (nie nowe motywy)

Dla **każdego hero i tła sekcji z paczki A** daj dodatkowo:
- `*-right.svg` — obiekt na prawo (default)
- `*-left.svg` — lustrzane / kadr lewy (RTL zapas, inne sekcje)
Nie lustruj anatomii nerwów i serca (strona anatomiczna ma znaczenie). Tam: inny kadr, nie flip.

---

## Priorytet produkcji (gdyby ciąć na tury)

Nie tnij bez potrzeby — chcemy wszystko. Gdyby jednak kolejka:

1. **A1 + A2 + A6** — landing działa wizualnie (hero, sesja, dwie ścieżki)
2. **B3 404 + B1 auth + L OG**
3. **I niebo** (ZENIT/ANTARES/KALIBRA) — to jest język marki
4. **C znaki produktów + D rangi**
5. **F LDEW + E KNNP** emblematy
6. **G atlas zębów/twarzy**
7. Reszta (J, K, M, empty, pricing)

---

## Event zwrotny — wymagany format

Dla każdej pozycji:
- id, plik, atlas, tablica/Commons URL
- viewBox, bytes, gzip bytes
- gold | sage | currentColor
- czy zamiennik (i z czego)
- czy kreska gęsta pod opacity X

Na końcu: contact sheety per paczka + jeden **indeks wszystkich ID**.

Nie wysyłaj PNG jako „wersji produkcyjnej”. SVG albo zamiennik liniowy SVG.
