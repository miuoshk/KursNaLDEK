# Profesjonalizm i humanizm (lek, rok 1) — batche generowane · handover dla Claude

**Dla:** Miłosz + Claude (konwersja materiału / generowanie pytań → SQL)  
**Przedmiot:** `lek-prof-humanizm` · kierunek **lekarski**, rok **1**  
**Powiązane:** `FormatPisaniaPytan.md` (opcje A–E, JSONB, apostrofy `''`), `FormatPisaniaPytan-ProfesjonalizmHumanizm.md` (temat `PHUM-ZAL` — zaliczenie, **inny** worek)

---

## 1. Dwa typy tematów (nie mylić)

| Typ | Kiedy | `topic_id` | Doc |
|-----|-------|------------|-----|
| **Zaliczenie końcowe** | Arkusze / testy z uczelni, egzamin końcowy | `PHUM-ZAL` | `FormatPisaniaPytan-ProfesjonalizmHumanizm.md` |
| **Generowane** | Pytania AI z programu wykładowego (batche poniżej) | `PHUM-*-GEN` | **ten plik** |

Tematy `(generowane)` to **osobne kafelki** w UI. Sesja **całego przedmiotu** ich **nie obejmuje** (filtr `-GEN` w `questionSelection.ts`). Student wybiera kafelek explicite albo łączy je w konfiguracji sesji.

---

## 2. Mapowanie tematów (stałe — nie wymyślaj innych)

| Nazwa w UI | `topic_id` | Prefiks `questions.id` | `display_order` |
|------------|------------|------------------------|-----------------|
| Zaliczenie końcowe | `PHUM-ZAL` | `phum-zal-` | 1 |
| Psychologia i komunikacja (generowane) | **`PHUM-PSY-GEN`** | **`phum-psy-gen-`** | 2 |
| Socjologia (generowane) | **`PHUM-SOC-GEN`** | **`phum-soc-gen-`** | 3 |
| Profesjonalizm, stres i wypalenie (generowane) | **`PHUM-PRO-GEN`** | **`phum-pro-gen-`** | 4 |

**Subject:** zawsze `lek-prof-humanizm`. **Nie** używaj `stoma-socjologia` ani innych przedmiotów.

Tematy `-GEN` są już w bazie (seed: `scripts/2026-06-13-phum-gen-topics.sql`). **Nie** wstawiaj ponownie `INSERT INTO subjects` ani `INSERT INTO topics` dla `-GEN`, chyba że user explicite prosi o naprawę rekordu.

---

## 3. Pipeline: materiał → SQL

### Krok A — wybierz temat

Jeden batch = **jeden** `topic_id` z tabeli §2 (wiersze `-GEN`).

Przykładowy podział merytoryczny (orientacyjnie):

- **PHUM-PSY-GEN** — psychologia medyczna, komunikacja werbalna/niewerbalna, relacja lekarz–pacjent, empatia, pytania otwarte, trudne rozmowy.
- **PHUM-SOC-GEN** — socjologia medycyny, rola chorego, system opieki, nierówności, wyzwania społeczne w medycynie.
- **PHUM-PRO-GEN** — profesjonalizm lekarski, etyka zawodowa, stres, wypalenie zawodowe, work–life balance, granice zawodowe.

### Krok B — METADANE BATCHA (wklej nad materiałem do Claude)

#### Psychologia i komunikacja

```text
METADANE BATCHA
subject_id: lek-prof-humanizm
topic_id: PHUM-PSY-GEN
topic_name: Psychologia i komunikacja (generowane)
is_new_topic: nie
question_id_prefix: phum-psy-gen
start_question_number: 1
batch_label: gen_phum_psy_2026
tracks: NULL
```

#### Socjologia

```text
METADANE BATCHA
subject_id: lek-prof-humanizm
topic_id: PHUM-SOC-GEN
topic_name: Socjologia (generowane)
is_new_topic: nie
question_id_prefix: phum-soc-gen
start_question_number: 1
batch_label: gen_phum_soc_2026
tracks: NULL
```

#### Profesjonalizm, stres i wypalenie

```text
METADANE BATCHA
subject_id: lek-prof-humanizm
topic_id: PHUM-PRO-GEN
topic_name: Profesjonalizm, stres i wypalenie (generowane)
is_new_topic: nie
question_id_prefix: phum-pro-gen
start_question_number: 1
batch_label: gen_phum_pro_2026
tracks: NULL
```

| Pole | Znaczenie |
|------|-----------|
| `start_question_number` | **Z bazy**, nie zgaduj — §5 |
| `batch_label` | Jedna etykieta na cały plik; sugerowane: `gen_phum_psy_2026`, `gen_phum_soc_2026`, `gen_phum_pro_2026` (albo numer partii: `gen_phum_psy_2026/2`) |
| `tracks` | `NULL` — przedmiot tylko lekarski |

### Krok C — output Claude

**Wyłącznie SQL:** `INSERT INTO public.questions` + `UPDATE public.topics` (licznik). Bez markdown w treści pytań.

---

## 4. Szablon SQL — batch generowany (kopiuj-wklej)

```sql
-- ============================================================
-- BATCH: gen_phum_psy_2026  ·  lek-prof-humanizm
-- Topic:  PHUM-PSY-GEN (Psychologia i komunikacja (generowane))
-- Author: Claude                Date: YYYY-MM-DD
-- Źródło: <program wykładu / notatki / generacja AI>
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   batch_label)
VALUES

('phum-psy-gen-001', 'PHUM-PSY-GEN',
 'Treść pytania…',
 '[
   {"id":"a","text":"Opcja A"},
   {"id":"b","text":"Opcja B"},
   {"id":"c","text":"Opcja C"},
   {"id":"d","text":"Opcja D"},
   {"id":"e","text":"Opcja E"}
 ]'::jsonb,
 'b',
 'Wyjaśnienie: 2–6 zdań po polsku — dlaczego poprawna odpowiedź i dlaczego główne dystraktory są błędne.',
 'gen_phum_psy_2026'),

('phum-psy-gen-002', 'PHUM-PSY-GEN',
 '…',
 '[
   {"id":"a","text":"…"},
   {"id":"b","text":"…"},
   {"id":"c","text":"…"},
   {"id":"d","text":"…"},
   {"id":"e","text":"…"}
 ]'::jsonb,
 'c',
 '…',
 'gen_phum_psy_2026');

-- OSTATNI rekord w VALUES kończy się );  — nie przecinkiem!

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'PHUM-PSY-GEN'
       AND COALESCE(is_active, true) = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

**Podmień** w szablonie:

- `PHUM-PSY-GEN` → `PHUM-SOC-GEN` lub `PHUM-PRO-GEN`
- `phum-psy-gen-` → `phum-soc-gen-` lub `phum-pro-gen-`
- `gen_phum_psy_2026` → odpowiedni `batch_label`

---

## 5. Numeracja — sprawdź przed każdym batchem

```sql
-- Psychologia i komunikacja
SELECT id FROM public.questions
 WHERE topic_id = 'PHUM-PSY-GEN'
 ORDER BY id DESC LIMIT 1;

-- Socjologia
SELECT id FROM public.questions
 WHERE topic_id = 'PHUM-SOC-GEN'
 ORDER BY id DESC LIMIT 1;

-- Profesjonalizm, stres i wypalenie
SELECT id FROM public.questions
 WHERE topic_id = 'PHUM-PRO-GEN'
 ORDER BY id DESC LIMIT 1;
```

Brak wyniku → start od `…-001`. Jest `phum-psy-gen-042` → następny to `phum-psy-gen-043`.

Trzy cyfry z zerami: `001`, `014`, `127`.

---

## 6. Pola `questions`

| Kolumna | Wartość |
|---------|---------|
| `id` | `phum-{psy\|soc\|pro}-gen-{NNN}` |
| `topic_id` | `PHUM-PSY-GEN` / `PHUM-SOC-GEN` / `PHUM-PRO-GEN` |
| `text` | Treść po polsku |
| `options` | JSONB, **5 opcji** `a`–`e`, stała kolejność |
| `correct_option_id` | `a`–`e` |
| `explanation` | 2–6 zdań po polsku |
| `batch_label` | np. `gen_phum_psy_2026` |
| `theme_label` | `NULL` |
| `subtheme_label` | `NULL` |
| `learning_outcome` | `NULL` |
| `source_exam` | `NULL` lub opis źródła |
| `source_code` | `NULL` |
| `tracks` | pomijaj → `NULL` |

Kolumn **`difficulty`** — nie istnieje w schemacie. Nie używaj.

---

## 7. Zasady merytoryczne

1. Zakres: etyka, humanizm, komunikacja, socjologia medycyny, profesjonalizm — **bez** szczegółów kliniczno-farmakologicznych.
2. Jedno pytanie = jeden problem; unikaj podwójnej negacji.
3. 5 wiarygodnych opcji; opcje kombinatoryczne dozwolone (kolejność `a`–`e` = pozycja w UI).
4. Bez emoji w `text` / `explanation`.
5. Apostrofy w SQL podwój (`''`).

---

## 8. Checklist przed Run (Supabase SQL Editor)

- [ ] Właściwy `topic_id` (`PHUM-PSY-GEN` / `PHUM-SOC-GEN` / `PHUM-PRO-GEN`)
- [ ] `id` unikalne, prefiks zgodny z tematem
- [ ] 5 opcji, `correct_option_id` zgodne z `options`
- [ ] Ostatni wiersz `VALUES` → `);`
- [ ] `UPDATE public.topics` dla **tego samego** `topic_id`
- [ ] Brak `INSERT INTO subjects`
- [ ] Brak `INSERT INTO topics` (tematy już są)
- [ ] Nie wrzucaj pytań generowanych do `PHUM-ZAL`

---

## 9. Prompt-system (wklej do projektu Claude)

> Konwertujesz materiał na SQL według `exports/prof-humanizm-gen-claude-handover.md`.
>
> Przedmiot: **`lek-prof-humanizm`** (lekarski, rok 1). Pytania generowane idą **wyłącznie** do jednego z:
> - `PHUM-PSY-GEN` — Psychologia i komunikacja (generowane)
> - `PHUM-SOC-GEN` — Socjologia (generowane)
> - `PHUM-PRO-GEN` — Profesjonalizm, stres i wypalenie (generowane)
>
> **Nie** używaj `PHUM-ZAL` (to osobny worek na zaliczenie — patrz `FormatPisaniaPytan-ProfesjonalizmHumanizm.md`).
>
> 1. Wyjście = wyłącznie SQL (`INSERT` pytań + `UPDATE` licznika tematu).
> 2. `id`: `phum-psy-gen-001` / `phum-soc-gen-001` / `phum-pro-gen-001` — kontynuuj od ostatniego w bazie.
> 3. 5 opcji `a`–`e`, stała kolejność w JSONB.
> 4. `batch_label`: `gen_phum_psy_2026`, `gen_phum_soc_2026` lub `gen_phum_pro_2026` (chyba że user poda inny).
> 5. `theme_label`, `subtheme_label`, `learning_outcome`: `NULL`.
> 6. Nie generuj `INSERT INTO subjects` ani `topics`.
> 7. Na końcu: `UPDATE public.topics SET question_count` dla użytego `topic_id`.

---

## 10. Weryfikacja po imporcie

```sql
SELECT id, name, question_count, display_order
  FROM public.topics
 WHERE subject_id = 'lek-prof-humanizm'
 ORDER BY display_order;

SELECT topic_id, batch_label, COUNT(*) AS n
  FROM public.questions
 WHERE topic_id LIKE 'PHUM-%-GEN'
   AND COALESCE(is_active, true) = true
 GROUP BY topic_id, batch_label
 ORDER BY topic_id, batch_label;
```

Oczekiwane kafelki: **4** (`PHUM-ZAL` + 3× `-GEN`), liczniki `question_count` zgodne z `COUNT(*)`.

---

## 11. Rollback przed/po edycji długości opcji

**Cel edycji:** poprawna odpowiedź **nie może** być jedyną najdłuższą opcją (idealnie rank długości 2–4, nie 1).

**Backup sprzed edycji (2026-06-13, 300 pytań):**

| Plik | Opis |
|------|------|
| `exports/prof-humanizm-gen-backup-2026-06-13.json` | Pełny stan **przed jakąkolwiek** edycją (PSY+SOC) |
| `exports/prof-humanizm-gen-backup-2026-06-13-rollback.sql` | Rollback **całości** do stanu wyjściowego |

**Backup / rollback per temat (po edycjach cząstkowych):**

| Temat | Backup sprzed fix | Rollback tylko ten temat |
|-------|-------------------|--------------------------|
| PSY (100) | `exports/prof-humanizm-gen-backup-2026-06-13.json` (filtr) | ten sam plik — stan oryginalny PSY |
| SOC (200) | `exports/prof-humanizm-soc-gen-backup-2026-06-13.json` | `exports/prof-humanizm-soc-gen-backup-2026-06-13-rollback.sql` |

**Edycje zastosowane:**

| Temat | Plik edycji | Stan audytu `onlyLongest` |
|-------|-------------|---------------------------|
| PSY | `exports/phum-psy-gen-edits.json` | **0%** (było 60%) |
| SOC | `exports/phum-soc-gen-edits.json` | **0%** (było 41,5%) |

**Nowy backup przed kolejną edycją:**

```bash
node scripts/phum-gen-backup.mjs --with-sql
```

**Rollback (gdy coś poszło nie tak):**

```bash
# Opcja A — SQL w Supabase (bez lokalnego env)
# Wklej i uruchom: exports/prof-humanizm-gen-backup-2026-06-13-rollback.sql

# Opcja B — skrypt (service role z .env.local)
node scripts/phum-gen-restore.mjs \
  --from exports/prof-humanizm-gen-backup-2026-06-13.json \
  --apply

# Dry-run przed apply:
node scripts/phum-gen-restore.mjs \
  --from exports/prof-humanizm-gen-backup-2026-06-13.json \
  --dry-run
```

**Audyt biasu długości (przed / po edycji):**

```bash
node scripts/phum-gen-audit-length.mjs --from exports/prof-humanizm-gen-backup-2026-06-13.json
node scripts/phum-gen-audit-length.mjs --live
```

Oczekiwany wynik po udanej edycji: `onlyLongestPct` blisko **20%** (losowo), nie ~48% jak w stanie wyjściowym.
 na