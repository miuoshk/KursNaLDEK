# EVENT — PACZKA E (przedmioty KNNP), tura 2

Atlas: **Gray 1918** na cały zestaw, zgodnie z §E zamówienia („wybierz Gray i trzymaj").
`viewBox 0 0 64 64`, `fill="currentColor"`, jedna grubość kreski. Każda pozycja sprawdzona
renderem przy **96 / 48 / 32 px** na `#002A27`.

## 1. Dostarczone — 16 z 19

| id | motyw | tablica | bytes | gzip |
|---|---|---|---|---|
| subj-anatomia | czaszka bok | Gray188 | 44 278 | 19 070 |
| subj-histologia | nabłonek gruczołowy w przekroju | Gray0033 | 63 508 | 27 399 |
| subj-biofizyka | gałka oczna w przekroju (optyka) | Gray869 | 54 437 | 23 373 |
| subj-biologia | łańcuch komórek nabłonkowych z jądrami | Gray0897 | 68 759 | 29 945 |
| subj-fizjologia | serce, powierzchnia tylna | Gray491 | 56 307 | 23 935 |
| subj-mikrobio-ju | zęby w zębodołach z osadem | Gray1003 | 62 437 | 26 381 |
| subj-farmakologia | żołądek („droga leku") | Gray0613 | 43 193 | 18 501 |
| subj-patologia | płuca — kontur płatów | Gray490 | 79 751 | 33 579 |
| subj-patofizjologia | łuk aorty z sercem | Gray0506 | 23 051 | 10 402 |
| subj-immunologia | **węzeł chłonny w przekroju** — kora i rdzeń | Gray0597 | 95 633 | 39 976 |
| subj-zakazne | sieć naczyń chłonnych (szerzenie się) | Gray0598 | 122 995 | 51 171 |
| subj-angielski | język z mięśniami | Gray1019 | 72 088 | 31 279 |
| subj-socjologia | **dwie czaszki zwrócone do siebie** | Gray188 ×2 | 29 335 | 12 933 |
| subj-prof-humanizm | dłoń | Gray0608 | 74 371 | 31 337 |
| subj-narzad-zucia | żuchwa z przyczepem żwacza | Gray0176 | 29 897 | 13 063 |
| subj-biologia-mol | masa komórkowa z jądrami (trofoblast) | Gray0035 | 47 423 | 20 538 |

## 2. `subj-socjologia` — jedyna kompozycja w całym zleceniu

Zamówienie chciało „dwie czaszki / dwie figury szkielet (Albinus para)". Albinusa nie ma,
a w atlasie jest **jedna** czaszka boczna. Zrobiłem to, co przy `auth-bg-skull`: wyciągnąłem tusz
z Gray188, odbiłem lustrzanie i **ustawiłem dwie czaszki naprzeciw siebie** z odstępem 6% szerokości.

Wyszła najlepsza ikona tej paczki: **12,9 KB gzip, czytelna przy 32 px**, i konceptualnie trafia
w socjologię lepiej niż cokolwiek, co dałoby się wyciąć z jednej tablicy. To jest kompozycja z dwóch
kopii tej samej ryciny, nie rysunek — pipeline pozostaje nietknięty.

## 3. NIE zrobione — 3 z 19

| id | dlaczego |
|---|---|
| **subj-chemia** („retorta / kolba XIX w.") | Szkła laboratoryjnego u Graya nie ma i nie da się go zastąpić anatomią. Zamówienie samo lokuje aparaturę chemiczną w **paczce K**, która ma własny atlas. |
| **subj-biochemia** („inna kolba + wężownica") | To samo. |
| **subj-mikrobiologia** („bakteria/ziarniak jeśli linia; inaczej mikroskop XIX w.") | Ani bakterii, ani mikroskopu. **Nie podstawiam komórek nabłonka jako „bakterii"** — to byłoby merytorycznie fałszywe na platformie, która uczy do egzaminu. Zostawiam dziurę. |

Wszystkie trzy zamyka jedno źródło z paczki K (aparatura chemiczna XIX w. + mikroskop).
`misc/` ma już atlas botaniczny Bentley–Trimen, ale to rośliny, nie szkło.

## 4. Zamiany i dublowanie

- **subj-farmakologia** to **żołądek**, nie roślina lecznicza — zgodnie z instrukcją z zamówienia
  („jeśli miesza atlas, ZOSTAŃ w Gray: żołądek/jelito jako droga leku albo nerka"). Naparstnica
  jest w `misc/`, ale wejście tam mieszałoby atlasy w obrębie paczki E.
- **subj-zakazne** to sieć naczyń chłonnych, nie płuco — bo płuco zużyłem na `subj-patologia`
  i dwa identyczne płuca w jednym zestawie 19 ikon byłyby błędem. Sieć limfatyczna czyta się jako
  „rozprzestrzenianie", co jest bliżej sensu przedmiotu.
- **Trzy pozycje dzielą tablicę z innymi paczkami**: `subj-anatomia` z `rank-specjalista`
  i `ldew-radiologia` (Gray188), `subj-biofizyka` z `ach-nocny-maratonczyk` (Gray869),
  `subj-prof-humanizm` z `ach-miesieczna-dyscyplina` (Gray0608). Kadry różne, konteksty w UI różne.
  W atlasie jest jedna czaszka, jedno oko i jedna dłoń — inaczej się nie da bez mieszania atlasów.

## 5. Wagi

Siedem pozycji mieści się poniżej 25 KB gzip; najlżejsze to `subj-patofizjologia` (10,4 KB),
`subj-socjologia` (12,9 KB) i `subj-narzad-zucia` (13,1 KB). Najcięższe: `subj-zakazne` (51,2 KB)
i `subj-immunologia` (40,0 KB) — obie to gęste tkanki z tysiącami drobnych struktur; przy wyższym
`turdsize` przestają być tkanką, a stają się plamą.

Zamówienie przewiduje te ikony **także jako tło karty przedmiotu przy `opacity 0.18`** — w tej roli
waga jest mniej dotkliwa niż przy ikonie 32 px w nawigacji. Dostarczam jedną wagę kreski, opacity
ustawia Cursor, zgodnie z §E.

## 6. Parametry

Wspólne: `channel=max`, `t2 48`, `gamma 0.75`, `radius 4`, `threshold 175`, canvas 1000,
`zoom 0.94`, kadr wycentrowany, OCR `--psm 11` conf 22 (wyłączony dla `subj-immunologia`,
gdzie OCR wycinał białe prostokąty w miąższu węzła). `t1` 10–20, `turdsize` 45–120 per pozycja —
pełne wartości w `work/rep_E.json`.

## 7. Źródło i licencja

Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
Gray188, Gray490, Gray491, Gray869 — Wikimedia Commons (`ryciny_zrodla/gray/`, z `.meta.json`).
Gray0033, Gray0035, Gray0176, Gray0506, Gray0597, Gray0598, Gray0608, Gray0613, Gray0897,
Gray1003, Gray1019 — UNSW Embryology.
