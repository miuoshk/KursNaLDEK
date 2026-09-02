# EVENT — PACZKA G-Gray, część 2: ciało (12 z 16), tura 2

Atlas: **Gray 1918**. Każda pozycja jako tło szałwiowe (viewBox 800–1600 px) + emblemat
`currentColor` 64 px (`-mark`). **24 pliki.**

## 1. Dostarczone

| id | motyw | tablica |
|---|---|---|
| anat-heart | serce, powierzchnia tylna | Gray491 |
| anat-aorta | łuk aorty z odgałęzieniami | Gray0506 |
| anat-lungs-line | płuca — kontur płatów | Gray490 |
| anat-brain-sagittal | mózg, przekrój strzałkowy pośrodkowy | Gray715 |
| anat-spine | kręgosłup, widok boczny | Gray111 |
| anat-vertebra | krąg piersiowy od góry | Gray, krąg piersiowy |
| anat-hand | kości i struktury dłoni | Gray0608 |
| anat-foot | kości stopy, powierzchnia grzbietowa | Gray268 |
| anat-eye | gałka oczna, przekrój poziomy | Gray869 |
| anat-kidney | nerki in situ | Gray1120 |
| anat-stomach | żołądek z gruczołami | Gray0613 |
| anat-thorax | klatka piersiowa — żebra i kręgosłup | Gray0621 |

## 2. NIE zrobione — 4 z 16

| id | dlaczego |
|---|---|
| **anat-skeleton-full** | Czwarty raz ta sama blokada: szkieletu całej postaci nie ma w Grayu z Commons w użytecznej rozdzielczości. **Albinus zamknąłby to jednym plikiem** razem z `hero-knnp-skeleton`, `ldew-zdrowie-pub`, `ach-kwartalna-konsekwencja` i `ach-wszechstronny`. |
| **anat-pelvis** | Miednicy nie ma w pobranym zestawie mimo że raport ChataGPT ją wymieniał — w folderze `gray/` nie ma pliku z tym motywem. |
| **anat-ear** | **Wyprodukowałem i odrzuciłem.** Jedyna dostępna plansza uszna to `Musculustensortympani` — mięsień napinacz błony bębenkowej, z wielką strzałką wskaźnikową wrysowaną w rycinę. Po trace to plątanina ze strzałką, na żadnym rozmiarze nie czyta się jako ucho. Potrzebna plansza małżowiny albo ucha środkowego. |
| **anat-liver** | **Wyprodukowałem i odrzuciłem.** `Gray0475` to schemat krążenia wątrobowego płodu — prostokąty, strzałki i podpisy, nie sylwetka wątroby. Trace daje fragmenty. Potrzebna plansza wątroby jako narządu. |

## 3. Uwagi

- **`anat-spine`** pochodzi z tablicy 209×788 px — najniższa rozdzielczość źródła w całym zleceniu.
  Kręgosłup to obiekt wąski i wysoki, więc przy `viewBox 800×1800` mieści się w zasięgu źródła,
  ale kreska jest tu wyraźnie grubsza niż w reszcie paczki. Widać to przy `op 1.0`, przy docelowym
  `0.20` nie.
- **`anat-thorax`** dziedziczy zamiennik z `path-lek-skeleton`: to plansza limfatyczna, więc
  między żebrami została faktura pnia współczulnego. Przy `op 0.18` czyta się jak cieniowanie.
- **`anat-vertebra`** i **`anat-hand`** to najczystsze pozycje tej części — obie czytają się przy 32 px.

## 4. Bilans całej paczki G

| część | pozycji | plików |
|---|---|---|
| G-Black — zęby wg klas | 20 / 20 | 40 |
| G-Gray — twarzoczaszka | 19 / 19 | 38 |
| G-Gray — ciało | 12 / 16 | 24 |
| **razem** | **51 / 55** | **102** |

Cztery brakujące pozycje to szkielet, miednica, ucho i wątroba — wszystkie do zamknięcia
jednym dociągnięciem: **Albinus** (szkielet) plus dowolny kompletny atlas Graya z rozdziałami
osteologii i splanchnologii w hi-res.

Źródło: Gray, *Anatomy of the Human Body*, 20. wyd. 1918 — domena publiczna (Carter zm. 1897).
