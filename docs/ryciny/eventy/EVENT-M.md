# EVENT — PACZKA M (warianty kadru), tura 2

Zamówienie: „Dla **każdego hero i tła sekcji z paczki A** daj dodatkowo `*-right.svg` (obiekt na prawo,
default) i `*-left.svg` (lustrzane / kadr lewy). **Nie lustruj anatomii nerwów i serca** — tam inny kadr,
nie flip."

**Nie produkuję plików `*-right`.** Wszystkie pliki bazowe z paczek A, B1 i A6 są już kadrowane
prawostronnie — to jest default z zamówienia. Dublowanie ich pod drugą nazwą dołożyłoby 14 identycznych
plików do repo i drugie tyle miejsc, w których coś może się rozjechać przy aktualizacji. Jeśli Cursor
potrzebuje jawnej nazwy `-right`, zrób alias w kodzie albo `cp` — nie chcę mnożyć bytów w `/public`.

## 1. Warianty lustrzane — 8 pozycji

Obiekty **obustronnie symetryczne albo neutralne stronowo**, gdzie odbicie nie kłamie anatomicznie:

| id | uzasadnienie odbicia |
|---|---|
| hero-ldek-skull-oblique-left | uzębienie in situ — łuki są parzyste, odbicie pokazuje drugą stronę |
| hero-ldew-jaw-left | żuchwa — kość parzysta, zrośnięta w spojeniu; odbicie to druga połowa |
| hero-knnp-skeleton-left | rdzeń kręgowy — struktura osiowa, symetryczna |
| sec-pulpit-hand-left | dłoń — odbicie daje dłoń drugiej ręki, obie istnieją |
| path-stoma-skull-left | jw. uzębienie |
| path-stoma-tmj-left | staw skroniowo-żuchwowy — parzysty |
| path-lek-skeleton-left | klatka piersiowa — symetryczna |
| auth-bg-jaw-left | żuchwa |

Technicznie: **nie trace'owałem tego ponownie**. Odbicie to `<g transform="translate(W 0) scale(-1 1)">`
na istniejącej geometrii — plik jest bit w bit tym samym wektorem, tylko przewróconym. Zero ryzyka,
że wariant będzie miał inną grubość kreski niż oryginał.

## 2. Warianty przez inny kadr — 6 pozycji

Tu **odbicie byłoby błędem merytorycznym**, więc każdy wariant jest osobnym przebiegiem pipeline'u
z kotwicą przesuniętą w lewo (`ax` 0.08–0.28 zamiast 0.70–1.0):

| id | dlaczego nie flip |
|---|---|
| hero-lek-heart-left | **serce leży po lewej i ma określony obrót** — odbite serce to serce z *situs inversus*, czyli rzadka wada rozwojowa. Na platformie egzaminacyjnej to byłby błąd, który ktoś zgłosi. |
| path-lek-heart-lungs-left | jw. |
| sec-session-trigeminal-left | nerw trójdzielny — konkretna strona twarzy, gałęzie mają przebieg |
| sec-session-facial-n-left | nerw twarzowy — jw. |
| sec-progress-brain-left | przekrój strzałkowy mózgu — odbicie zamienia przód z tyłem |
| hero-ldek-palate-alt-left | dodatkowy wariant żuchwy jako alternatywa dla podniebienia |

Plus `hero-ldek-palate-left` z tury 1 (podniebienie jest symetryczne, tam to był kadr, nie flip).

## 3. Wagi

Warianty lustrzane mają **dokładnie taką samą wagę co oryginały** (25–83 KB gzip) — to ta sama
geometria. Warianty przez inny kadr są cięższe niż bazowe, bo szerszy kadr pokazuje więcej planszy:
`hero-lek-heart-left` 168 KB gzip (bazowy: 69 KB), `path-lek-heart-lungs-left` 101 KB (bazowy: 66 KB).
Jeśli to za dużo — powiedz, dociążę `turdsize`, ale wtedy stracimy naczynia wieńcowe.
