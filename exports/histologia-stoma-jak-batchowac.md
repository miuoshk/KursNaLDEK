# Histologia STOMA — jak batchować pytania (TXT → SQL)

**Dla:** Miłosz + Claude (konwersja plików `.txt`)  
**Stan:** `questions.tracks` w bazie + filtr w aplikacji (commit `9225507`, migracja `scripts/2026-05-28-questions-tracks.sql`)

**Powiązane:**
- `ClaudePrompt-TXT-na-SQL.md` — wklej **INSTRUKCJA SYSTEMOWA** do projektu Claude
- `FormatPisaniaPytan.md` — format jednego pytania (A–E, wyjaśnienie)
- `FormatPisaniaPytan-PoHistologii-Stoma.md` — mapowanie działów `HIST-01`…`HIST-22`
- `exports/histologia-stoma-audyt-i-claude-handover.md` — max numer ID per dział, checklist

---

## 1. Jedna zasada (przeczytaj najpierw)

Treść histologii jest pod **`subject_id = histologia`** (kanon). W menu studenta STOMA to **`stoma-histologia`** — **nie** używaj `stoma-histologia` w SQL.

| Co wgrywasz | `topic_id` | `questions.tracks` | Widzi STOMA | Widzi LEK |
|-------------|------------|-------------------|-------------|-----------|
| Stare pytania LDEK (już w bazie) | `HIST-14` | `NULL` | tak | tak |
| **Nowe pytania tylko dla stomatologii** | **ten sam** `HIST-14` | **`ARRAY['stomatologia']`** | tak | **nie** |
| Cały nowy dział tylko STOMA | np. `HIST-23` (+ opcjonalnie `topics.tracks`) | na pytaniach `stomatologia` | tak | nie |

**Mechanizm:** ten sam dział `HIST-14` w UI, ale nowe pytania mają `questions.tracks = ['stomatologia']` — lekarski ich nie dostaje w sesji, powtórkach ani licznikach.

**Nie** duplikuj działu jako `HIST-14-S` — nie trzeba.

---

## 2. Pipeline krok po kroku

### Krok A — przygotuj plik `.txt`

- **Jeden plik = jeden dział** (`HIST-14`, `HIST-21`, …).
- Między pytaniami: pusta linia lub `---`.
- Blok pytania: `PYTANIE` / `A)`…`E)`, `ODPOWIEDŹ`, `WYJAŚNIENIE` (szczegóły: `FormatPisaniaPytan.md`).

### Krok B — METADANE BATCHA (wklej **nad** plik TXT do Claude)

Skopiuj do Claude Project też całą sekcję **INSTRUKCJA SYSTEMOWA** z `ClaudePrompt-TXT-na-SQL.md`.

#### Szablon — dopisek do **istniejącego** działu (najczęstszy przypadek)

```text
METADANE BATCHA
subject_id: histologia
topic_id: HIST-14
is_new_topic: nie
question_id_prefix: HIST-14
start_question_number: 89
batch_label: e_hist_stoma_2026/1
tracks: stomatologia
```

| Pole | Znaczenie |
|------|-----------|
| `subject_id` | Zawsze `histologia` |
| `topic_id` | `HIST-01` … `HIST-22` (tabela w §4) |
| `is_new_topic` | `nie` — dział już jest w bazie |
| `start_question_number` | Następny wolny numer — **z bazy**, nie zgaduj (§5) |
| `batch_label` | Jedna etykieta na cały plik, np. `e_hist_stoma_2026/1` |
| `tracks` | **`stomatologia`** → Claude wstawia `ARRAY['stomatologia']::TEXT[]` przy **każdym** pytaniu |

#### Szablon — **nowy** dział tylko STOMA (rzadziej)

```text
METADANE BATCHA
subject_id: histologia
topic_id: HIST-23
topic_name: Nazwa ze źródła (wykład / program STOMA)
display_order: 23
is_new_topic: tak
question_id_prefix: HIST-23
start_question_number: 1
batch_label: e_hist_stoma_2026/2
tracks: stomatologia
```

Przy `is_new_topic: tak` → na początku SQL: `INSERT INTO topics` z `tracks = ARRAY['stomatologia']::TEXT[]`.

#### Szablon — dział **HIST-21** (Rozwój zęba)

Dział ma już `topics.tracks = stomatologia`. I tak na **pytaniach** ustaw `tracks: stomatologia` w metadanych.

```text
METADANE BATCHA
subject_id: histologia
topic_id: HIST-21
is_new_topic: nie
question_id_prefix: HIST-21
start_question_number: 12
batch_label: e_hist_stoma_2026/3
tracks: stomatologia
```

### Krok C — output od Claude = jeden plik `.sql`

Wymagania:
- Tylko SQL (bez markdownu wokół).
- **Bez** `DELETE` / `DROP` / `TRUNCATE`.
- Każde nowe pytanie STOMA: kolumna **`tracks`** = `ARRAY['stomatologia']::TEXT[]`.
- Na końcu: `UPDATE topics` → `question_count` dla dotkniętego `topic_id`.

### Krok D — wgranie

Supabase → **SQL Editor** → wklej cały plik → **Run**.

### Krok E — smoke (2 minuty)

1. Konto **stomatologia** → Histologia → dział → licznik rośnie, sesja pokazuje nowe pytania.
2. Konto **lekarski** → ten sam dział → **bez** nowych pytań (stary LDEK zostaje).

SQL kontrolny:

```sql
SELECT id, topic_id, batch_label, tracks
FROM public.questions
WHERE batch_label = 'e_hist_stoma_2026/1'
ORDER BY id;
```

---

## 3. Przykład SQL — jedno pytanie STOMA w `HIST-14`

```sql
-- ============================================================
-- BATCH: e_hist_stoma_2026/1  ·  histologia / HIST-14
-- tracks: stomatologia (pytania) — tylko kierunek stomatologia
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   source_exam, source_code, batch_label, tracks)
VALUES
(
  'HIST-14-089',
  'HIST-14',
  'Treść pytania…',
  '[
    {"id":"a","text":"Opcja A"},
    {"id":"b","text":"Opcja B"},
    {"id":"c","text":"Opcja C"},
    {"id":"d","text":"Opcja D"},
    {"id":"e","text":"Opcja E"}
  ]'::jsonb,
  'c',
  'Wyjaśnienie: poprawna jest C, ponieważ…',
  NULL,
  NULL,
  'e_hist_stoma_2026/1',
  ARRAY['stomatologia']::TEXT[]
);

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
    FROM public.questions q
    WHERE q.topic_id = 'HIST-14' AND COALESCE(q.is_active, true)
    GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

**Ważne dla Claude:**
- `tracks` w `INSERT INTO questions` — **obowiązkowe**, gdy w METADANE jest `tracks: stomatologia`.
- `topic_id` zostaje `HIST-14` — **nie** zmieniaj `topics.tracks` na NULL dziale, jeśli dopisujesz tylko pytania STOMA.
- Apostrofy w tekście → `''` w SQL (np. `Baile''a`).

---

## 4. Mapowanie działów (`topic_id`)

| `topic_id` | Nazwa | Uwaga |
|------------|-------|--------|
| HIST-01 | Metody badawcze | wspólny dział, pytania STOMA → `questions.tracks` |
| HIST-02 | Cytoplazma | j.w. |
| HIST-03 | Jądro komórkowe | j.w. |
| HIST-04 | Tkanka nabłonkowa | j.w. |
| HIST-05 | Tkanka łączna | j.w. |
| HIST-06 | Tkanka tłuszczowa | j.w. |
| HIST-07 | Chrząstka | j.w. |
| HIST-08 | Kości | j.w. |
| HIST-09 | Tkanka nerwowa i układ nerwowy | j.w. |
| HIST-10 | Tkanka mięśniowa | j.w. |
| HIST-11 | Układ krążenia | j.w. |
| HIST-12 | Krew i hemopoeza | j.w. |
| HIST-13 | Układ odpornościowy i narządy limfatyczne | j.w. |
| HIST-14 | Układ pokarmowy | j.w. |
| HIST-15 | Układ oddechowy | j.w. |
| HIST-16 | Skóra | j.w. |
| HIST-17 | Układ moczowy | j.w. |
| HIST-18 | Gruczoły wewnątrzwydzielnicze | j.w. |
| HIST-19 | Układ rozrodczy | j.w. |
| HIST-20 | Oko i ucho | j.w. |
| HIST-21 | Rozwój zęba | dział już STOMA-only na topiku |
| HIST-22 | Embriologia ogólna | j.w. |

Pełny audyt liczników: `exports/histologia-stoma-audyt-i-claude-handover.md` §4.

---

## 5. Skąd wziąć `start_question_number`

**Zasada:** `max_numer + 1` w danym `topic_id`. ID: `HIST-{NN}-{NNN}`.

```sql
SELECT topic_id,
       MAX((regexp_match(id, '([0-9]+)$'))[1]::int) AS max_numer
FROM public.questions
WHERE topic_id = 'HIST-14'
GROUP BY topic_id;
-- jeśli max_numer = 88 → start_question_number: 89 → id HIST-14-089
```

Eksport działu do podglądu (lokalnie):

```bash
node scripts/export-topic-questions.mjs --subject histologia --topic HIST-14 --format sql --out exports/hist-HIST-14.sql
```

---

## 6. Nazewnictwo batchy

Stały prefiks (jeden plik TXT = jeden batch):

```text
e_hist_stoma_{rok}/{nr}
```

Przykłady:
- `e_hist_stoma_2026/1`
- `e_hist_stoma_2026/2`

`batch_label` = ta sama wartość we **wszystkich** wierszach `INSERT` w pliku.

---

## 7. Błędy — czego NIE robić

| Błąd | Skutek |
|------|--------|
| `subject_id = stoma-histologia` | FK / brak działów |
| Nowe STOMA bez `questions.tracks` | Pytania pojawią się na **lekarskim** |
| `tracks: stomatologia` tylko w komentarzu, nie w INSERT | To samo |
| Zgadnięcie `start_question_number` | Kolizja `id` |
| `DELETE` starych pytań | Uszkodzenie postępu userów |
| Mieszanie `HIST-` z `BIOF-` / `CHZ-` | Zły przedmiot |

---

## 8. Kiedy **nie** ustawiać `tracks: stomatologia`

Jeśli pytania mają być widoczne **także na lekarskim** (np. czyste LDEK do wspólnego działu) — w METADANE **pomiń** `tracks` albo zostaw puste → w SQL `tracks = NULL` na pytaniu.

To **nie** jest typowy przypadek dla „pytań po histologii STOMA” — domyślnie zakładamy **tylko STOMA**.

---

## 9. Checklist Claude przed oddaniem SQL

- [ ] `subject_id = histologia`
- [ ] `topic_id` z tabeli §4 (nie wymyślony)
- [ ] `is_new_topic` zgodne z metadanymi
- [ ] ID od `start_question_number` z metadanych
- [ ] **Każde** pytanie ma `tracks = ARRAY['stomatologia']::TEXT[]` jeśli METADANE mówi `tracks: stomatologia`
- [ ] 5 opcji `a`–`e` w JSONB
- [ ] `batch_label` jedna wartość na cały plik
- [ ] `UPDATE question_count` na końcu
- [ ] Brak `DELETE` / `DROP`

---

## 10. Checklist po imporcie (człowiek)

- [ ] SQL bez błędów w Editorze
- [ ] `SELECT … WHERE batch_label = '…'` — wiersze mają `tracks = {stomatologia}`
- [ ] STOMA: widać pytania w dziale
- [ ] LEK: **nie** widać tych samych ID w sesji / liczniku działu (dla STOMA-only)

---

## TL;DR

1. TXT jeden dział `HIST-XX`  
2. METADANE z `tracks: stomatologia` + `start_question_number` z bazy  
3. Claude + `ClaudePrompt-TXT-na-SQL.md` → SQL z **`questions.tracks`**  
4. Supabase SQL Editor  
5. Smoke STOMA vs LEK  
