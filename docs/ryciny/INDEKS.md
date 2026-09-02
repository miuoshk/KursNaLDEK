# INDEKS — wszystkie ryciny, „Kurs na LDEK"

**292 plików SVG**, 19 paczek, łącznie **10.2 MB po gzip**.
Wygenerowany automatycznie z drzewa `out/` — jeśli coś dodasz lub podmienisz, przelicz go ponownie.

## Jak to wstawiać

| kreska | co to znaczy | jak wstawić |
|---|---|---|
| `gold` | `#CDB56E` zaszyte w pliku | `<img src>` albo inline — działa tak samo |
| `sage` | `#7FA697` zaszyte w pliku | jw. |
| `currentColor` | kolor bierze z CSS | **tylko inline** (`@svgr/webpack`); `<img src>` nie dziedziczy `color` |

```css
.plate{position:absolute;pointer-events:none;opacity:var(--plate-op,.3);
  -webkit-mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent);
          mask-image:radial-gradient(closest-side,#000 40%,rgba(0,0,0,.45) 70%,transparent)}
.plate>svg,.plate>img{width:100%;height:100%;object-fit:contain}
@media (max-width:640px){.plate{position:relative;width:100%;height:340px;--plate-op:.6;
  -webkit-mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000);
          mask-image:linear-gradient(#0000,#000 18%,#000 80%,#0000)}}
.emblem{color:var(--rycina-sage,#7FA697);width:48px;height:48px}
.emblem.is-gold{color:#CDB56E}
```

## Spis paczek

| paczka | plików | gzip |
|---|---|---|
| A3–A7 — reszta landingu | 10 | 0.43 MB |
| A1 — hero landingu | 10 | 0.49 MB |
| A2 — sekcja „Jak działa sesja" | 3 | 0.22 MB |
| A6 — karty ścieżek | 6 | 0.34 MB |
| B1 — auth | 2 | 0.09 MB |
| B2 — cennik | 4 | 0.10 MB |
| B3 — 404 i empty states | 9 | 0.28 MB |
| C1 — znaki produktów | 3 | 0.03 MB |
| D — rangi i osiągnięcia | 18 | 0.20 MB |
| E — przedmioty KNNP | 16 | 0.41 MB |
| F — przedmioty LDEW | 22 | 0.55 MB |
| G-Black — atlas zębów wg klas | 40 | 0.47 MB |
| G-Gray — twarzoczaszka i ciało | 65 | 2.52 MB |
| I — niebo (ZENIT / ANTARES / KALIBRA) | 22 | 1.75 MB |
| J — narzędzia i satyra | 9 | 0.45 MB |
| K — histologia i farmakologia | 11 | 0.41 MB |
| L — OpenGraph | 3 | 0.05 MB |
| M — warianty kadru | 15 | 0.89 MB |
| tura 1 — dostarczone wcześniej | 24 | 0.47 MB |

## A3–A7 — reszta landingu

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| card-goal-target | 800×800 | 88 124 | 36 555 | sage |
| card-rank-laurel | 800×800 | 63 076 | 26 841 | sage |
| card-reviews-clock | 800×800 | 142 942 | 60 587 | sage |
| orn-goal-circle | 64×64 | 33 395 | 14 597 | currentColor |
| orn-streak-flame | 64×64 | 48 690 | 20 805 | currentColor |
| sec-cta-constellation | 1800×1000 | 104 760 | 43 540 | sage |
| sec-faq-ear | 1200×1200 | 100 082 | 41 235 | sage |
| sec-progress-brain | 1400×1200 | 136 125 | 55 778 | sage |
| sec-pulpit-hand | 1600×1200 | 162 188 | 66 088 | sage |
| sec-pulpit-hand-currentColor | 1600×1200 | 162 193 | 66 096 | currentColor |

## A1 — hero landingu

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| hero-knnp-skeleton | 1200×1800 | 197 318 | 80 981 | gold |
| hero-knnp-skeleton-currentColor | 1200×1800 | 197 323 | 80 989 | currentColor |
| hero-ldek-palate | 1600×1600 | 40 156 | 17 331 | gold |
| hero-ldek-palate-currentColor | 1600×1600 | 40 161 | 17 335 | currentColor |
| hero-ldek-skull-oblique | 1600×1600 | 120 508 | 49 118 | gold |
| hero-ldek-skull-oblique-currentColor | 1600×1600 | 120 513 | 49 126 | currentColor |
| hero-ldew-jaw | 1600×1600 | 62 385 | 25 632 | gold |
| hero-ldew-jaw-currentColor | 1600×1600 | 62 390 | 25 639 | currentColor |
| hero-lek-heart | 1600×1600 | 176 036 | 70 892 | gold |
| hero-lek-heart-currentColor | 1600×1600 | 176 041 | 70 900 | currentColor |

## A2 — sekcja „Jak działa sesja"

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| sec-session-facial-n | 1200×1200 | 159 840 | 65 945 | sage |
| sec-session-trigeminal | 1600×2e3 | 184 578 | 74 833 | gold |
| sec-session-trigeminal-currentColor | 1600×2e3 | 184 583 | 74 838 | currentColor |

## A6 — karty ścieżek

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| path-lek-heart-lungs | 1400×1000 | 163 374 | 66 305 | sage |
| path-lek-heart-lungs-currentColor | 1400×1000 | 163 379 | 66 314 | currentColor |
| path-lek-skeleton | 1200×1600 | 203 499 | 82 804 | sage |
| path-stoma-skull | 1400×1000 | 124 221 | 50 909 | sage |
| path-stoma-skull-currentColor | 1400×1000 | 124 226 | 50 918 | currentColor |
| path-stoma-tmj | 1200×1200 | 57 784 | 23 393 | sage |

## B1 — auth

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| auth-bg-jaw | 1400×1000 | 35 632 | 15 520 | sage |
| auth-bg-skull | 1600×1600 | 184 949 | 75 420 | sage |

## B2 — cennik

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| pricing-bg-scales | 1600×1200 | 86 042 | 37 880 | sage |
| pricing-card-180 | 800×800 | 42 614 | 17 748 | sage |
| pricing-card-30 | 800×800 | 28 825 | 12 496 | sage |
| pricing-card-365 | 800×800 | 88 640 | 36 332 | sage |

## B3 — 404 i empty states

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| empty-404-dentist | 1200×900 | 281 705 | 120 667 | sage |
| empty-404-missing-tooth | 256×256 | 27 274 | 11 458 | currentColor |
| empty-404-missing-tooth-gap | 256×256 | 49 173 | 20 827 | currentColor |
| empty-achievements | 128×128 | 41 316 | 17 949 | currentColor |
| empty-reviews | 128×128 | 28 367 | 12 446 | currentColor |
| empty-saved | 128×128 | 23 547 | 10 389 | currentColor |
| empty-session | 128×128 | 37 819 | 15 834 | currentColor |
| empty-stats | 128×128 | 9 761 | 4 479 | currentColor |
| onboarding-welcome | 1200×900 | 174 317 | 69 217 | sage |

## C1 — znaki produktów

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| mark-knnp | 64×64 | 33 395 | 14 597 | currentColor |
| mark-ldek | 64×64 | 12 887 | 5 739 | currentColor |
| mark-ldew | 64×64 | 32 564 | 14 375 | currentColor |

## D — rangi i osiągnięcia

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| ach-kwartalna-konsekwencja | 64×64 | 91 830 | 39 433 | currentColor |
| ach-maraton | 64×64 | 9 760 | 4 478 | currentColor |
| ach-miesieczna-dyscyplina | 64×64 | 55 340 | 23 500 | currentColor |
| ach-nocny-maratonczyk | 64×64 | 48 876 | 21 092 | currentColor |
| ach-perfekcyjna-sesja | 64×64 | 12 166 | 5 659 | currentColor |
| ach-pierwsza-sesja | 64×64 | 11 651 | 5 394 | currentColor |
| ach-setka | 64×64 | 9 647 | 4 570 | currentColor |
| ach-snajper | 64×64 | 29 111 | 12 561 | currentColor |
| ach-tygodniowy-rytm | 64×64 | 6 018 | 2 928 | currentColor |
| ach-tysiac | 64×64 | 12 887 | 5 739 | currentColor |
| ach-wczesny-ptak | 64×64 | 50 564 | 21 530 | currentColor |
| rank-asystent | 64×64 | 10 102 | 4 752 | currentColor |
| rank-mistrz | 64×64 | 32 847 | 14 430 | currentColor |
| rank-praktykant | 64×64 | 8 328 | 3 874 | currentColor |
| rank-rezydent-1 | 64×64 | 8 054 | 3 783 | currentColor |
| rank-rezydent-2 | 64×64 | 10 822 | 5 133 | currentColor |
| rank-rezydent-3 | 64×64 | 17 588 | 8 111 | currentColor |
| rank-specjalista | 64×64 | 38 148 | 16 568 | currentColor |

## E — przedmioty KNNP

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| subj-anatomia | 64×64 | 44 278 | 19 070 | currentColor |
| subj-angielski | 64×64 | 72 088 | 31 279 | currentColor |
| subj-biofizyka | 64×64 | 54 437 | 23 373 | currentColor |
| subj-biologia | 64×64 | 68 759 | 29 945 | currentColor |
| subj-biologia-mol | 64×64 | 47 423 | 20 538 | currentColor |
| subj-farmakologia | 64×64 | 43 193 | 18 501 | currentColor |
| subj-fizjologia | 64×64 | 56 307 | 23 935 | currentColor |
| subj-histologia | 64×64 | 63 508 | 27 399 | currentColor |
| subj-immunologia | 64×64 | 95 633 | 39 976 | currentColor |
| subj-mikrobio-ju | 64×64 | 62 437 | 26 381 | currentColor |
| subj-narzad-zucia | 64×64 | 29 897 | 13 063 | currentColor |
| subj-patofizjologia | 64×64 | 23 051 | 10 402 | currentColor |
| subj-patologia | 64×64 | 79 751 | 33 579 | currentColor |
| subj-prof-humanizm | 64×64 | 74 371 | 31 337 | currentColor |
| subj-socjologia | 64×64 | 29 335 | 12 933 | currentColor |
| subj-zakazne | 64×64 | 122 995 | 51 171 | currentColor |

## F — przedmioty LDEW

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| ldew-card-chirurgia | 800×600 | 41 628 | 17 822 | sage |
| ldew-card-chst | 800×600 | 92 849 | 39 011 | sage |
| ldew-card-endodoncja | 800×600 | 73 707 | 30 513 | sage |
| ldew-card-ortodoncja | 800×600 | 74 153 | 31 778 | sage |
| ldew-card-orzecznictwo | 800×600 | 53 513 | 22 786 | sage |
| ldew-card-pedo | 800×600 | 90 323 | 38 070 | sage |
| ldew-card-periodontologia | 800×600 | 65 991 | 28 213 | sage |
| ldew-card-protetyka | 800×600 | 64 657 | 26 531 | sage |
| ldew-card-radiologia | 800×600 | 84 952 | 35 416 | sage |
| ldew-card-sluzowka | 800×600 | 103 748 | 42 874 | sage |
| ldew-card-zachowawcza | 800×600 | 79 001 | 33 566 | sage |
| ldew-chirurgia | 64×64 | 20 518 | 9 152 | currentColor |
| ldew-chst | 64×64 | 39 616 | 17 441 | currentColor |
| ldew-endodoncja | 64×64 | 57 340 | 23 828 | currentColor |
| ldew-ortodoncja | 64×64 | 52 257 | 22 881 | currentColor |
| ldew-orzecznictwo | 64×64 | 35 252 | 15 399 | currentColor |
| ldew-pedo | 64×64 | 65 231 | 27 777 | currentColor |
| ldew-periodontologia | 64×64 | 31 012 | 13 699 | currentColor |
| ldew-protetyka | 64×64 | 21 153 | 9 445 | currentColor |
| ldew-radiologia | 64×64 | 44 278 | 19 070 | currentColor |
| ldew-sluzowka | 64×64 | 39 852 | 17 523 | currentColor |
| ldew-zachowawcza | 64×64 | 59 467 | 25 411 | currentColor |

## G-Black — atlas zębów wg klas

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| tooth-canine-crown | 128×128 | 23 564 | 10 200 | currentColor |
| tooth-canine-crown-sage | 128×128 | 23 559 | 10 192 | sage |
| tooth-canine-root | 128×128 | 25 527 | 11 168 | currentColor |
| tooth-canine-root-sage | 128×128 | 25 522 | 11 160 | sage |
| tooth-canine-section | 128×128 | 11 173 | 5 264 | currentColor |
| tooth-canine-section-sage | 128×128 | 11 168 | 5 257 | sage |
| tooth-dec-incisor | 128×128 | 27 284 | 11 776 | currentColor |
| tooth-dec-incisor-sage | 128×128 | 27 279 | 11 767 | sage |
| tooth-dec-molar | 128×128 | 58 388 | 24 439 | currentColor |
| tooth-dec-molar-sage | 128×128 | 58 383 | 24 430 | sage |
| tooth-incisor-crown | 128×128 | 18 544 | 8 279 | currentColor |
| tooth-incisor-crown-sage | 128×128 | 18 539 | 8 271 | sage |
| tooth-incisor-root | 128×128 | 17 455 | 7 775 | currentColor |
| tooth-incisor-root-sage | 128×128 | 17 450 | 7 769 | sage |
| tooth-incisor-section | 128×128 | 10 853 | 5 186 | currentColor |
| tooth-incisor-section-sage | 128×128 | 10 848 | 5 180 | sage |
| tooth-lateral-crown | 128×128 | 16 626 | 7 464 | currentColor |
| tooth-lateral-crown-sage | 128×128 | 16 621 | 7 454 | sage |
| tooth-lateral-root | 128×128 | 24 203 | 10 645 | currentColor |
| tooth-lateral-root-sage | 128×128 | 24 198 | 10 637 | sage |
| tooth-lateral-section | 128×128 | 9 802 | 4 671 | currentColor |
| tooth-lateral-section-sage | 128×128 | 9 797 | 4 664 | sage |
| tooth-molar-lower-crown | 128×128 | 39 605 | 16 842 | currentColor |
| tooth-molar-lower-crown-sage | 128×128 | 39 600 | 16 833 | sage |
| tooth-molar-lower-root | 128×128 | 44 072 | 18 741 | currentColor |
| tooth-molar-lower-root-sage | 128×128 | 44 067 | 18 733 | sage |
| tooth-molar-lower-section | 128×128 | 13 209 | 6 216 | currentColor |
| tooth-molar-lower-section-sage | 128×128 | 13 204 | 6 207 | sage |
| tooth-molar-upper-crown | 128×128 | 63 287 | 26 367 | currentColor |
| tooth-molar-upper-crown-sage | 128×128 | 63 282 | 26 357 | sage |
| tooth-molar-upper-root | 128×128 | 55 159 | 23 137 | currentColor |
| tooth-molar-upper-root-sage | 128×128 | 55 154 | 23 129 | sage |
| tooth-molar-upper-section | 128×128 | 11 418 | 5 422 | currentColor |
| tooth-molar-upper-section-sage | 128×128 | 11 413 | 5 414 | sage |
| tooth-premolar-crown | 128×128 | 21 459 | 9 598 | currentColor |
| tooth-premolar-crown-sage | 128×128 | 21 454 | 9 590 | sage |
| tooth-premolar-root | 128×128 | 40 446 | 17 269 | currentColor |
| tooth-premolar-root-sage | 128×128 | 40 441 | 17 261 | sage |
| tooth-premolar-section | 128×128 | 11 422 | 5 430 | currentColor |
| tooth-premolar-section-sage | 128×128 | 11 417 | 5 424 | sage |

## G-Gray — twarzoczaszka i ciało

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| anat-aorta | 1000×1400 | 54 397 | 23 460 | sage |
| anat-aorta-mark | 64×64 | 23 051 | 10 402 | currentColor |
| anat-brain-sagittal | 1400×1000 | 122 161 | 50 024 | sage |
| anat-brain-sagittal-mark | 64×64 | 43 650 | 18 812 | currentColor |
| anat-cranial-nerves | 1400×1200 | 44 625 | 19 542 | sage |
| anat-cranial-nerves-mark | 64×64 | 21 479 | 9 952 | currentColor |
| anat-deciduous-arch | 1200×1000 | 69 735 | 29 916 | sage |
| anat-deciduous-arch-mark | 64×64 | 44 710 | 19 697 | currentColor |
| anat-ear | 1200×1400 | 121 945 | 50 061 | sage |
| anat-ear-inner | 1200×1200 | 83 343 | 35 222 | sage |
| anat-ear-mark | 64×64 | 53 379 | 22 642 | currentColor |
| anat-eye | 1200×1200 | 105 529 | 43 555 | sage |
| anat-eye-mark | 64×64 | 54 437 | 23 373 | currentColor |
| anat-facial-n | 1200×1200 | 154 504 | 64 293 | sage |
| anat-facial-n-mark | 64×64 | 65 269 | 28 162 | currentColor |
| anat-foot | 1000×1800 | 238 726 | 96 558 | sage |
| anat-foot-mark | 64×64 | 21 309 | 9 604 | currentColor |
| anat-hand | 1000×1600 | 312 304 | 126 844 | sage |
| anat-hand-mark | 64×64 | 75 974 | 31 970 | currentColor |
| anat-heart | 1200×1200 | 130 158 | 53 519 | sage |
| anat-heart-mark | 64×64 | 56 307 | 23 935 | currentColor |
| anat-kidney | 1200×1200 | 213 547 | 87 572 | sage |
| anat-kidney-mark | 64×64 | 81 699 | 34 566 | currentColor |
| anat-lungs-line | 1200×1200 | 271 532 | 109 283 | sage |
| anat-lungs-line-mark | 64×64 | 79 751 | 33 579 | currentColor |
| anat-mandible-front | 1200×1200 | 95 573 | 40 427 | sage |
| anat-mandible-front-mark | 64×64 | 52 257 | 22 881 | currentColor |
| anat-mandible-lat | 1400×1000 | 36 526 | 15 824 | sage |
| anat-mandible-lat-mark | 64×64 | 20 518 | 9 152 | currentColor |
| anat-masseter | 1400×1000 | 75 244 | 31 276 | sage |
| anat-masseter-mark | 64×64 | 29 897 | 13 063 | currentColor |
| anat-maxilla | 1400×1000 | 81 022 | 33 726 | sage |
| anat-maxilla-mark | 64×64 | 33 069 | 14 547 | currentColor |
| anat-mimic | 1200×1400 | 228 912 | 94 662 | sage |
| anat-mimic-mark | 64×64 | 65 654 | 28 812 | currentColor |
| anat-orbit | 1400×1000 | 72 287 | 30 908 | sage |
| anat-orbit-mark | 64×64 | 39 616 | 17 441 | currentColor |
| anat-palate-line | 1200×1200 | 162 467 | 66 071 | sage |
| anat-palate-line-mark | 64×64 | 39 852 | 17 523 | currentColor |
| anat-permanent-arch | 1400×1000 | 99 524 | 41 812 | sage |
| anat-permanent-arch-mark | 64×64 | 60 484 | 26 222 | currentColor |
| anat-salivary | 1200×1200 | 62 376 | 26 080 | sage |
| anat-salivary-mark | 64×64 | 26 857 | 11 715 | currentColor |
| anat-skull-base | 1000×1600 | 237 288 | 95 950 | sage |
| anat-skull-base-mark | 64×64 | 26 732 | 11 800 | currentColor |
| anat-skull-front | 1000×1400 | 120 640 | 49 874 | sage |
| anat-skull-front-mark | 64×64 | 35 795 | 15 646 | currentColor |
| anat-skull-lat | 1400×1200 | 98 804 | 40 833 | sage |
| anat-skull-lat-mark | 64×64 | 45 164 | 19 486 | currentColor |
| anat-spine | 800×1800 | 77 897 | 32 735 | sage |
| anat-spine-mark | 64×64 | 16 608 | 7 215 | currentColor |
| anat-stomach | 1400×1200 | 162 742 | 65 679 | sage |
| anat-stomach-mark | 64×64 | 43 193 | 18 501 | currentColor |
| anat-thorax | 1200×1200 | 219 362 | 89 370 | sage |
| anat-thorax-mark | 64×64 | 105 468 | 45 030 | currentColor |
| anat-tmj | 1200×1200 | 90 162 | 37 434 | sage |
| anat-tmj-mark | 64×64 | 38 758 | 16 997 | currentColor |
| anat-tongue | 1200×1200 | 149 887 | 63 215 | sage |
| anat-tongue-mark | 64×64 | 72 088 | 31 279 | currentColor |
| anat-trigeminal | 1200×1400 | 205 708 | 85 020 | sage |
| anat-trigeminal-mark | 64×64 | 77 207 | 33 344 | currentColor |
| anat-vertebra | 1200×900 | 75 823 | 31 579 | sage |
| anat-vertebra-mark | 64×64 | 38 156 | 16 627 | currentColor |
| anat-vessels-head | 1200×1200 | 208 244 | 85 197 | sage |
| anat-vessels-head-mark | 64×64 | 74 799 | 32 078 | currentColor |

## I — niebo (ZENIT / ANTARES / KALIBRA)

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| mark-zenit-labs | 64×64 | 50 099 | 22 315 | currentColor |
| mode-katalog | 64×64 | 29 659 | 13 746 | currentColor |
| mode-przeglad | 64×64 | 21 267 | 10 117 | currentColor |
| sky-antares | 1600×1200 | 271 828 | 112 303 | sage |
| sky-antares-currentColor | 1600×1200 | 271 833 | 112 312 | currentColor |
| sky-cellarius-full | 1800×1000 | 294 912 | 120 422 | sage |
| sky-constellation-01 | 800×800 | 203 488 | 83 951 | sage |
| sky-constellation-02 | 800×800 | 162 969 | 67 174 | sage |
| sky-constellation-03 | 800×800 | 170 964 | 70 191 | sage |
| sky-constellation-04 | 800×800 | 178 770 | 73 238 | sage |
| sky-constellation-05 | 800×800 | 152 439 | 63 207 | sage |
| sky-constellation-06 | 800×800 | 174 903 | 72 531 | sage |
| sky-constellation-07 | 800×800 | 155 506 | 64 152 | sage |
| sky-constellation-08 | 800×800 | 190 816 | 78 105 | sage |
| sky-grid | 1600×1600 | 172 427 | 74 437 | sage |
| sky-grid-currentColor | 1600×1600 | 172 432 | 74 446 | currentColor |
| sky-kalibra | 1400×1400 | 210 791 | 90 404 | sage |
| sky-kalibra-currentColor | 1400×1400 | 210 796 | 90 414 | currentColor |
| sky-rose | 1400×1400 | 165 806 | 70 379 | sage |
| sky-rose-currentColor | 1400×1400 | 165 811 | 70 386 | currentColor |
| sky-zenit | 1800×1200 | 378 712 | 158 390 | gold |
| sky-zenit-currentColor | 1800×1200 | 378 717 | 158 397 | currentColor |

## J — narzędzia i satyra

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| scene-extraction | 1200×900 | 318 841 | 136 519 | sage |
| scene-itinerant | 1200×1200 | 315 233 | 127 047 | sage |
| scene-waiting | 1200×900 | 256 661 | 100 933 | sage |
| tool-bow-drill | 64×64 | 28 433 | 12 458 | currentColor |
| tool-elevator | 64×64 | 28 820 | 12 962 | currentColor |
| tool-forceps | 64×64 | 41 114 | 17 790 | currentColor |
| tool-key | 64×64 | 49 584 | 21 379 | currentColor |
| tool-mirror | 64×64 | 26 801 | 11 828 | currentColor |
| tool-probe | 64×64 | 21 581 | 9 734 | currentColor |

## K — histologia i farmakologia

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| histo-bone | 64×64 | 94 851 | 39 953 | currentColor |
| histo-cartilage | 64×64 | 111 783 | 46 407 | currentColor |
| histo-enamel-organ | 64×64 | 57 340 | 23 828 | currentColor |
| histo-epithelium | 64×64 | 150 400 | 61 848 | currentColor |
| histo-tooth-germ | 64×64 | 59 467 | 25 411 | currentColor |
| pharma-aconitum | 1000×1400 | 84 053 | 36 498 | sage |
| pharma-aconitum-mark | 64×64 | 14 855 | 6 847 | currentColor |
| pharma-hellebore | 1000×1400 | 182 334 | 76 592 | sage |
| pharma-hellebore-mark | 64×64 | 47 219 | 20 743 | currentColor |
| pharma-opium-poppy | 1000×1400 | 131 020 | 55 103 | sage |
| pharma-opium-poppy-mark | 64×64 | 40 277 | 17 832 | currentColor |

## L — OpenGraph

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| og-knnp | 1200×630 | 54 044 | 22 925 | gold |
| og-ldek | 1200×630 | 40 160 | 17 335 | gold |
| og-ldew | 1200×630 | 20 542 | 9 115 | gold |

## M — warianty kadru

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| auth-bg-jaw-left | 1400×1000 | 35 681 | 15 528 | sage |
| hero-knnp-skeleton-left | 1200×1800 | 197 367 | 80 988 | gold |
| hero-ldek-palate-alt-left | 1600×1600 | 49 430 | 20 860 | gold |
| hero-ldek-palate-left | 1600×1600 | 40 157 | 17 331 | gold |
| hero-ldek-skull-oblique-left | 1600×1600 | 120 557 | 49 126 | gold |
| hero-ldew-jaw-left | 1600×1600 | 62 434 | 25 637 | gold |
| hero-lek-heart-left | 1600×1600 | 320 849 | 126 941 | gold |
| path-lek-heart-lungs-left | 1400×1000 | 264 347 | 104 191 | sage |
| path-lek-skeleton-left | 1200×1600 | 203 548 | 82 810 | sage |
| path-stoma-skull-left | 1400×1000 | 124 270 | 50 917 | sage |
| path-stoma-tmj-left | 1200×1200 | 57 833 | 23 401 | sage |
| sec-progress-brain-left | 1400×1200 | 132 800 | 54 490 | sage |
| sec-pulpit-hand-left | 1600×1200 | 162 237 | 66 094 | sage |
| sec-session-facial-n-left | 1200×1200 | 181 114 | 75 122 | sage |
| sec-session-trigeminal-left | 1600×2000 | 240 684 | 98 945 | gold |

## tura 1 — dostarczone wcześniej

| id | viewBox | bytes | gzip | kreska |
|---|---|---|---|---|
| ach-maraton | 64×64 | 9 760 | 4 478 | currentColor |
| ach-tygodniowy-rytm | 64×64 | 6 018 | 2 928 | currentColor |
| ach-tysiac | 64×64 | 12 887 | 5 739 | currentColor |
| anat-spine-mark | 64×64 | 9 760 | 4 478 | currentColor |
| anat-trigeminal-mark | 64×64 | 17 796 | 8 086 | currentColor |
| auth-bg-skull-DRAFT | 1600×1600 | 60 177 | 24 895 | sage |
| empty-404-missing-tooth | 256×256 | 27 274 | 11 458 | currentColor |
| empty-stats | 128×128 | 9 761 | 4 479 | currentColor |
| hero-ldek-palate | 1600×1600 | 40 156 | 17 331 | gold |
| hero-ldek-palate-currentColor | 1600×1600 | 40 161 | 17 335 | currentColor |
| hero-ldek-palate-left | 1600×1600 | 40 157 | 17 331 | gold |
| hero-ldek-skull-oblique-DRAFT | 1600×1600 | 60 180 | 24 901 | gold |
| hero-ldek-skull-oblique-currentColor-DRAFT | 1600×1600 | 60 185 | 24 907 | currentColor |
| mark-ldek | 64×64 | 12 887 | 5 739 | currentColor |
| og-ldek | 1200×630 | 40 160 | 17 335 | gold |
| onboarding-track-stoma | 96×96 | 12 887 | 5 740 | currentColor |
| orn-footer-mark | 64×64 | 12 887 | 5 739 | currentColor |
| path-lek-heart-lungs-DRAFT | 1400×1e3 | 80 320 | 32 851 | sage |
| path-lek-heart-lungs-currentColor-DRAFT | 1400×1e3 | 80 325 | 32 859 | currentColor |
| path-stoma-skull-DRAFT | 1400×1e3 | 40 111 | 16 829 | sage |
| path-stoma-skull-currentColor-DRAFT | 1400×1e3 | 40 116 | 16 836 | currentColor |
| sec-progress-spine | 1e3×1800 | 51 213 | 21 389 | sage |
| sec-session-trigeminal | 1600×2e3 | 184 578 | 74 833 | gold |
| sec-session-trigeminal-currentColor | 1600×2e3 | 184 583 | 74 838 | currentColor |
