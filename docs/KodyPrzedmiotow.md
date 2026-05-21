# Kody przedmiotów i tematów — KNNP

> Słownik ID używanych w Supabase (`subjects`, `topics`, `questions`).  
> Uniwersalny format wpisywania pytań: **`FormatPisaniaPytan.md`** (w katalogu głównym repo).

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
| `stoma-histologia`   | Histologia i embriologia      | —             | Treść w `histologia` (shared) |
| `stoma-biofizyka`    | Biofizyka                     | `BIOF-`       | Treść w `biofizyka` (shared) |
| `stoma-biologia`     | Biologia z genetyką           | —             | |
| `stoma-chemia`       | Chemia medyczna               | —             | |
| `stoma-socjologia`   | Socjologia medycyny           | `SOC-`        | Patrz `FormatPisaniaPytan-Socjologia.md` |

**Anatomia — tematy (`topics.id`):**

| ID        | Nazwa |
|-----------|-------|
| `ANA-CZA` | Czaszka i kości twarzoczaszki |
| `ANA-MIE` | Mięśnie żucia i mimiczne |
| `ANA-NAC` | Naczynia głowy i szyi |
| `ANA-NER` | Nerwy czaszkowe |
| `ANA-JAM` | Jama ustna i jej struktury |

**Biochemia — tematy:**

| ID        | Nazwa |
|-----------|-------|
| `BIO-AA`  | Aminokwasy i białka |
| `BIO-ENZ` | Enzymy i kinetyka enzymatyczna |
| `BIO-MET` | Metabolizm węglowodanów |
| `BIO-LIP` | Metabolizm lipidów |
| `BIO-ETC` | Łańcuch oddechowy i fosforylacja oksydacyjna |
| `BIO-NK`  | Kwasy nukleinowe i replikacja DNA |

### Rok 2

| `subjects.id`       | Nazwa                         | Skrót topików |
|---------------------|-------------------------------|---------------|
| `stoma-patologia`   | Patomorfologia                | —             |
| `stoma-osce`        | OSCE                          | —             |
| `stoma-biochemia`   | Biochemia                     | `BIO-`        |
| `stoma-fizjologia`  | Fizjologia                    | —             |
| `stoma-mikrobio`    | Mikrobiologia                 | —             |
| `stoma-mikrobio-ju` | Mikrobiologia jamy ustnej     | `MJU-`        |

**Mikrobiologia JU — tematy:**

| ID       | Nazwa (skrót) |
|----------|----------------|
| `MJU-01` … `MJU-06` | Patrz `seed-content.sql` |

### Rok 3

| `subjects.id`          | Nazwa        | Skrót topików |
|------------------------|--------------|---------------|
| `stoma-farmakologia`   | Farmakologia | `FARM-`       |

**Farmakologia — tematy (`FARM-01` … `FARM-17`):** pełna lista w `FormatPisaniaPytan-Farmakologia.md`.

---

## Lekarski · KNNP · `track = lekarski`

| Rok | `subjects.id`          | Nazwa              |
|-----|------------------------|----------------------|
| 1   | `lek-anatomia`         | Anatomia             |
| 1   | `lek-biofizyka`        | Biofizyka            | Treść w `biofizyka` (shared) |
| 1   | `lek-histologia`       | Histologia           | Treść w `histologia` (shared) |
| 1   | `lek-biologia-mol`     | Biologia molekularna |
| 2   | `lek-biochemia`        | Biochemia            |
| 2   | `lek-fizjologia`       | Fizjologia           |
| 2   | `lek-angielski`        | Język angielski      |
| 2   | `lek-immunologia`      | Immunologia          |
| 3   | `lek-patofizjologia`   | Patofizjologia       |
| 3   | `lek-farmakologia`     | Farmakologia         |
| 3   | `lek-mikrobio`         | Mikrobiologia        |

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
| `scripts/sync-topic-question-counts.sql` | Przeliczenie `question_count` |

Po każdym batchu pytań uruchom UPDATE licznika (wzór w `FormatPisaniaPytan.md` §4).
