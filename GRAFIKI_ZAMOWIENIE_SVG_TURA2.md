# ZAMÓWIENIE RYCIN — tura 2 (rodziny, których nie ma)

Jedna wiadomość do bota **Ryciny**. Tura 1 (278 SVG) jest w produkcji: Gray, Black 128 px, Cellarius, LDEW-card 800×600, pharma-rośliny, histo TYLKO jako znaczki 64 px. Nie powtarzaj tego, co już leży w `/public/img/ryciny/`.

**Konsument:** Cursor, Next.js, `/public/img/ryciny/`.  
**Producent:** skan z domeny publicznej → SVG. Nie AI-obrazy. Nie rysunek od zera.

Cel tury: rozbudować portfolio o 4 gatunki, których aplikacja nie ma w skali „płyta”:

1. histologia / komórka (duży kadr)
2. szkło laboratoryjne + bakterie
3. szkielet całej postaci
4. uniwersalne atmosfery + stomatologia w skali karty (nie 64 px)

Estetyka już ustalona — naśladuj turę 1, nie wymyślaj języka.

---

## 0. Twarde wymogi (czytaj zanim cokolwiek wyeksportujesz)

### Format

- **Wyłącznie SVG.** PNG/JPEG/WebP — nie. Contact sheet jako SVG (ew. jeden PNG oprócz, nie zamiast).
- Plansze tonalne (stipple, gęsty szraf Albinusa, Sobotty, Kocha): **nie wektoruj szrafu**. Wyciągnij warstwę kreski / kontur, potrace, agresywna redukcja. Cel gzip: tło **< 80 KB**, karta 800×600 **< 50 KB**, emblemat **< 15 KB**. Jeśli potrace daje plamę albo >200 KB — zamień na inną planszę LINIOWĄ z tego samego atlasu i napisz w evencie którą. Nie odpuszczaj SVG.
- Minifikacja obowiązkowa. Zero fontów, zero `<image>`, zero rastra, zero data-URI.
- Usuń **wszystkie** podpisy: łacina, angielski, numery tablic, skale, litery przy strukturach. Zero liter na rycinie.
- Widok: sam obiekt, dużo powietrza, cienka kreska, bez wypełnień, bez gradientów, bez poświat.

### Kolor (kreska ≠ token UI)

Aplikacja jest **dark-only**. Contact sheety na `#002A27`, nie na białym.

| Token ryciny | Hex | Kiedy |
|---|---|---|
| gold | `#CDB56E` | tylko paczka P (szkielet) — max 2 pliki gold |
| sage | `#7FA697` | karty, tła, atmosfery |
| currentColor | — | emblematy 64 px |

Tła apki (do sheetu): `--bg` `#002A27` · `--card` `#0a2322` · UI gold `#C9A84C` · UI sage `#367368`.

Gęstość kreski pod opacity, które i tak nałoży Cursor:

- tło strony 0.09–0.14
- tło karty 0.16–0.22
- figura 0.50–0.65
- emblemat 1.0

### Atlas — jedna ręka na paczkę

Nie mieszaj Sobotty z Wellcome w jednym zestawie.

| Paczka | Atlas (obowiązkowy) | Zakaz |
|---|---|---|
| N histologia / komórka | Sobotta 1906 ALBO Kölliker *Gewebelehre* — jeden na całą N | Gray (tkanki z Graya są za anatomiczne; to ma być **przekrój tkanki**, nie narząd) |
| O laboratorium + mikro | Wellcome XIX w.: *chemical apparatus* + atlas bakteriologiczny (Cohn / Koch / Lehmann-Neumann). Jeden atlas na szkło, jeden na bakterie — napisz które. | Nie podstawiaj nabłonka jako bakterii. Nie podstawiaj tojadu jako kolby. |
| P figura ludzka | Albinus, *Tabulae sceleti et musculorum corporis humani*, 1747. Commons: `Category:Tabulae_sceleti_et_musculorum_corporis_humani` | Gray (w Grayu z Commons nie ma całej postaci w użytecznej rozdzielczości — tura 1 to potwierdziła) |
| Q stomatologia płyty | G.V. Black (ten sam zestaw 400 ppi co tura 1, paczka G-Black) | Gray — zęby Blacka mają inną rękę i tak ma być; ta paczka jest świadomie Black |
| R uniwersalne | Hunter (narzędzia / gabinet) ALBO Flamsteed/Cellarius (instrument naukowy, **nie** mapa nieba — mapy już są). Jeden atlas na całą R. | Nie rób kolejnych `sky-antares` / `sky-kalibra` / `sky-constellation-*` |

Jeśli motywu nie ma liniowo: zamiennik liniowy z **tego samego** atlasu + event. Nie PNG.

### Czego NIE robić

- Nie powtarzaj ID z tury 1. Szczególnie: `anat-*`, `ldew-card-zachowawcza`…`orzecznictwo`, `pharma-aconitum` / `hellebore` / `opium-poppy`, `histo-*` 64 px (te znaczki już są — tu zamawiamy **płyty**), `sky-*`, `scene-waiting` / `extraction` / `itinerant`, `sec-progress-brain`, `sec-session-trigeminal`, `hero-ldek-*`, `og-*`.
- Nie skaluj znaczków 64 px na kartę 800×600. To wychodzi plama. Nowa wektoryzacja z pełnej tablicy.
- Nie dawaj `currentColor` na płytach sage (Cursor ładuje je przez `<img>`).
- Contact sheet: etykiety ID tylko na sheecie.

### Dostawa każdej paczki

1. SVG nazwane jak `id`, do `/public/img/ryciny/`.
2. Contact sheet na `#002A27`, kreska sage/gold, etykiety ID.
3. Tabela: id · atlas · tablica · URL Original file · viewBox · bytes · gzip · kreska.
4. Event: co wzięte dosłownie, co zamienione, co odrzucone po QA.

Wzorzec wstawienia (nie wymyślaj innego):

```css
.plate { position: absolute; pointer-events: none; /* maska radialna desktop, liniowa mobile */ }
.emblem { color: var(--rycina-sage, #7FA697); width: 48px; height: 48px; }
```

---

## PACZKA N — Histologia i komórka (płyty, nie znaczki)

Tura 1 dała `histo-epithelium` / `cartilage` / `bone` / `enamel-organ` / `tooth-germ` wyłącznie jako 64×64 `currentColor`. Na karcie przedmiotu i w nagłówku są bezużyteczne. Ta paczka to **ten sam motyw w skali płyty**.

Wszystko: svg sage `#7FA697`. Bez wariantu `currentColor` (chyba że napisane).  
Karty przedmiotów: `viewBox 0 0 800 600`, kadr luźny, kotwica prawo-dół, obiekt wychodzi poza kartę — jak `ldew-card-*` z tury 1.  
Płyty atmosfery: `~0 0 1400 1000`, obiekt prawo, lewa powietrze.

```
[knnp-card-histologia] knnp-card-histologia.svg
  Gdzie:        karta + nagłówek stoma-histologia / lek-histologia
  Przeznaczenie: tło karty 800×600
  Motyw:        nabłonek wielowarstwowy ALBO chrząstka szklista w przekroju — ma się CZYTAĆ
                jako tkanka pod mikroskopem (komórki + macierz), nie jako nerka i nie jako ząb
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Kadr:         fragment preparatu, nie cała tablica z 20 polami
  Opacity:      0.18
  Uwagi:        dziś w apce stoi anat-kidney — to proteza. Ta płyta ją zdejmuje.
```

```
[knnp-card-biologia-mol] knnp-card-biologia-mol.svg
  Gdzie:        karta lek-biologia-mol
  Przeznaczenie: tło karty 800×600
  Motyw:        komórka z jądrem i jąderkiem / mitoza (metafaza) / przekrój jądra —
                z atlasu histologicznego, NIE mózg
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Kadr:         jedna komórka albo wrzeciono podziałowe, dużo macierzy wokół
  Opacity:      0.18
  Uwagi:        dziś stoi anat-brain-sagittal. Mózg ≠ biologia molekularna.
```

```
[knnp-card-immunologia] knnp-card-immunologia.svg
  Gdzie:        karta lek-immunologia
  Przeznaczenie: tło karty 800×600
  Motyw:        węzeł chłonny w przekroju ALBO śledziona (miazga biała) — Sobotta/Kölliker
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Opacity:      0.18
  Uwagi:        dziś anat-thorax (klatka). Immunologia ma mieć tkankę limfatyczną, nie żebra.
```

```
[histo-plate-epithelium] histo-plate-epithelium.svg
  Gdzie:        nagłówek przedmiotu / tło pustego stanu histologii / zapas
  Przeznaczenie: tło sekcji
  Motyw:        ten sam nabłonek co knnp-card-histologia, luźniejszy kadr, więcej powietrza
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Kadr:         prawo, fade w lewo
  Opacity:      0.12
  Uwagi:        NIE jest to powiększenie pliku histo-epithelium.svg z tury 1.
                Nowa wektoryzacja z pełnej tablicy.
```

```
[histo-plate-enamel] histo-plate-enamel.svg
  Gdzie:        zapas LDEW (zachowawcza / pedo) i histologia stomatologiczna
  Przeznaczenie: tło karty albo sekcji
  Motyw:        narząd szkliwotwórczy / zawiązek zęba w przekroju histologicznym
                (nie Black, nie Gray osteologia)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Opacity:      0.18
  Uwagi:        to jest mostek „nauka ↔ stomatologia”. Ma być widać szkliwo/zębinę jako TKANKI.
```

```
[histo-plate-cartilage] histo-plate-cartilage.svg
  Gdzie:        zapas (fizjologia / histologia / narząd żucia)
  Przeznaczenie: tło
  Motyw:        chrząstka szklista — chondrocyty w jamkach, macierz
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Opacity:      0.16
```

QA paczki N: przy opacity 0.18 na `#1E3F44` musi być widać, że to preparat, nie plama. Jeśli Sobotta jest za tonalna — Kölliker drzeworyt liniowy. Event: która tablica wygrała i dlaczego.

---

## PACZKA O — Laboratorium i mikrobiologia

Jedyna dziura z tury 1, której nie da się załatać Grayem. Chemia w apce stoi na tojadzie. Mikrobiologia nie ma nic. Biochemia stoi na ciemierniku.

Szkło: jeden atlas aparatury (Wellcome, hasła: `chemical apparatus`, `retort`, `alembic`, `balance`, `flask`).  
Bakterie: jeden atlas bakteriologiczny (nie Sobotta — tam są tkanki, nie drobnoustroje).

```
[knnp-card-chemia] knnp-card-chemia.svg
  Gdzie:        karta stoma-chemia
  Przeznaczenie: tło karty 800×600
  Motyw:        retorta ALBO kolba destylacyjna w statywie — szkło, nie roślina
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Kadr:         naczynie prawo-dół, wychodzi poza kartę
  Opacity:      0.18
  Uwagi:        zdejmuje pharma-aconitum z tej karty.
```

```
[knnp-card-biochemia] knnp-card-biochemia.svg
  Gdzie:        karta stoma-biochemia / lek-biochemia
  Przeznaczenie: tło karty 800×600
  Motyw:        waga analityczna ALBO alembik — INNY obiekt niż knnp-card-chemia
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Opacity:      0.18
  Uwagi:        zdejmuje pharma-hellebore. Chemia i biochemia nie mogą mieć tej samej kolby.
```

```
[knnp-card-mikrobio] knnp-card-mikrobio.svg
  Gdzie:        karta stoma-mikrobio / lek-mikrobio
  Przeznaczenie: tło karty 800×600
  Motyw:        dwoinki / gronkowce / pałeczki pod mikroskopem — rozproszone komórki, nie jeden „robak”
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Opacity:      0.18
  Uwagi:        platforma egzaminacyjna. Nabłonek jako „bakterie” = błąd merytoryczny, nie skrót.
                Jeśli atlas daje tylko jedną pałeczkę w kółku — weź tablicę z polem widzenia.
```

```
[chem-retort] chem-retort.svg
  Gdzie:        zapas / tło dialogu / chemia nagłówek
  Przeznaczenie: tło sekcji
  Motyw:        klasyczna retorta na statywie, profil
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1000 1400 (portret — naczynie jest wysokie)
  Opacity:      0.14
```

```
[chem-balance] chem-balance.svg
  Gdzie:        zapas biochemia / uniwersalne „pomiar”
  Przeznaczenie: tło
  Motyw:        waga szalkowa laboratoryjna XIX w.
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Opacity:      0.14
```

```
[micro-microscope] micro-microscope.svg
  Gdzie:        ładowanie sesji przedmiotów naukowych / uniwersalna atmosfera
  Przeznaczenie: tło sekcji (fullscreen cover)
  Motyw:        mikroskop złożony XIX w. (tubus, rewolwer, stolik) — cały instrument, nie sam okular
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1600
  Kadr:         instrument centralnie-prawo, dużo powietrza
  Opacity:      0.12
  Uwagi:        to jest też płyta UNIWERSALNA. Może wejść na ładowanie zamiast sky-antares
                przy histologii/mikro/chemii. Kreska czytelna przy object-cover na całe viewport.
```

```
[micro-cocci] micro-cocci.svg
  Gdzie:        zapas + ewentualny kafelek trybu
  Przeznaczenie: tło albo duży znak
  Motyw:        ziarenkowce (gronkowce albo dwoinki) — pole widzenia
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Opacity:      0.16
```

```
[micro-bacilli] micro-bacilli.svg
  Gdzie:        zapas
  Przeznaczenie: tło
  Motyw:        pałeczki (np. laseczki) — inne niż cocci
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Opacity:      0.16
```

```
[micro-spirochete] micro-spirochete.svg
  Gdzie:        zapas (zakaźne / mikro / kiła w KNNP)
  Przeznaczenie: tło
  Motyw:        krętki — kilka spiral w polu, nie jedna nitka
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 900
  Opacity:      0.16
```

```
[subj-chemia] subj-chemia.svg
  Gdzie:        emblemat karty, gdy nie ma miejsca na płytę
  Przeznaczenie: emblemat
  Motyw:        retorta uproszczona do 64 px
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
  Uwagi:        tura 1 tego nie dostarczyła. Czytelne przy 32 px.
```

```
[subj-biochemia] subj-biochemia.svg
  Format:       svg currentColor · 0 0 64 64
  Motyw:        waga ALBO kolba z inną sylwetką niż subj-chemia
```

```
[subj-mikrobiologia] subj-mikrobiologia.svg
  Format:       svg currentColor · 0 0 64 64
  Motyw:        mikroskop ALBO trzy cocci — testuj przy 32 px. Jeśli mikroskop ginie, dawaj cocci.
```

QA paczki O: trzy karty KNNP muszą być rozpoznawalne obok siebie (szkło ≠ waga ≠ bakterie). Emblematy nie mogą być tą samą kolbą w trzech skalach.

---

## PACZKA P — Cała figura (Albinus 1747)

Tura 1 cztery razy odbiła się od braku szkieletu całej postaci w Grayu z Commons. Jeden atlas, jedna ręka, cztery pliki. To jedyne złoto w tej turze.

Źródło: Albinus, *Tabulae sceleti et musculorum*. **Linia kości**, nie muscle-man w szrafie. Jeśli tablica mięśni jest tonalna — bierz tablicę szkieletu.

```
[anat-skeleton-full] anat-skeleton-full.svg
  Gdzie:        uniwersalne tło (KNNP, zdrowie publiczne, zapas hero)
  Przeznaczenie: tło sekcji / hero zapas
  Motyw:        szkielet całej postaci, en face albo 3/4, stojący
  Format:       svg sage + svg gold [anat-skeleton-full-gold.svg]
  Kolor:        sage (główny) · gold (wariant hero)
  Rozmiar:      ~0 0 1200 1800 portret
  Kadr:         cała figura albo półpostać od czaszki do miednicy; stopy mogą wychodzić dołem
  Opacity:      0.10 strona / 0.28 hero gold
  Uwagi:        JEDEN wektor, dwa kolory. Nie dwie różne tablice.
```

```
[ldew-card-zdrowie-pub] ldew-card-zdrowie-pub.svg
  Gdzie:        karta ldew-zdrowie-publiczne (jedyna LDEW bez płyty)
  Przeznaczenie: tło karty 800×600
  Motyw:        ta sama figura Albinusa, kadr luźniejszy — „populacja / człowiek”, nie klatka piersiowa
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Kadr:         jak ldew-card-*: prawo-dół, wychodzi poza kartę
  Opacity:      0.18
  Uwagi:        tura 1 świadomie nie podstawiła żeber. Nie rób tego i Ty.
```

```
[ldew-zdrowie-pub] ldew-zdrowie-pub.svg
  Gdzie:        emblemat przedmiotu
  Przeznaczenie: emblemat
  Motyw:        sylwetka szkieletu czytelna przy 32 px (cała figura uproszczona, nie sama czaszka)
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
```

```
[ach-wszechstronny] ach-wszechstronny.svg
  Gdzie:        AchievementCard id=wszechstronny (dziś Lucide Globe)
  Przeznaczenie: emblemat
  Motyw:        ta sama figura Albinusa, kadr popiersie+klatka albo cała miniatura — „cały człowiek”
  Format:       svg currentColor
  Kolor:        currentColor
  Rozmiar:      0 0 64 64
  Uwagi:        tura 1: ACH_WITHOUT_FILE. Nie dawaj globu, nie dawaj klatki samej.
```

QA paczki P: przy 64 px widać **człowieka**, nie plamę żeber. Przy 1800 px kreska kości nie zamienia się w atramentowy szraf.

---

## PACZKA Q — Stomatologia w skali płyty (Black)

Tura 1: zęby Blacka są 128×128 (korona/korzeń/przekrój). Na karcie i na fullscreenie ich nie widać. `ldew-card-*` są z Graya i zostają. Ta paczka to **inna rodzina**: sam ząb, duży kadr, uniwersalne tła stomatologiczne (sesja kliniczna, kalkulator, puste stany LDEW).

Jeden atlas: G.V. Black. Nie mieszaj z Grayem.

```
[stoma-plate-molar-section] stoma-plate-molar-section.svg
  Gdzie:        uniwersalne tło LDEW (endo / zachowawcza) · zapas ładowania
  Przeznaczenie: tło sekcji
  Motyw:        trzonowiec w przekroju podłużnym: komora, kanały, furkacja
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1400
  Kadr:         ząb prawie pełną wysokością, korzeń ucięty dołem OK
  Opacity:      0.14
  Uwagi:        NIE jest to scale-up tooth-molar-*-section. Nowa wektoryzacja z pełnej tablicy Blacka.
```

```
[stoma-plate-incisor] stoma-plate-incisor.svg
  Gdzie:        zapas (orto / zachowawcza / uniwersalne)
  Przeznaczenie: tło
  Motyw:        siekacz z korzeniem, profil albo przekrój — inny ząb niż trzonowiec
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1000 1400
  Opacity:      0.14
```

```
[stoma-plate-deciduous] stoma-plate-deciduous.svg
  Gdzie:        pedo / uniwersalne
  Przeznaczenie: tło karty albo sekcji
  Motyw:        ząb mleczny + zawiązek stałego w kości
                (Black ma to lepiej niż Gray1000 przy dużym kadrze — sprawdź)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      0 0 800 600
  Opacity:      0.18
```

```
[stoma-plate-forceps] stoma-plate-forceps.svg
  Gdzie:        chirurgia / kalkulator / uniwersalne „narzędzie”
  Przeznaczenie: tło
  Motyw:        kleszcze ekstrakcyjne — cały instrument, profil
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 900
  Opacity:      0.14
  Uwagi:        tura 1 ma tool-forceps 64 px. To płyta. Jeśli Black nie ma kleszczy — Hunter,
                ale wtedy CAŁA Q-narzędzia z Huntera, a zęby zostają Black. Napisz w evencie.
                Nie mieszaj kleszczy Gray z zębem Black na jednym sheecie bez adnotacji.
```

```
[stoma-plate-key] stoma-plate-key.svg
  Gdzie:        zapas (historia / chirurgia)
  Przeznaczenie: tło
  Motyw:        klucz dentystyczny (dental key) — XIX-wieczny, rozpoznawalny
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 900
  Opacity:      0.14
  Uwagi:        404 już ma dentystę — to ma być narzędzie, nie scena.
```

QA paczki Q: trzonowiec ≠ siekacz z 4 metrów. Kleszcze nie mogą wyglądać jak pęseta.

---

## PACZKA R — Uniwersalne atmosfery

Rzeczy, które można położyć na wielu ekranach bez kłamania „to histologia”. Niebo i trójdzielny już są — nie rób trzeciej mapy.

Wybierz **jeden** atlas na całą R. Preferencja: Hunter (gabinet, instrumenty, stół) — bo Cellarius jest zużyty, a Gray zużyty na narządach.

```
[atm-cabinet] atm-cabinet.svg
  Gdzie:        ustawienia / onboarding / uniwersalne
  Przeznaczenie: tło sekcji
  Motyw:        szafka z narzędziami dentystycznymi / gabinet XIX w. —
                mebel + haki narzędzi, nie satyra z pacjentem (scene-extraction już jest)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1600 1200
  Kadr:         prawo, dużo powietrza lewo
  Opacity:      0.10
```

```
[atm-theater] atm-theater.svg
  Gdzie:        uniwersalne (wybór roku, KNNP „od podstaw”, zapas landingu)
  Przeznaczenie: tło sekcji
  Motyw:        teatr anatomiczny — amfiteatr + stół, linia, bez tłumu twarzy
                (twarze w szrafie = odrzuć)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1600 1200
  Opacity:      0.10
  Uwagi:        jeśli Hunter/Rowlandson jest satyrą z gębami — zamień na przekrój amfiteatru
                architektoniczny. Zostań w medycynie: Wellcome „anatomical theatre”.
                Piranesi — nie.
```

```
[atm-sextant] atm-sextant.svg
  Gdzie:        pulpit wariant / statystyki / uniwersalne „pomiar, kurs”
  Przeznaczenie: tło
  Motyw:        sekstant ALBO astrolabium jako SAM INSTRUMENT,
                bez mapy nieba i bez sygnatur gwiazd
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1200 1200
  Opacity:      0.12
  Uwagi:        tura 1: niebo ma podpisy wygrawerowane w płytę. Tu instrument BEZ liter.
                Flamsteed/Cellarius tylko jeśli da się wyciąć sam przyrząd.
```

### Doklejki Gray (osobny event, nie na sheecie Huntera)

Pelvis i liver są anatomiczne, nie uniwersalne. Nie mieszaj ich na contact sheecie paczki R. Lepiej 3 czyste atmosfery Huntera niż 5 z dwiema rękami.

```
[anat-pelvis] anat-pelvis.svg
  Gdzie:        zapas anatomia / fizjologia (tura 1: brak w zestawie Graya)
  Przeznaczenie: tło
  Motyw:        miednica kostna, widok z góry albo 3/4
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Atlas:        Gray 1918
  Opacity:      0.16
```

```
[anat-liver] anat-liver.svg
  Gdzie:        zapas (biochemia / fizjologia / patologia)
  Przeznaczenie: tło
  Motyw:        sylwetka wątroby z płatami i więzadłem —
                NIE schemat krążenia płodowego (to odrzucono w turze 1)
  Format:       svg sage
  Kolor:        sage
  Rozmiar:      ~0 0 1400 1000
  Atlas:        Gray 1918, tablica z konturem narządu.
                Jeśli znowu jest tylko ductus venosus — ODPUŚĆ i napisz w evencie. Nie wciskaj.
  Opacity:      0.16
```

---

## Priorytet, gdy czas się kończy

Rób w tej kolejności. Nie skacz do Q, póki N i O nie stoją — to one zdejmują protezy z siatki przedmiotów.

1. N: `knnp-card-histologia`, `knnp-card-biologia-mol`, `histo-plate-epithelium`
2. O: `knnp-card-chemia`, `knnp-card-biochemia`, `knnp-card-mikrobio`, `micro-microscope`, trzy emblematy `subj-*`
3. P: `anat-skeleton-full` + `ldew-card-zdrowie-pub` + `ach-wszechstronny`
4. O reszta (`retort`, `balance`, `cocci` / `bacilli` / `spirochete`)
5. N reszta (immunologia, enamel, cartilage)
6. Q (zęby-płyty + narzędzia)
7. R (`cabinet`, `theater`, `sextant`)
8. Doklejki Gray: `pelvis`, `liver` — tylko jeśli tablica jest liniowa

---

## Event — obowiązkowe zdania

Na końcu każdej paczki napisz wprost:

- atlas + tablica + URL Original file
- co jest nową rodziną (tkanka / szkło / bakteria / figura / ząb-płyta / atmosfera)
- czego **nie** podstawiłeś (nerka≠histo, tojad≠chemia, nabłonek≠bakteria, żebra≠populacja)
- które ID odpuściłeś i dlaczego

Contact sheet: ciemny, kreska sage, ID podpisane obok. Osobny sheet na gold (tylko szkielet).
