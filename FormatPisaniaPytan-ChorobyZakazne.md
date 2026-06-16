# Choroby zakaźne — handover Zenit → SQL (Kurs na LDEK)

> Źródło procesu: `ZAKAŹNE_handover.md` (pipeline Claude).  
> Platforma: **Supabase** · przedmiot STOMA r.3: `stoma-zakazne`.  
> Ogólne zasady MCQ: `FormatPisaniaPytan.md`.

---

## 1. Co wchodzi, co wychodzi

```text
[.txt surowy egzamin]  →  Claude (handover)  →  [ZAKSTO-z2024-2.txt bloki]
                                                      ↓
                                            konwersja TXT→SQL (Claude / skrypt)
                                                      ↓
                                            Supabase SQL Editor → questions
```

**Ten dokument** opisuje krok **bloki handover → SQL**. Nie zmienia reguł pisania pytań z handovera (400–500 znaków wyjaśnienia, FLAGA itd.).

---

## 2. Kierunki i batche (handover)

| Skrót handover | Plik wynikowy | `batch_label` w SQL | Gdzie w Kurs na LDEK |
|----------------|---------------|---------------------|----------------------|
| `STO` | `ZAKSTO-zRRRR-X.txt` | `ZAKSTO-zRRRR-X` | `stoma-zakazne` (rok 3 stomatologia) |
| `LEK` | `ZAKLEK-zRRRR-X.txt` | `ZAKLEK-zRRRR-X` | **brak przedmiotu w KNNP** — nie importuj, dopóki nie dodamy `lek-choroby-zakazne` |

- `RRRR` = rok egzaminu (np. 2024), `X` = numer batcha w roku/kierunku.
- Pole `BATCH` w bloku (np. `z2024-2`) to skrót wewnętrzny; w bazie trzymaj pełny label: `ZAKSTO-z2024-2`.

**STO:** tylko batche `ZAKSTO-*` → subject `stoma-zakazne`.  
**LEK:** pula ID globalna w handoverze jest wspólna z LEK, ale w tej aplikacji na razie **nie wgrywamy** `ZAKLEK-*`.

---

## 3. Przedmiot i tematy w bazie

| Poziom | Wartość |
|--------|---------|
| `subjects.id` | `stoma-zakazne` |
| `topics.id` | `CHZ-01` … `CHZ-23` (mapowanie 1:1 z `TEMAT_NR`) |
| `CHZ-ZAL` | opcjonalny worek „egzamin / całość” (display_order 24) |

### Mapowanie `TEMAT_NR` → `topic_id`

| NR | `topic_id` | `TEMAT` (nazwa w `topics.name`) |
|----|------------|----------------------------------|
| 1 | CHZ-01 | Zjawiska immunologiczne w chorobach zakaźnych i pasożytnicznych |
| 2 | CHZ-02 | Związki między gospodarzem a patogenem |
| 3 | CHZ-03 | Ogólna etiopatogeneza chorób zakaźnych |
| 4 | CHZ-04 | Leczenie etiotropowe - antybiotyki i chemioterapeutyki |
| 5 | CHZ-05 | Posocznica - wstrząs septyczny |
| 6 | CHZ-06 | Zakażenia szpitalne |
| 7 | CHZ-07 | Gorączka |
| 8 | CHZ-08 | Zakażenia wywołane przez bakterie Gram-dodatnie |
| 9 | CHZ-09 | Zakażenia wywołane przez bakterie Gram-ujemne |
| 10 | CHZ-10 | Inne choroby bakteryjne |
| 11 | CHZ-11 | Zakażenia wywołane przez DNA-wirusy |
| 12 | CHZ-12 | Zakażenia wywołane przez RNA-wirusy |
| 13 | CHZ-13 | Zakażenia wirusami hepatotropowymi |
| 14 | CHZ-14 | Grzybice głębokie |
| 15 | CHZ-15 | Inwazje pierwotniaków-pasożytów przewodu pokarmowego |
| 16 | CHZ-16 | Inwazje pierwotniaków-pasożytów pozajelitowych |
| 17 | CHZ-17 | Inwazje „egzotycznych” pierwotniaków |
| 18 | CHZ-18 | Inwazje nicieni przewodu pokarmowego |
| 19 | CHZ-19 | Inwazje tasiemców przewodu pokarmowego |
| 20 | CHZ-20 | Robaczyce tkankowe |
| 21 | CHZ-21 | Robaczyce „egzotyczne” |
| 22 | CHZ-22 | Wyodrębnione zespoły kliniczne |
| 23 | CHZ-23 | Inne zagadnienia |

**Reguła:** każde pytanie dostaje `topic_id` z **jednego** `TEMAT_NR` z bloku handover.

Seed SQL: `scripts/2026-05-28-zakazne-topics-23.sql`

---

## 4. Blok handover → kolumny SQL

### Pola bloku (wejście konwertera)

```
ID: ZAKSTO-z2024-2-245
NR_LOKALNY: 12
BATCH: z2024-2
KIERUNEK: STO
TEMAT_NR: 11
TEMAT: Zakażenia wywołane przez DNA-wirusy
PODTEMAT: ...
PYTANIE: ...
A: ...
B: ...
C: ...
D: ...
E: ...
POPRAWNA: C
WYJAŚNIENIE:
...
FLAGA: weryfikacja merytoryczna   ← opcjonalnie, tylko gdy jest w bloku
---
```

### Mapowanie na `questions`

| Blok handover | Kolumna SQL | Uwagi |
|---------------|-------------|--------|
| `ID` | `id` | **Bez zmiany** — np. `ZAKSTO-z2024-2-245` (unikalne w całej puli STO) |
| `TEMAT_NR` | `topic_id` | `CHZ-{NN}` z zerem wiodącym: `11` → `CHZ-11` |
| `PYTANIE` | `text` | Apostrofy `'` → `''` |
| `A`…`E` | `options` | JSONB, kolejność `a`→`e`; patrz §5 |
| `POPRAWNA` | `correct_option_id` | Mała litera: `C` → `c` |
| `WYJAŚNIENIE` | `explanation` | Markdown `**bold**` OK; apostrofy podwojone |
| `BATCH` + kierunek | `batch_label` | `ZAKSTO-z2024-2` (nie samo `z2024-2`) |
| `PODTEMAT` | `subtheme_label` | Opcjonalnie; `NULL` jeśli puste |
| `TEMAT` | — | Nie duplikuj — jest w `topics.name` |
| `FLAGA` | — | **Nie ma kolumny w DB** — przed importem rozwiąż lub oznacz w `subtheme_label` np. `FLAGA: weryfikacja` tylko jeśli musisz; lepiej poprawić klucz przed SQL |
| `NR_LOKALNY`, `KIERUNEK` | — | Tylko audyt; nie zapisuj do DB |

**Nie ustawiaj:** `difficulty`, `question_type` (domyślnie `single_choice`), `is_active` (domyślnie true).

---

## 5. `options` i opcje kombinatoryczne

- Tablica **zawsze** w kolejności `a`, `b`, `c`, `d`, `e`.
- `POPRAWNA: C` → `correct_option_id: 'c'`.
- Jeśli w opcji jest „prawidłowe A i C”, litera w tekście odnosi się do `id` w tej samej tablicy (jak w `FormatPisaniaPytan.md` §6.1).

Przykład:

```sql
'[
  {"id":"a","text":"..."},
  {"id":"b","text":"..."},
  {"id":"c","text":"..."},
  {"id":"d","text":"..."},
  {"id":"e","text":"..."}
]'::jsonb
```

---

## 6. Szablon SQL — jeden batch STO

```sql
-- ============================================================
-- BATCH: ZAKSTO-z2024-2  ·  stoma-zakazne
-- Global ID: 226–245 (przykład)
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label, subtheme_label)
VALUES

('ZAKSTO-z2024-2-226', 'CHZ-11',
 'Treść pytania…',
 '[
   {"id":"a","text":"Opcja A"},
   {"id":"b","text":"Opcja B"},
   {"id":"c","text":"Opcja C"},
   {"id":"d","text":"Opcja D"},
   {"id":"e","text":"Opcja E"}
 ]'::jsonb,
 'c',
 '**Wyjaśnienie** z boldem i kontekstem klinicznym…',
 'ZAKSTO-z2024-2',
 'PODTEMAT z bloku'),

('ZAKSTO-z2024-2-227', 'CHZ-06',
 'Kolejne pytanie…',
 '[
   {"id":"a","text":"..."},
   {"id":"b","text":"..."},
   {"id":"c","text":"..."},
   {"id":"d","text":"..."},
   {"id":"e","text":"..."}
 ]'::jsonb,
 'a',
 'Wyjaśnienie…',
 'ZAKSTO-z2024-2',
 NULL);

-- Ostatni rekord w VALUES kończy się );  wcześniejsze ),

-- Przelicz liczniki dla dotkniętych topików (po całym batchu):
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id IN ('CHZ-11','CHZ-06')  -- wszystkie CHZ-* z tego batcha
       AND COALESCE(is_active, true)
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

**Przed RUN:** sprawdź kolizje ID:

```sql
SELECT id FROM public.questions WHERE id IN ('ZAKSTO-z2024-2-226', 'ZAKSTO-z2024-2-227');
-- ma być pusto
```

**Następny wolny globalny ID** (po imporcie):

```sql
SELECT id FROM public.questions
 WHERE id LIKE 'ZAKSTO-%' OR id LIKE 'ZAKLEK-%'
 ORDER BY id DESC LIMIT 5;
```

---

## 7. Wejście surowe `.txt` (przed handoverem)

Format źródłowy egzaminu (parser handover):

```
1. Treść pytania
A. opcja
B. opcja
...
-------------------
Poprawna: C
______________
2. Kolejne pytanie
```

To **nie** idzie wprost do SQL — najpierw pipeline handover → bloki, potem ten dokument → SQL.

---

## 8. Checklist importu STO

- [ ] `KIERUNEK: STO` (albo plik `ZAKSTO-*.txt`)
- [ ] `topic_id` = `CHZ-` + `TEMAT_NR` (2 cyfry: `CHZ-03`, `CHZ-11`)
- [ ] `id` pytania = pole `ID` z bloku (globalna pula, bez zmiany numeru)
- [ ] `batch_label` = `ZAKSTO-zRRRR-X`
- [ ] `correct_option_id` mała litera `a`–`e`
- [ ] Apostrofy w SQL podwojone
- [ ] Ostatni wiersz `VALUES` → `);`
- [ ] `UPDATE topics` po batchu
- [ ] Brak importu `ZAKLEK-*` dopóki nie ma przedmiotu lekarskiego w KNNP

---

## 9. Pliki w repo

| Plik | Cel |
|------|-----|
| `scripts/2026-05-28-stoma-y3-choroby-zakazne.sql` | Subject `stoma-zakazne` |
| `scripts/2026-05-28-zakazne-topics-23.sql` | 23 działy CHZ-01…23 + CHZ-ZAL |
| `FormatPisaniaPytan-ChorobyZakazne.md` | Ten dokument |
| `ClaudePrompt-TXT-na-SQL.md` | Osobna ścieżka: prosty TXT → SQL (bez pól handover) |

---

## 10. Wiadomość do Claude (konwersja bloków → SQL)

Wklej pod blokami z `ZAKSTO-z2024-X.txt`:

```
Przekształć załączone bloki handover (format ZAKAŹNE) na SQL do Supabase.
Zasady: FormatPisaniaPytan-ChorobyZakazne.md w repo Kurs na LDEK.

Tylko KIERUNEK=STO / plik ZAKSTO-*.
subject: stoma-zakazne.
topic_id: CHZ-{TEMAT_NR dwucyfrowy}.
questions.id: bez zmiany pola ID z bloku.
batch_label: ZAKSTO-zRRRR-X.
POPRAWNA → correct_option_id małą literą.

Output: sam SQL + UPDATE question_count dla dotkniętych CHZ-*.
```
