# Format pytań — Profesjonalizm i humanizm w medycynie · Zaliczenie końcowe

> **Zaliczenie końcowe = jeden worek:** pytania z arkuszy / egzaminu trafiają do **`PHUM-ZAL`**. Batche **generowane** (psychologia, socjologia, profesjonalizm) → osobne tematy `PHUM-*-GEN` — patrz **`exports/prof-humanizm-gen-claude-handover.md`**.
>
> Zasady opcji A–E, kolejność w JSONB, apostrofy `''`, opcje kombinatoryczne — jak w `FormatPisaniaPytan.md`.

---

## 0. TL;DR dla bota

1. Wyjście = **tylko SQL**, gotowy do Supabase SQL Editor → Run.
2. **Zawsze** `topic_id = 'PHUM-ZAL'` — bez wyjątków.
3. **Zawsze** `id` pytania: `phum-zal-001`, `phum-zal-002`, … (kontynuuj numerację).
4. 5 opcji `a`–`e` w JSONB, kolejność stała (UI nie miesza opcji).
5. `theme_label`, `subtheme_label`, `learning_outcome`, `source_exam`, `source_code` → **`NULL`** (chyba że user poda `batch_label` / `source_exam`).
6. **Nie** wstawiaj `INSERT INTO subjects` ani `INSERT INTO topics` — przedmiot i temat już są w bazie.
7. Ostatni rekord w `VALUES` kończy się **`);`**, nie przecinkiem.
8. Na końcu batcha: `UPDATE` na `question_count` dla `PHUM-ZAL`.

---

## 1. Stałe wartości (nie wybieraj — kopiuj)

| Pole | Wartość |
|------|---------|
| `subjects.id` | `lek-prof-humanizm` |
| `subjects.track` | `lekarski` |
| `subjects.year` | `1` |
| `topics.id` | **`PHUM-ZAL`** |
| Nazwa tematu w UI | Zaliczenie końcowe |
| Prefiks `id` pytania | **`phum-zal-`** |
| Domyślny `batch_label` | `e_phum_zal` (albo `e_phum_zal_2026` jeśli user poda rok) |

**Czego bot NIE robi:**

- Nie dodaje tematów `-GEN` ani nie wrzuca pytań generowanych do `PHUM-ZAL` (to osobne kafelki — handover generowanych).
- Nie przypisuje pytań do innych przedmiotów (`stoma-*`, inne `lek-*`).
- Nie używa `theme_label` z anatomii (`subtheme_label` = `NULL`).

---

## 2. Numeracja pytań

Trzy cyfry z zerami: `001`, `014`, `127`.

Przed batchem:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'PHUM-ZAL'
 ORDER BY id DESC
 LIMIT 1;
```

Brak wyniku → start od `phum-zal-001`.

---

## 3. Kolumny `questions` (produkcja)

| Kolumna | Wartość |
|---------|---------|
| `id` | `phum-zal-{NNN}` |
| `topic_id` | **`PHUM-ZAL`** |
| `text` | Treść pytania |
| `options` | JSONB, 5 opcji `a`–`e` |
| `correct_option_id` | `a` / `b` / `c` / `d` / `e` |
| `explanation` | 2–6 zdań po polsku |
| `batch_label` | `e_phum_zal` lub z polecenia usera |
| `theme_label` | `NULL` |
| `subtheme_label` | `NULL` |
| `learning_outcome` | `NULL` |
| `source_exam` | `NULL` lub np. `Zaliczenie PHUM 2026` |
| `source_code` | `NULL` |

> Kolumny `difficulty`, `question_type`, `is_active` — **pomiń**.

---

## 4. SZABLON SQL — pełny batch (kopiuj-wklej)

```sql
-- ============================================================
-- BATCH: e_phum_zal  ·  lek-prof-humanizm
-- Topic:  PHUM-ZAL (Zaliczenie końcowe) — JEDEN WOREK
-- Author: <bot>                Date: YYYY-MM-DD
-- Źródło: <np. Zaliczenie końcowe PHUM 2026 / arkusz / test>
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   batch_label)
VALUES

('phum-zal-001', 'PHUM-ZAL',
 'Treść pierwszego pytania…',
 '[
   {"id":"a","text":"Opcja A"},
   {"id":"b","text":"Opcja B"},
   {"id":"c","text":"Opcja C"},
   {"id":"d","text":"Opcja D"},
   {"id":"e","text":"Opcja E"}
 ]'::jsonb,
 'b',
 'Wyjaśnienie: dlaczego poprawna odpowiedź jest poprawna i dlaczego główne dystraktory są błędne.',
 'e_phum_zal'),

('phum-zal-002', 'PHUM-ZAL',
 'Treść drugiego pytania…',
 '[
   {"id":"a","text":"…"},
   {"id":"b","text":"…"},
   {"id":"c","text":"…"},
   {"id":"d","text":"…"},
   {"id":"e","text":"…"}
 ]'::jsonb,
 'c',
 'Wyjaśnienie…',
 'e_phum_zal');

-- OSTATNI rekord w VALUES kończy się );  — nie przecinkiem!

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'PHUM-ZAL'
       AND is_active = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 5. Zasady merytoryczne

1. Pytania z zakresu: etyka lekarska, komunikacja z pacjentem, humanizm, profesjonalizm, prawo pacjenta, relacja lekarz–pacjent, postępowanie w sytuacjach dylematów (bez szczegółów kliniczno-farmakologicznych).
2. Jedno pytanie = jeden problem — bez podwójnych negacji.
3. 5 opcji wiarygodnych; opcje kombinatoryczne dozwolone (kolejność `a`–`e` = pozycja w UI).
4. `explanation`: uzasadnienie normy/standardu + dlaczego dystraktory są błędne.
5. Bez emoji w `text` / `explanation`.

---

## 6. Checklist przed Run

- [ ] Każde `topic_id` = **`PHUM-ZAL`**
- [ ] Każde `id` = `phum-zal-{NNN}`, unikalne
- [ ] 5 opcji, `correct_option_id` zgodne z `options`
- [ ] Apostrofy podwojone (`''`)
- [ ] Ostatni wiersz `VALUES` → `);`
- [ ] `UPDATE public.topics` dla `PHUM-ZAL`
- [ ] Brak `INSERT INTO subjects` / `topics`

---

## 7. Prompt-system (wklej do Claude)

> Konwertujesz materiał na SQL według `FormatPisaniaPytan-ProfesjonalizmHumanizm.md`.
>
> **Zasada nadrzędna:** wszystkie pytania → **`PHUM-ZAL`** (Zaliczenie końcowe), przedmiot **`lek-prof-humanizm`** (lekarski, rok 1). Nie twórz innych tematów.
>
> 1. Wyjście = wyłącznie SQL (INSERT pytań + UPDATE licznika).
> 2. `id`: `phum-zal-001` … kontynuuj od ostatniego w bazie.
> 3. `topic_id`: zawsze `PHUM-ZAL`.
> 4. 5 opcji `a`–`e`, stała kolejność w JSONB.
> 5. `explanation`: 2–6 zdań po polsku.
> 6. `batch_label`: `e_phum_zal` (chyba że user poda inny).
> 7. `theme_label`, `subtheme_label`, `learning_outcome`: `NULL`.
> 8. Nie generuj `INSERT INTO subjects` ani `topics`.
> 9. Na końcu: `UPDATE public.topics SET question_count` dla `PHUM-ZAL`.

---

## 8. Kontekst w aplikacji

- Widoczny **tylko** na kierunku **lekarski**, **rok 1** (entitlement roku).
- W UI: **Zaliczenie końcowe** (`PHUM-ZAL`) + 3 kafelki generowane (`PHUM-PSY-GEN`, `PHUM-SOC-GEN`, `PHUM-PRO-GEN`).
- Sesja całego przedmiotu = pula bez `-GEN`; sesja z kafelka = wybrany temat.
