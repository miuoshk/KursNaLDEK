# Kody przedmiotów i tematów — KNNP

> Słownik ID używanych w Supabase (`subjects`, `topics`, `questions`).  
> Uniwersalny format wpisywania pytań: **`FormatPisaniaPytan.md`** (w katalogu głównym repo).  
> Konwersja TXT → SQL w Claude: **`ClaudePrompt-TXT-na-SQL.md`**.

---

## Hierarchia

```
subjects.id  →  topics.id  →  questions.id
(przedmiot)     (dział)        (pytanie MCQ)
```

Format pytań KNNP jest **w praktyce uniwersalny** dla wszystkich przedmiotów:

- `options`: JSONB, 5 opcji `a`–`e`
- `correct_option_id`: jedna litera
- `question_type`: `single_choice` (domyślnie)
- `explanation`: tekst (markdown w UI)

Różni się głównie **konwencja ID** (`topics.id`, `questions.id`) i opcjonalne etykiety (`theme_label`, `batch_label` — patrz `FormatPisaniaPytan.md`).

---

## Konwencje ID

| Poziom    | Wzorzec (typowy)              | Przykład              |
|-----------|-------------------------------|------------------------|
| Przedmiot | `{track}-{nazwa}`             | `stoma-farmakologia`   |
| Temat     | `{SKRÓT}-{NN}` lub `{SKRÓT}-{kod}` | `FARM-07`, `ANA-NER` |
| Pytanie   | `{prefiks}-{NNN}`             | `farm-07-001`          |

**Prefiks pytania** — małe litery, skrót przedmiotu + temat:

| Przedmiot              | Prefiks pytań |
|------------------------|---------------|
| Anatomia               | `ana-`        |
| Biochemia              | `bio-`        |
| Farmakologia           | `farm-`       |
| Mikrobiologia JU       | `mju-`        |
| Socjologia medycyny    | `soc-`        |

Numeracja: **3 cyfry z zerami** (`001`, `014`).

---

## Stomatologia · KNNP · `track = stomatologia`

### Rok 1

| `subjects.id`        | Nazwa                         | Skrót topików | Uwagi |
|----------------------|-------------------------------|---------------|-------|
| `stoma-anatomia`     | Anatomia                      | `ANA-`        | Topiki w `seed-content.sql` |
| `stoma-angielski`    | Język angielski medyczny      | —             | Topiki do zdefiniowania |
| `stoma-histologia`   | Histologia i embriologia      | `HIST-`       | Treść w `histologia` (shared). STOMA-only: `topics.tracks = '{stomatologia}'` — patrz `FormatPisaniaPytan-PoHistologii-Stoma.md` |
| `stoma-biofizyka`    | Biofizyka                     | `BIOF-`       | Treść w `biofizyka` (shared) |
| `stoma-biologia`     | Biologia z genetyką           | —             | |
| `stoma-chemia`       | Chemia medyczna               | —             | |
| `stoma-socjologia`   | Socjologia medycyny           | `SOC-`        | Patrz `FormatPisaniaPytan-Socjologia.md` |

**Anatomia — tematy (`topics.id`, kanon `anatomia`, oba kierunki):**

| ID        | Nazwa |
|-----------|-------|
| `ANA-CZA` | Czaszka i kości twarzoczaszki |
| `ANA-MIE` | Mięśnie żucia i mimiczne |
| `ANA-NAC` | Naczynia głowy i szyi |
| `ANA-NER` | Nerwy czaszkowe |
| `ANA-JAM` | Jama ustna i jej struktury |
| `ANA-OUN` | Ośrodkowy układ nerwowy |
| `ANA-OBW` | Nerwy obwodowe i sploty |
| `ANA-KON` | Anatomia kończyn |
| `ANA-TUL` | Anatomia tułowia |
| `ANA-TRZ` | Trzewia (serce, płuca, jelita, UP) |
| `ANA-ZAL` | Zaliczenie końcowe |

Prefiks `id` pytania zaliczenia: `ana-zal-`. Kafelek **Zaliczenie końcowe** jest ostatni na liście tematów (`display_order` 11).

### Rok 2

| `subjects.id`       | Nazwa                         | Skrót topików |
|---------------------|-------------------------------|---------------|
| `stoma-patologia`   | Patomorfologia                | —             |
| `stoma-osce`        | OSCE                          | —             |
| `stoma-biochemia`   | Biochemia                     | `BIO-`        | **Ukryte w UI** (`catalogSubjectVisibility.ts`) |
| `stoma-fizjologia`  | Fizjologia                    | `PHYS-`       | **Ukryte w UI**; treść w `fizjologia` (shared) |
| `stoma-mikrobio`    | Mikrobiologia                 | `MICRO-`      | Treść w `mikrobiologia` (shared) |
| `stoma-mikrobio-ju` | Mikrobiologia jamy ustnej     | `MJU-`        |

`stoma-biochemia` i `stoma-fizjologia` zostają w DB (plan na przyszły rok), ale nie są widoczne na stomatologii — STOMA r.2 jest darmowy, a współdzielona treść nie może omijać paywalla LEK r.2.

**Biochemia (`stoma-biochemia`) — tematy:**

| ID        | Nazwa |
|-----------|-------|
| `BIO-AA`  | Aminokwasy i białka |
| `BIO-ENZ` | Enzymy i kinetyka enzymatyczna |
| `BIO-MET` | Metabolizm węglowodanów |
| `BIO-LIP` | Metabolizm lipidów |
| `BIO-ETC` | Łańcuch oddechowy i fosforylacja oksydacyjna |
| `BIO-NK`  | Kwasy nukleinowe i replikacja DNA |

**Mikrobiologia JU — tematy (`topics.id`):**

| ID        | Nazwa |
|-----------|-------|
| `MJU-C01` | Ćwiczenie 1 — Ekosystem JU, ślina, mechanizmy obronne |
| `MJU-C02` | Ćwiczenie 2 — Dezynfekcja i sterylizacja w stomatologii |
| `MJU-KZ1` | Kolokwium Zbiorcze I — Zaliczenia ćwiczeń 1 i 2 |
| `MJU-C03` | Ćwiczenie 3 — Czynniki wzrostu, taksonomia, ziarniaki i pałeczki G(+) |
| `MJU-C04` | Ćwiczenie 4 — Flora JU, kolonizacja, patogeny |
| `MJU-C05` | Ćwiczenie 5 — Adhezja, metabolizm, płytka nazębna |
| `MJU-C06` | Ćwiczenie 6 — Próchnica, choroby przyzębia, zakażenia krzyżowe |
| `MJU-KZ2` | Kolokwium Zbiorcze II — Zaliczenia ćwiczeń 3, 4 i 5 |
| `MJU-ZAL` | Zaliczenie całościowe |

Prefiks `id` pytania: `mju-c01-`, `mju-kz1-`, `mju-zal-` (małe litery). Kolejność UI: `display_order` w `scripts/2026-05-21-stoma-y2-mikrobio-ju-topics.sql`.

**Zaliczenie całościowe (jeden worek):** `FormatPisaniaPytan-MikrobiologiaJU-Zaliczenie.md` — wszystkie pytania tylko do `MJU-ZAL`, bez mapowania na ćwiczenia.

### Rok 3

| `subjects.id`            | Nazwa             | Skrót topików |
|------------------------|-------------------|---------------|
| `stoma-farmakologia`   | Farmakologia      | `FARM-`       |
| `stoma-zakazne`        | Choroby zakaźne   | `CHZ-`        |

**Farmakologia — tematy (`FARM-01` … `FARM-17`):** pełna lista w `FormatPisaniaPytan-Farmakologia.md`.

**Choroby zakaźne — tematy:** `CHZ-01`…`CHZ-23` (+ `CHZ-ZAL`), mapowanie z handover Zenit (`TEMAT_NR`). Import: `FormatPisaniaPytan-ChorobyZakazne.md`, ID pytań `ZAKSTO-zRRRR-X-{global}`. Seed: `scripts/2026-05-28-zakazne-topics-23.sql`.

---

## Lekarski · KNNP · `track = lekarski`

| Rok | `subjects.id`          | Nazwa              |
|-----|------------------------|----------------------|
| 1   | `lek-anatomia`         | Anatomia             |
| 1   | `lek-biofizyka`        | Biofizyka            | Treść w `biofizyka` (shared) |
| 1   | `lek-histologia`       | Histologia           | Treść w `histologia` (shared) |
| 1   | `lek-biologia-mol`     | Biologia molekularna |
| 1   | `lek-prof-humanizm`    | Profesjonalizm i humanizm w medycynie | `PHUM-` | Jeden temat: `PHUM-ZAL` — patrz `FormatPisaniaPytan-ProfesjonalizmHumanizm.md` |
| 2   | `lek-biochemia`        | Biochemia            | `BIO-` |
| 2   | `lek-fizjologia`       | Fizjologia           | Treść w `fizjologia` (shared) |
| 2   | `lek-angielski`        | Język angielski      |
| 2   | `lek-immunologia`      | Immunologia          |
| 3   | `lek-patofizjologia`   | Patofizjologia       |
| 3   | `lek-farmakologia`     | Farmakologia         |
| 3   | `lek-mikrobio`         | Mikrobiologia        | Treść w `mikrobiologia` (shared) |

Topiki dla lekarskiego — do uzupełnienia przy pierwszym batchu (wzorzec jak `SOC-` / `FARM-`).

---

## Pola opcjonalne pytań

| Kolumna            | KNNP typowo | OSCE |
|--------------------|------------|------|
| `difficulty`       | `latwe` / `srednie` / `trudne` | tak |
| `theme_label`      | lista per przedmiot (anatomia) | rzadko |
| `subtheme_label`   | wolny tekst | rzadko |
| `batch_label`      | np. `e_anat_2025/1` | — |
| `learning_outcome` | kod efektu kształcenia | opcjonalnie |
| `source_exam`      | np. „LDEK 2024" | — |
| `source_code`      | kod w źródle | — |

Typy OSCE (`ordering`, `image_identify`, …) — tylko `stoma-osce` / stacje OSCE; patrz `docs/ARCHITECTURE.md`.

---

## Skrypty SQL

| Plik | Cel |
|------|-----|
| `scripts/seed-subjects-curriculum.sql` | Pełna lista przedmiotów (uwaga: kasuje `subjects`) |
| `scripts/seed-content.sql` | Tematy + przykładowe pytania |
| `scripts/2026-05-19-stoma-y3-farmakologia-topics.sql` | Rok 3 stoma: tylko farma + FARM-01…17 |
| `scripts/2026-05-28-stoma-y3-choroby-zakazne.sql` | STOMA r.3: przedmiot + działy CHZ |
| `scripts/2026-05-28-topics-tracks.sql` | Kolumna `topics.tracks` (kierunek: STOMA / LEK) |
| `FormatPisaniaPytan-PoHistologii-Stoma.md` | Import po histologii, batchy tylko stomatologia |
| `exports/histologia-i-po-histologii-katalog.md` | Katalog działów HIST / BIOF ze stanu bazy |
| `scripts/sync-topic-question-counts.sql` | Przeliczenie `question_count` |

Po każdym batchu pytań uruchom UPDATE licznika (wzór w `FormatPisaniaPytan.md` §4).
