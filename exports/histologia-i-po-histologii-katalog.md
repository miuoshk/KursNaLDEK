# Katalog histologii i przedmiotów po histologii (stoma rok 1)

Wygenerowano ze stanu Supabase. Służy jako mapa ID przy imporcie batchy.

## Histologia (`subject_id = histologia`)

Powłoka UI: `stoma-histologia`, `lek-histologia`.

| topic_id | order | pytań | tracks | nazwa |
|----------|------:|------:|--------|-------|
| HIST-01 | 1 | 15 | (oba) | Metody badawcze |
| HIST-02 | 2 | 13 | (oba) | Cytoplazma |
| HIST-03 | 3 | 39 | (oba) | Jądro komórkowe |
| HIST-04 | 4 | 9 | (oba) | Tkanka nabłonkowa |
| HIST-05 | 5 | 33 | (oba) | Tkanka łączna |
| HIST-06 | 6 | 7 | (oba) | Tkanka tłuszczowa |
| HIST-07 | 7 | 14 | (oba) | Chrząstka |
| HIST-08 | 8 | 17 | (oba) | Kości |
| HIST-09 | 9 | 35 | (oba) | Tkanka nerwowa i układ nerwowy |
| HIST-10 | 10 | 27 | (oba) | Tkanka mięśniowa |
| HIST-11 | 11 | 38 | (oba) | Układ krążenia |
| HIST-12 | 12 | 51 | (oba) | Krew i hemopoeza |
| HIST-13 | 13 | 54 | (oba) | Układ odpornościowy i narządy limfatyczne |
| HIST-14 | 14 | 86 | (oba) | Układ pokarmowy |
| HIST-15 | 15 | 52 | (oba) | Układ oddechowy |
| HIST-16 | 16 | 40 | (oba) | Skóra |
| HIST-17 | 17 | 49 | (oba) | Układ moczowy |
| HIST-18 | 18 | 88 | (oba) | Gruczoły wewnątrzwydzielnicze |
| HIST-19 | 19 | 88 | (oba) | Układ rozrodczy |
| HIST-20 | 20 | 45 | (oba) | Oko i ucho — specjalne narządy zmysłów |
| HIST-21 | 21 | 11 | **stomatologia** | Rozwój zęba |
| HIST-22 | 22 | 43 | (oba) | Embriologia ogólna i embriogeneza narządów |

**Razem:** 22 działy, ~854 aktywnych pytań.

---

## Biofizyka (`subject_id = biofizyka`) — kolejny w programie

| topic_id | order | pytań | nazwa |
|----------|------:|------:|-------|
| BIOF-C1 | 1 | 39 | Biospektroskopia |
| BIOF-C2 | 2 | 55 | Optyka cieczy (refrakcja, polaryzacja) |
| BIOF-C3 | 3 | 91 | Bioreologia (lepkość, wiskozymetria) |
| BIOF-C4 | 4 | 62 | Biomechanika (sprężystość, dźwignie) |
| BIOF-S1 | 5 | 78 | Promieniowanie jonizujące, dozymetria |
| BIOF-S2 | 6 | 200 | Promieniowanie niejonizujące, lasery, RTG |
| BIOF-S3 | 7 | 37 | Bioakustyka, słuch, USG |
| BIOF-W1 | 8 | 42 | Błędy pomiarowe |
| BIOF-W3 | 9 | 26 | Ultrasonografia (wykład) |
| BIOF-W4 | 10 | 34 | Tomografia komputerowa (CT) |
| BIOF-W5 | 11 | 49 | Tomografia rezonansu magnetycznego (MRI/NMR) |

**Razem:** 11 działów, ~713 pytań (wspólne STOMA + LEK).

---

## Puste / do uzupełnienia (tylko stomatologia)

| subjects.id | topiki |
|-------------|--------|
| stoma-biologia | — |
| stoma-chemia | — |
| stoma-angielski | — |
| stoma-socjologia | `SOC-OG` (wzór: `FormatPisaniaPytan-Socjologia.md`) |

---

## Pobranie treści z bazy

```bash
# Histologia — przykład jednego działu
node scripts/export-topic-questions.mjs --subject histologia --topic HIST-14 --format sql --out exports/hist-HIST-14.sql

# Biofizyka
node scripts/export-topic-questions.mjs --subject biofizyka --topic BIOF-S2 --format json --out exports/biof-BIOF-S2.json
```

**Uwaga:** `--subject` musi być **kanoniczny** (`histologia`, `biofizyka`), nie `stoma-histologia`.
