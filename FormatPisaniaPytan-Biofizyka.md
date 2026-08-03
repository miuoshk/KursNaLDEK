# Format pytań — Biofizyka (rok 1 · STOMA + LEK)

> **Cel:** jedno źródło prawdy dla Claude (TXT → SQL) przy konwersji pytań biofizycznych do Supabase.  
> Companion: `FormatPisaniaPytan.md`, `ClaudePrompt-TXT-na-SQL.md`, `FormatPisaniaPytan-PoHistologii-Stoma.md`.

**Audyt bazy:** 2026-06-18 · 11 działów · ~713 pytań · wspólne STOMA + LEK.

---

## 0. TL;DR dla bota

1. Treść **zawsze** pod `subject_id = biofizyka` (kanon). **Nigdy** `stoma-biofizyka` / `lek-biofizyka` — to tylko powłoki menu.
2. `topic_id` ∈ kontrolowana lista `BIOF-C1` … `BIOF-W5` (sekcja 2).
3. `questions.id`: `biofiz-{suffix}-{NNN}` — małe litery, `suffix` = część po `BIOF-` w `topic_id` (`c1`, `s2`, `w5` …).
4. 5 opcji `a`–`e` w JSONB; apostrofy w SQL podwajaj (`''`).
5. `theme_label`, `subtheme_label` → **`NULL`** (brak kontrolowanych list dla biofizyki).
6. Wszystkie istniejące działy mają `tracks = NULL` → widoczne na **stomatologii i lekarskim**.
7. Przed batchem sprawdź `MAX(id)` w dziale — nie zakładaj numeracji od `001`.
8. Po imporcie: `UPDATE topics SET question_count = …`.
9. **Nie** mieszaj prefiksów z histologią (`HIST-`), farmakologią (`FARM-`), socjologią (`SOC-`) itd.

---

## 1. Model shared (kanon + powłoki UI)

| Rola | `subjects.id` | Uwagi |
|------|---------------|-------|
| **Kanon treści** | `biofizyka` | `track = shared` — tu trafiają `topics` i `questions` |
| Powłoka STOMA | `stoma-biofizyka` | Rok 1 stomatologia, `display_order = 4` |
| Powłoka LEK | `lek-biofizyka` | Rok 1 lekarski |

Mapowanie w kodzie: `features/session/lib/resolveCatalogSubjectId.ts`, `sharedSubjects.ts`.

**Zakaz absolutny w SQL:**

```sql
-- ŹLE:
subject_id = 'stoma-biofizyka'
subject_id = 'lek-biofizyka'

-- DOBRZE:
subject_id = 'biofizyka'
```

---

## 2. Tematy (`topics.id`) — kontrolowana lista

Prefiks `BIOF-` + kod działu:

| Kod | Znaczenie serii |
|-----|-----------------|
| `C*` | Blok ćwiczeniowy / podstawy fizyczne w biologii |
| `S*` | Promieniowanie (jonizujące i niejonizujące) |
| `W*` | Wykłady — metody obrazowania i pomiary |

> **Uwaga:** brakuje `BIOF-W2` w programie — numeracja wykładów to W1, W3, W4, W5.

| `topic_id` | `display_order` | pytań | `questions.id` prefix | Nazwa |
|------------|----------------:|------:|-----------------------|-------|
| `BIOF-C1` | 1 | 39 | `biofiz-c1-` | Biospektroskopia |
| `BIOF-C2` | 2 | 55 | `biofiz-c2-` | Optyka cieczy (refrakcja, polaryzacja) |
| `BIOF-C3` | 3 | 91 | `biofiz-c3-` | Bioreologia (lepkość, wiskozymetria) |
| `BIOF-C4` | 4 | 62 | `biofiz-c4-` | Biomechanika (sprężystość, dźwignie) |
| `BIOF-S1` | 5 | 78 | `biofiz-s1-` | Promieniowanie jonizujące, dozymetria |
| `BIOF-S2` | 6 | 200 | `biofiz-s2-` | Promieniowanie niejonizujące, lasery, RTG |
| `BIOF-S3` | 7 | 37 | `biofiz-s3-` | Bioakustyka, słuch, USG |
| `BIOF-W1` | 8 | 42 | `biofiz-w1-` | Błędy pomiarowe |
| `BIOF-W3` | 9 | 26 | `biofiz-w3-` | Ultrasonografia (wykład) |
| `BIOF-W4` | 10 | 34 | `biofiz-w4-` | Tomografia komputerowa (CT) |
| `BIOF-W5` | 11 | 49 | `biofiz-w5-` | Tomografia rezonansu magnetycznego (MRI/NMR) |

Wszystkie mają `tracks = NULL` (wspólne oba kierunki).

---

## 3. Mapowanie treści → `topic_id`

Gdy materiał źródłowy nie podaje działu, kieruj wg zakresu merytorycznego:

### BIOF-C1 — Biospektroskopia
Absorpcja/emisja, widma UV-Vis, IR, fluorescencja, spektrofotometria, Beer-Lambert, chromofory białkowe, spektroskopia w medycynie.

### BIOF-C2 — Optyka cieczy
Snell, współczynnik załamania, soczewki, aberracje, polaryzacja, dwójłomność, optyka mikroskopowa w płynach/biomateriałach.

### BIOF-C3 — Bioreologia
Lepkość (dynamiczna, kinematyczna), reologia płynów nienewtonowskich, wiskozymetria, przepływ w naczyniach, model Newtona/Herschel-Bulkley (wg programu).

### BIOF-C4 — Biomechanika
Moduł Younga, naprężenie/odkształcenie, sprężystość tkanek, dźwignie w ciele, moment siły, równowaga statyczna.

### BIOF-S1 — Promieniowanie jonizujące
Alfa/beta/gamma, promieniotwórczość, jednostki (Bq, Gy, Sv), dozymetria, ochrona radiologiczna, efekty biologiczne.

### BIOF-S2 — Promieniowanie niejonizujące, lasery, RTG
Mikrofale, IR, lasery (klasy, zasady), RTG (anoda, filtracja, kontrast), bezpieczeństwo w gabinecie.

### BIOF-S3 — Bioakustyka, słuch, USG (ćwiczenia)
Fale dźwiękowe w ciele, progi słuchu, audiometria, podstawy echografii (głębokość, rozdzielczość).

### BIOF-W1 — Błędy pomiarowe
Błąd systematyczny/losowy, precyzja, dokładność, rozkład normalny, niepewność pomiaru, regresja liniowa w danych pomiarowych.

### BIOF-W3 — Ultrasonografia (wykład)
Zasady USG, częstotliwość, sondy, artefakty, Doppler, zastosowania kliniczne (bez duplikowania ćwiczeń z S3 jeśli da się rozdzielić).

### BIOF-W4 — Tomografia komputerowa (CT)
Detektory, rekonstrukcja, Hounsfield, dawka, kontrast, artefakty CT.

### BIOF-W5 — MRI / NMR
Spin jądrowy, T1/T2, sekwencje, magnetyczne pole, bezpieczeństwo (implanty, kontrast gadolinowy).

---

## 4. ID pytań — format i numeracja

### Wzorzec

```
biofiz-{suffix}-{NNN}
```

| `topic_id` | Przykład `id` |
|------------|---------------|
| `BIOF-C1` | `biofiz-c1-033` |
| `BIOF-S2` | `biofiz-s2-163` |
| `BIOF-W5` | `biofiz-w5-259` |

- `suffix` = **małe litery**, dokładnie jak w `topic_id` po `BIOF-` (`C1` → `c1`, `W5` → `w5`).
- `NNN` = trzy cyfry z zerem wiodącym.
- **Nie** używaj formatu `BIOF-C1-001` (to jest konwencja histologii, nie biofizyki).

### Następny wolny numer (stan 2026-06-18)

Sprawdź przed każdym batchem — poniższe to **max z poprawnym prefiksem** + 1:

| `topic_id` | Ostatni poprawny ID | `start_question_number` |
|------------|---------------------|-------------------------|
| `BIOF-C1` | `biofiz-c1-032` | **033** |
| `BIOF-C2` | `biofiz-c2-015` | **016** |
| `BIOF-C3` | `biofiz-c3-038` | **039** |
| `BIOF-C4` | `biofiz-c4-031` | **032** |
| `BIOF-S1` | `biofiz-s1-027` | **028** |
| `BIOF-S2` | `biofiz-s2-162` | **163** |
| `BIOF-S3` | `biofiz-s3-017` | **018** |
| `BIOF-W1` | `biofiz-w1-028` | **029** |
| `BIOF-W3` | `biofiz-w3-027` | **028** (już ciągłe) |
| `BIOF-W4` | `biofiz-w4-034` | **035** |
| `BIOF-W5` | `biofiz-w5-258` | **259** |

Zapytanie kontrolne:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'BIOF-S2'
   AND id LIKE 'biofiz-s2-%'
 ORDER BY id DESC LIMIT 1;
```

### Legacy — błędne prefiksy w starym imporcie

Część istniejących rekordów ma `id` typu `biofiz-w5-051` przypisane do **innego** `topic_id` (np. `BIOF-C1`). **Nowe batche:** zawsze trzymaj zgodność `biofiz-{suffix}` ↔ `topic_id`. Nie kopiuj tego wzorca.

---

## 5. METADANE BATCHA (wklej nad plikiem TXT)

```
METADANE BATCHA
subject_id: biofizyka
topic_id: BIOF-S2
topic_name: (tylko gdy is_new_topic=tak)
display_order: 6
tracks:                    ← puste = oba kierunki; stomatologia / lekarski tylko gdy nowy dział STOMA/LEK-only
question_id_prefix: biofiz-s2
start_question_number: 163
batch_label: e_biof_2026/1
is_new_topic: nie
```

---

## 6. Pola w `questions`

| Kolumna | Biofizyka |
|---------|-----------|
| `id` | `biofiz-{suffix}-{NNN}` |
| `topic_id` | `BIOF-*` z sekcji 2 |
| `text`, `options`, `correct_option_id`, `explanation` | **wymagane** |
| `theme_label`, `subtheme_label` | **`NULL`** |
| `batch_label` | np. `e_biof_2026/1` lub `NULL` (stary import LDEK ma `NULL`) |
| `source_exam`, `source_code` | opcjonalnie |
| `learning_outcome` | opcjonalnie |
| `tracks` | **`NULL`** (domyślnie oba kierunki) — ustaw `ARRAY['stomatologia']` tylko gdy batch wyłącznie STOMA w istniejącym wspólnym dziale |
| `difficulty`, `question_type`, `is_active` | **pomiń** (defaulty DB) |

---

## 7. Wzór SQL — skrót

```sql
-- ============================================================
-- BATCH: e_biof_2026/1
-- subject_id: biofizyka  ·  topic_id: BIOF-S2
-- tracks: both
-- Questions: N  ·  IDs: biofiz-s2-163 … biofiz-s2-XXX
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   source_exam, source_code, batch_label, theme_label, subtheme_label, learning_outcome, tracks)
VALUES
  (
    'biofiz-s2-163',
    'BIOF-S2',
    'Treść pytania…',
    '[
      {"id":"a","text":"…"},
      {"id":"b","text":"…"},
      {"id":"c","text":"…"},
      {"id":"d","text":"…"},
      {"id":"e","text":"…"}
    ]'::jsonb,
    'c',
    'Wyjaśnienie…',
    NULL,
    NULL,
    'e_biof_2026/1',
    NULL,
    NULL,
    NULL,
    NULL
  );

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'BIOF-S2'
       AND COALESCE(is_active, true)
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

Nowy dział (rzadko — program ma stałe 11 działów):

```sql
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count, tracks)
VALUES
  ('BIOF-C5', 'biofizyka', 'Nazwa ze źródła', 12, 0, NULL)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;
```

---

## 8. Eksport istniejącej treści (edycja / audyt)

```bash
node scripts/export-topic-questions.mjs --subject biofizyka --topic BIOF-S2 --format sql --out exports/biof-BIOF-S2.sql
node scripts/export-topic-questions.mjs --subject biofizyka --topic BIOF-C1 --format json --out exports/biof-BIOF-C1.json
```

`--subject` = **`biofizyka`** (kanon), nie `stoma-biofizyka`.

---

## 9. Checklist przed oddaniem SQL

1. `subject_id = biofizyka`, `topic_id` z tabeli §2.
2. Każde `id` unikalne; prefiks `biofiz-{suffix}` zgodny z `topic_id`.
3. 5 opcji `a`–`e`; `correct_option_id` istnieje w `options`.
4. Apostrofy podwojone w SQL.
5. Ostatni wiersz `VALUES` → `);`
6. `UPDATE question_count` na końcu.
7. Brak `DELETE` / `DROP` / `TRUNCATE`.
8. Smoke: STOMA (`stoma-biofizyka`) i LEK (`lek-biofizyka`) widzą ten sam dział i licznik pytań.

---

## 10. Powiązane pliki

| Plik | Rola |
|------|------|
| `ClaudePrompt-TXT-na-SQL.md` | Pełna instrukcja konwersji TXT → SQL |
| `FormatPisaniaPytan.md` | Uniwersalny format MCQ |
| `FormatPisaniaPytan-PoHistologii-Stoma.md` | Model shared + `tracks` (histologia → biofizyka) |
| `exports/histologia-i-po-histologii-katalog.md` | Katalog `BIOF-*` ze stanu bazy |
| `docs/KodyPrzedmiotow.md` | Słownik ID przedmiotów |
