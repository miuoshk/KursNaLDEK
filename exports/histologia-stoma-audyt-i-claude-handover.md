# Histologia STOMA — audyt bazy + handover dla Claude (TXT → SQL)

**Data audytu:** 2026-05-28  
**Cel:** wgrać nowy wsad **tylko pod stomatologię** (`stoma-histologia` w UI), **bez** psucia lekarskiego (`lek-histologia`) i bez mieszania z innymi przedmiotami.

**Powiązane pliki w repo:**
- `ClaudePrompt-TXT-na-SQL.md` — pełna instrukcja konwersji TXT → SQL
- `FormatPisaniaPytan-PoHistologii-Stoma.md` — model kanon + `tracks`
- `FormatPisaniaPytan.md` — ogólny format pytań

---

## Dla Claude — na co uważać (przeczytaj przed generowaniem SQL)

### 1. Ten import dotyczy WYŁĄCZNIE histologii stomatologicznej

- **Tak:** przedmiot kanoniczny `subject_id = histologia`, działy `HIST-*`, powłoka UI użytkownika to `stoma-histologia`.
- **Nie:** `lek-histologia`, `stoma-biofizyka`, `biofizyka`, `stoma-biologia`, `CHZ-*`, `FARM-*`, `ZAKSTO-*`, anatomia, socjologia itd.
- **Zakaz absolutny:** `subject_id = 'stoma-histologia'` lub `'lek-histologia'` w `INSERT INTO topics` — to tylko powłoki menu; treść **zawsze** pod `histologia`.

### 2. Shared vs STOMA-only — najczęstszy błąd

Histologia jest **współdzielona** między kierunkami. Topik z `tracks = NULL` jest widoczny na **stomatologii i lekarskim**.

| Sytuacja | Co zrobić w SQL |
|----------|-----------------|
| Pytania z egzaminów LDEK / ogólna histologia do istniejącego `HIST-01`…`HIST-20`, `HIST-22` | `INSERT` tylko do `questions`; **bez** zmiany `tracks` → trafią też na LEK |
| Treść **wyłącznie** dla programu stomatologii (np. wykład tylko STOMA, „po histologii” bez odpowiednika lek.) | **Nowy** `topic_id` (np. `HIST-23`) z `tracks = ARRAY['stomatologia']::TEXT[]` **albo** dopisywanie wyłącznie do `HIST-21` (już STOMA-only) |
| Batch ma być niewidoczny na lekarskim | **Nie** wgrywaj go do topików `HIST-01`…`HIST-20` / `HIST-22` bez `tracks` — załóż nowy dział ze `stomatologia` lub użyj `HIST-21` |

**W bazie już jest jeden dział tylko STOMA:** `HIST-21` (Rozwój zęba) — `tracks = ['stomatologia']`. Reszta `HIST-*` ma `tracks = NULL`.

### 3. Metadane batcha — nie zgaduj

Użytkownik musi podać blok **METADANE BATCHA** (szablon w `ClaudePrompt-TXT-na-SQL.md`). Claude **nie wymyśla** `topic_id`, `start_question_number`, `tracks`.

Minimalny szablon dla histo-STOMA:

```
METADANE BATCHA
subject_id: histologia
topic_id: HIST-14
topic_name: (tylko przy is_new_topic=tak)
display_order: 14
tracks: stomatologia          ← tylko gdy batch STOMA-only; inaczej puste/NULL
question_id_prefix: HIST-14
start_question_number: 88    ← następny wolny; patrz tabela §4
batch_label: e_hist_stoma_2026/1
is_new_topic: nie
```

### 4. ID pytań — format i kolizje

- Wzorzec: `HIST-{NN}-{NNN}` (np. `HIST-14-088`).
- Przed batchiem: sprawdź `MAX` numer w dziale (tabela §4) — **nie** zakładaj ciągłości od 001 jeśli w bazie są luki.
- **Nie** zmieniaj istniejących `questions.id` z importu LDEK (854 pytania już w bazie).
- `batch_label` u dotychczasowej treści jest **`NULL`** — nowe batche mogą mieć etykietę; nie nadpisuj starych wierszy.

### 5. Pola w `questions`

- Wstawiaj: `id`, `topic_id`, `text`, `options`, `correct_option_id`, `explanation`, `source_exam`, `source_code`, `batch_label`, `theme_label`, `subtheme_label`, `learning_outcome`.
- **5 opcji** `a`–`e` w JSONB; apostrofy w SQL → `''`.
- **Bez** `DELETE` / `DROP` / `TRUNCATE`.
- Po imporcie: `UPDATE topics SET question_count = …` dla dotkniętych `topic_id`.

### 6. Czego NIE robić przy „tylko STOMA”

1. Nie twórz topików pod `stoma-histologia` / `lek-histologia`.
2. Nie ustawiaj `tracks = ARRAY['lekarski']` (to wyłączy STOMA).
3. Nie importuj tego samego pliku raz pod `histologia` i raz pod inny przedmiot.
4. Nie mieszaj prefiksów (`HIST-` vs `BIOF-` vs `CHZ-`).
5. Jeśli plik źródłowy jest „dla obu kierunków” — użytkownik musi to **jawnie** zaakceptować (`tracks` puste); inaczej traktuj jako błąd scope.

### 7. Weryfikacja po imporcie (smoke)

- Konto **stomatologia** → `stoma-histologia` → widać nowy dział / licznik pytań rośnie.
- Konto **lekarski** → `lek-histologia` → **nie** widać działów z `tracks = stomatologia`; wspólne działy (`tracks` NULL) **widać** nowe pytania.

---

## Audyt Supabase (surowe wyniki)

### 1. Subjects powiązane z histologią

| id | name |
|---|---|
| stoma-histologia | Histologia i embriologia |
| lek-histologia | Histologia i embriologia |
| histologia | Histologia i embriologia |

### 2. Topici (`subject_id = histologia`)

| id | subject_id | name | display_order | question_count | tracks |
|---|---|---|---|---:|---|
| HIST-01 | histologia | Metody badawcze | 1 | 15 | NULL |
| HIST-02 | histologia | Cytoplazma | 2 | 13 | NULL |
| HIST-03 | histologia | Jądro komórkowe | 3 | 39 | NULL |
| HIST-04 | histologia | Tkanka nabłonkowa | 4 | 9 | NULL |
| HIST-05 | histologia | Tkanka łączna | 5 | 33 | NULL |
| HIST-06 | histologia | Tkanka tłuszczowa | 6 | 7 | NULL |
| HIST-07 | histologia | Chrząstka | 7 | 14 | NULL |
| HIST-08 | histologia | Kości | 8 | 17 | NULL |
| HIST-09 | histologia | Tkanka nerwowa i układ nerwowy | 9 | 35 | NULL |
| HIST-10 | histologia | Tkanka mięśniowa | 10 | 27 | NULL |
| HIST-11 | histologia | Układ krążenia | 11 | 38 | NULL |
| HIST-12 | histologia | Krew i hemopoeza | 12 | 51 | NULL |
| HIST-13 | histologia | Układ odpornościowy i narządy limfatyczne | 13 | 54 | NULL |
| HIST-14 | histologia | Układ pokarmowy | 14 | 86 | NULL |
| HIST-15 | histologia | Układ oddechowy | 15 | 52 | NULL |
| HIST-16 | histologia | Skóra | 16 | 40 | NULL |
| HIST-17 | histologia | Układ moczowy | 17 | 49 | NULL |
| HIST-18 | histologia | Gruczoły wewnątrzwydzielnicze | 18 | 88 | NULL |
| HIST-19 | histologia | Układ rozrodczy | 19 | 88 | NULL |
| HIST-20 | histologia | Oko i ucho — specjalne narządy zmysłów | 20 | 45 | NULL |
| HIST-21 | histologia | Rozwój zęba | 21 | 11 | **stomatologia** |
| HIST-22 | histologia | Embriologia ogólna i embriogeneza narządów | 22 | 43 | NULL |

**Suma pytań `HIST-*`:** 854

### 3. Próbka pytań (LIMIT 20)

| id | topic_id | batch_label | source_exam |
|---|---|---|---|
| HIST-01-001 | HIST-01 | NULL | LDEK 2023 sesja 1 |
| HIST-01-002 | HIST-01 | NULL | LDEK 2023 sesja 1 |
| HIST-01-003 | HIST-01 | NULL | LDEK 2023 sesja 1 |
| HIST-01-004 | HIST-01 | NULL | LDEK 2023 sesja 1 |
| HIST-01-005 | HIST-01 | NULL | LDEK 2022 sesja 1 |
| HIST-01-006 | HIST-01 | NULL | LDEK 2020 sesja 1 |
| HIST-01-007 | HIST-01 | NULL | LDEK 2019 sesja 1 |
| HIST-01-008 | HIST-01 | NULL | LDEK 2019 sesja 2 |
| HIST-01-009 | HIST-01 | NULL | LDEK 2019 sesja 2 |
| HIST-01-010 | HIST-01 | NULL | LDEK 2019 sesja 2 |
| HIST-01-011 | HIST-01 | NULL | LDEK 2019 sesja 2 |
| HIST-01-012 | HIST-01 | NULL | LDEK 2018 sesja 1 |
| HIST-01-013 | HIST-01 | NULL | LDEK 2018 sesja 1 |
| HIST-01-014 | HIST-01 | NULL | LDEK 2017 sesja 1 |
| HIST-01-015 | HIST-01 | NULL | LDEK 2017 sesja 1 |
| HIST-02-001 | HIST-02 | NULL | LDEK 2018 sesja 1 |
| HIST-02-002 | HIST-02 | NULL | LDEK 2018 sesja 1 |
| HIST-02-003 | HIST-02 | NULL | LDEK 2018 sesja 1 |
| HIST-02-004 | HIST-02 | NULL | LDEK 2018 sesja 1 |
| HIST-02-005 | HIST-02 | NULL | LDEK 2018 sesja 1 |

### 4. Rozkład per topic (kolejny wolny numer ≈ max_numer + 1)

| topic_id | total | pierwszy_id | ostatni_id | max_numer | następny_NNN |
|---|---:|---|---|---:|---|
| HIST-01 | 15 | HIST-01-001 | HIST-01-015 | 15 | 016 |
| HIST-02 | 13 | HIST-02-001 | HIST-02-013 | 13 | 014 |
| HIST-03 | 39 | HIST-03-001 | HIST-03-039 | 39 | 040 |
| HIST-04 | 9 | HIST-04-001 | HIST-04-009 | 9 | 010 |
| HIST-05 | 33 | HIST-05-001 | HIST-05-033 | 33 | 034 |
| HIST-06 | 7 | HIST-06-001 | HIST-06-007 | 7 | 008 |
| HIST-07 | 14 | HIST-07-001 | HIST-07-014 | 14 | 015 |
| HIST-08 | 17 | HIST-08-001 | HIST-08-018 | 18 | 019 |
| HIST-09 | 35 | HIST-09-003 | HIST-09-045 | 45 | 046 |
| HIST-10 | 27 | HIST-10-001 | HIST-10-027 | 27 | 028 |
| HIST-11 | 38 | HIST-11-001 | HIST-11-040 | 40 | 041 |
| HIST-12 | 51 | HIST-12-001 | HIST-12-052 | 52 | 053 |
| HIST-13 | 54 | HIST-13-001 | HIST-13-054 | 54 | 055 |
| HIST-14 | 86 | HIST-14-001 | HIST-14-087 | 87 | 088 |
| HIST-15 | 52 | HIST-15-001 | HIST-15-054 | 54 | 055 |
| HIST-16 | 40 | HIST-16-001 | HIST-16-040 | 40 | 041 |
| HIST-17 | 49 | HIST-17-001 | HIST-17-049 | 49 | 050 |
| HIST-18 | 88 | HIST-18-001 | HIST-18-088 | 88 | 089 |
| HIST-19 | 88 | HIST-19-001 | HIST-19-094 | 94 | 095 |
| HIST-20 | 45 | HIST-20-001 | HIST-20-045 | 45 | 046 |
| HIST-21 | 11 | HIST-21-001 | HIST-21-011 | 11 | 012 |
| HIST-22 | 43 | HIST-08-006 | HIST-22-043 | 43 | 044 |

Uwaga dla Claude: w kilku działach `total` ≠ `max_numer` lub `pierwszy_id` nie zaczyna od `-001` (luki / starsze ID). Przy dopisywaniu używaj **`start_question_number` z metadanych** wyliczonego z `max_numer + 1`, nie z `total + 1`.

### 5. Batche (`batch_label` / `source_exam`)

Wszystkie wiersze mają `batch_label = NULL` (import LDEK historyczny).

| batch_label | source_exam | pytan |
|---|---|---:|
| NULL | LDEK 2017 sesja 1 | 94 |
| NULL | LDEK 2018 sesja 1 | 54 |
| NULL | LDEK 2019 sesja 1 | 46 |
| NULL | LDEK 2019 sesja 2 | 92 |
| NULL | LDEK 2020 sesja 1 | 99 |
| NULL | LDEK 2021 sesja 1 | 60 |
| NULL | LDEK 2022 sesja 1 | 60 |
| NULL | LDEK 2023 sesja 1 | 59 |
| NULL | LDEK 2023 sesja 2 | 53 |
| NULL | LDEK 2023 sesja 3 | 1 |
| NULL | LDEK 2024 sesja 1 | 60 |
| NULL | LDEK 2024 sesja 2 | 59 |
| NULL | LDEK 2025 sesja 1 | 59 |
| NULL | LDEK 2025 sesja 2 | 58 |

---

## Przykład SQL — nowy dział tylko STOMA (`HIST-23`)

```sql
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count, tracks)
VALUES
  (
    'HIST-23',
    'histologia',
    'Nazwa z pliku źródłowego',
    23,
    0,
    ARRAY['stomatologia']::TEXT[]
  )
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;

-- potem INSERT INTO questions ... id HIST-23-001, ...
-- na końcu UPDATE question_count dla HIST-23
```

## Przykład SQL — dopisanie do istniejącego STOMA-only (`HIST-21`)

```sql
-- METADANE: subject_id=histologia, topic_id=HIST-21, start_question_number=12
-- tracks: stomatologia (dział już ma ten track — nie zmieniaj na NULL)
INSERT INTO public.questions (id, topic_id, text, options, correct_option_id, explanation, source_exam, batch_label)
VALUES
  ('HIST-21-012', 'HIST-21', '...', '[...]'::jsonb, 'c', '...', 'Źródło ze TXT', 'e_hist_stoma_2026/1');
```

---

## Zapytania read-only (do odświeżenia audytu)

```sql
SELECT id, name FROM public.subjects
WHERE id ILIKE '%hist%' OR name ILIKE '%histolog%';

SELECT id, subject_id, name, display_order, question_count, tracks
FROM public.topics
WHERE subject_id = 'histologia'
ORDER BY display_order;

SELECT id, topic_id, batch_label, source_exam
FROM public.questions
WHERE topic_id LIKE 'HIST-%'
ORDER BY id LIMIT 20;

SELECT topic_id, COUNT(*) AS total,
       MIN(id) AS pierwszy_id, MAX(id) AS ostatni_id,
       MAX((regexp_match(id, '([0-9]+)$'))[1]::int) AS max_numer
FROM public.questions
WHERE topic_id LIKE 'HIST-%'
GROUP BY topic_id ORDER BY topic_id;

SELECT batch_label, source_exam, COUNT(*) AS pytan
FROM public.questions
WHERE topic_id LIKE 'HIST-%'
GROUP BY batch_label, source_exam ORDER BY batch_label;
```
