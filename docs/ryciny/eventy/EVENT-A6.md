# EVENT — PACZKA A6 (ścieżki `#dla-kogo`, karty produktu), tura 2

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| path-stoma-skull | path-stoma-skull.svg, -currentColor.svg | Gray 1918, **Gray1003** (szczęka + żuchwa z uzębieniem, bok) | 0 0 1400 1000 | 124 221 | 50 909 | sage / currentColor | **TAK** |
| path-lek-heart-lungs | path-lek-heart-lungs.svg, -currentColor.svg | Gray 1918, **Gray0492** (serce, powierzchnia przednia + naczynia wieńcowe) | 0 0 1400 1000 | 163 374 | 66 305 | sage / currentColor | **TAK** |
| path-stoma-tmj | path-stoma-tmj.svg | Gray 1918, **Gray0183** (żuchwa bok — gałąź + wyrostek kłykciowy) | 0 0 1200 1200 | 57 784 | 23 393 | sage | **TAK** |
| path-lek-skeleton | path-lek-skeleton.svg | Gray 1918, **Gray0621** (klatka piersiowa — żebra + kręgosłup) | 0 0 1200 1600 | 203 499 | 82 804 | sage | nie |

## Zamienniki — co i dlaczego

**path-stoma-skull** — zamówienie chce „oczodół + szczęka + zęby". Oczodołu nie ma: w zestawie brak
czaszki bocznej (patrz EVENT-A1 §2). Dałem szczękę + żuchwę z pełnym uzębieniem, kadr landscape,
obiekt wychodzi prawą i dolną krawędzią karty (karta ma `overflow-hidden`, więc to działa).
**Uwaga: to ta sama tablica co `hero-ldek-skull-oblique`**, inny kadr i inne proporcje. Świadome —
karta „Stomatologia" i hero LDEK mają być spokrewnione wizualnie, ale jeśli chcesz je rozjechać,
podmienię kartę na `Gray1013` (jama ustna) albo `Gray0193` (czaszka strzałkowo) po hi-res.

**path-lek-heart-lungs** — płuc nie ma w zestawie jako plansza liniowa, a zamówienie samo daje
fallback „jak szraf — serce + aorta + tchawica". Testowałem **Gray0473** (łuk aorty + tętnice płucne,
czysta linia, 14 KB) — po renderze na zieleni przy `op 0.20` wychodzą same cienkie rurki w powietrzu,
karta wygląda na pustą. Zostaje serce z naczyniami wieńcowymi, kadr landscape, prawa strona karty.

**path-stoma-tmj** — zamówienie chce staw skroniowo-żuchwowy. Panewki (dołu żuchwowego kości skroniowej)
w zestawie nie ma, bo nie ma czaszki. Dałem **żuchwową połowę stawu**: gałąź + wyrostek kłykciowy
w kadrze kwadratowym. Czyta się jako „staw", ale anatomicznie to połowa. 23 KB, najczystszy plik w paczce.

## Kompromisy

- **path-lek-heart-lungs** dziedziczy po `hero-lek-heart` trzy podpisy kursywą na mięśniu sercowym
  („Right", „Left ventricle", strzęp). Ta sama przyczyna i ta sama rada: 30 s w Illustratorze albo Gray490 hi-res.
- **path-lek-skeleton** — żebra i kręgosłup czytają się dobrze, ale między nimi została faktura
  pnia współczulnego i naczyń z oryginału (to plansza limfatyczna, nie osteologiczna). Przy `op 0.18`
  wygląda to jak cieniowanie klatki, nie jak błąd — ale to nie jest czysty szkielet.
- Kadry `path-*` są dobrane pod kartę z `overflow-hidden` i kotwicą prawo-dół; przy innym kadrze
  w Cursorze obiekt może wejść pod tekst.

## Parametry

| id | crop | t1 | threshold | turdsize | canvas | zoom | kotwica |
|---|---|---|---|---|---|---|---|
| path-stoma-skull | 18,60,470,430 | 34 | 185 | 70 | 1500 | 1.20 | prawo-dół |
| path-lek-heart-lungs | 50,96,596,478 | 22 | 185 | 18 | 1600 | 1.06 | prawo, y 0.55 |
| path-stoma-tmj | 0,0,300,420 | 22 | 185 | 20 | 1500 | 1.05 | środek |
| path-lek-skeleton | 150,175,445,465 | 30 | 185 | 40 | 1400 | 1.34 | środek, y 0.28 |

Źródło: Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Skan: UNSW Embryology, https://embryology.med.unsw.edu.au/embryology/index.php/Anatomy_of_the_Human_Body_by_Henry_Gray
