# EVENT — PACZKA A2 (sekcja „Jak działa sesja"), tura 2

| id | plik | atlas / tablica | viewBox | bytes | gzip | kreska | zamiennik? |
|---|---|---|---|---|---|---|---|
| sec-session-trigeminal | sec-session-trigeminal.svg, -currentColor.svg | Gray 1918, n. trójdzielny | 0 0 1600 2000 | 184 578 | 74 833 | gold / currentColor | nie (z tury 1, bez zmian) |
| sec-session-facial-n | sec-session-facial-n.svg | Gray 1918, **Gray0781** (nerw twarzowy — gałęzie skroniowe, jarzmowe, policzkowe, brzeżne żuchwy, na profilu twarzy) | 0 0 1200 1200 | 159 840 | 65 945 | sage | nie |

## Uwagi

- Zamówienie chce „sam nerw, bez całej czaszki". **Gray0781 ma nerw NA profilu twarzy** — pełnego
  wypreparowanego VII bez podłoża w tym zestawie nie ma. Przy `op 0.20` czaszka jest ledwie zaznaczona,
  dominuje drzewko nerwu, więc efekt jest zgodny z intencją, ale formalnie to nie jest „sam nerw".
- Sprawdziłem dwa inne warianty i odrzuciłem: **Gray0788** (schemat przywspółczulny VII — piękne linie,
  ale bez podłoża czyta się jak przypadkowe zawijasy, a 70% planszy to tekst) oraz **Gray0784**
  (profil z terytoriami czucia — plansza ma wielkie liternictwo displayowe „MANDIBULAR", „CERVICAL PLEXUS"
  wpisane w rysunek, OCR ich nie zdejmuje bez dziurawienia konturu).
- **Zostały podpisy** wersalikami wzdłuż gałęzi (m.in. „SUPERFICIAL TEMPORAL", „DEEP ANGULAR").
  Przy `op 0.20` są fakturą; „zero liter" wymaga ręcznego przejścia albo hi-res źródła.
- Merytoryczny easter egg z zamówienia zostaje: demo pytania mówi o n. twarzowym vs trójdzielnym,
  a sekcja ma teraz oba nerwy — trójdzielny w złocie, twarzowy w szałwii.

Parametry: `crop —`, `t1 24`, `threshold 185`, `turdsize 30`, canvas 1500, zoom 1.06, kotwica środek/0.45.

Źródło: Gray 1918 (PD, Carter zm. 1897), skan UNSW Embryology.
