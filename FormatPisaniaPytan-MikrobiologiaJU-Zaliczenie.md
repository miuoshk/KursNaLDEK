# Format pytań — Mikrobiologia JU · Zaliczenie całościowe

> **Jeden worek.** Wszystkie pytania z zaliczenia końcowego trafiają do **jednego** `topic_id`: `MJU-ZAL`. Bot **nie mapuje** pytań na ćwiczenia 1–6 ani kolokwia — zero decyzji o temacie.
>
> Zasady opcji A–E, kolejność w JSONB, apostrofy `''`, opcje kombinatoryczne — jak w `FormatPisaniaPytan.md`.

---

## 0. TL;DR dla bota

1. Wyjście = **tylko SQL**, gotowy do Supabase SQL Editor → Run.
2. **Zawsze** `topic_id = 'MJU-ZAL'` — bez wyjątków.
3. **Zawsze** `id` pytania: `mju-zal-001`, `mju-zal-002`, … (kontynuuj numerację).
4. 5 opcji `a`–`e` w JSONB, kolejność stała (UI nie miesza opcji).
5. `theme_label`, `subtheme_label`, `learning_outcome`, `source_exam`, `source_code` → **`NULL`** (chyba że user poda `batch_label`).
6. **Nie** wstawiaj `INSERT INTO topics` — temat już jest w bazie.
7. Ostatni rekord w `VALUES` kończy się **`);`**, nie przecinkiem.
8. Na końcu batcha: `UPDATE` na `question_count` dla `MJU-ZAL`.

---

## 1. Stałe wartości (nie wybieraj — kopiuj)

| Pole | Wartość |
|------|---------|
| `subjects.id` | `stoma-mikrobio-ju` |
| `topics.id` | **`MJU-ZAL`** |
| Nazwa tematu w UI | Zaliczenie całościowe |
| Prefiks `id` pytania | **`mju-zal-`** |
| Domyślny `batch_label` | `e_mju_zal` (albo `e_mju_zal_2026` jeśli user poda rok) |

**Czego bot NIE robi:**

- Nie przypisuje pytań do `MJU-C01` … `MJU-C06`, `MJU-KZ1`, `MJU-KZ2`.
- Nie dzieli materiału na podtematy w bazie (`subtheme_label` = `NULL`).
- Nie używa listy `theme_label` z anatomii.

---

## 2. Numeracja pytań

Trzy cyfry z zerami: `001`, `014`, `127`.

Przed batchem (lub w nagłówku SQL) bot powinien założyć kontynuację od ostatniego ID:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'MJU-ZAL'
 ORDER BY id DESC
 LIMIT 1;
```

Brak wyniku → start od `mju-zal-001`.

---

## 3. Kolumny `questions` (produkcja)

| Kolumna | Wartość dla zaliczenia |
|---------|------------------------|
| `id` | `mju-zal-{NNN}` |
| `topic_id` | **`MJU-ZAL`** |
| `text` | Treść pytania |
| `options` | JSONB, 5 opcji `a`–`e` |
| `correct_option_id` | `a` / `b` / `c` / `d` / `e` |
| `explanation` | 2–6 zdań po polsku |
| `batch_label` | `e_mju_zal` lub z polecenia usera |
| `theme_label` | `NULL` |
| `subtheme_label` | `NULL` |
| `learning_outcome` | `NULL` |
| `source_exam` | `NULL` lub np. `Zaliczenie MJU 2026` |
| `source_code` | `NULL` |

> Kolumny `difficulty`, `question_type`, `is_active` — **pomiń** (DB ma domyślne / nie ma `difficulty` w prod).

---

## 4. SZABLON SQL — pełny batch (kopiuj-wklej)

```sql
-- ============================================================
-- BATCH: e_mju_zal  ·  stoma-mikrobio-ju
-- Topic:  MJU-ZAL (Zaliczenie całościowe) — JEDEN WOREK
-- Author: <bot>                Date: YYYY-MM-DD
-- Źródło: <np. Zaliczenie końcowe MJU 2026 / arkusz / kolokwium zbiorcze>
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   batch_label)
VALUES

('mju-zal-001', 'MJU-ZAL',
 'Treść pierwszego pytania…',
 '[
   {"id":"a","text":"Opcja A"},
   {"id":"b","text":"Opcja B"},
   {"id":"c","text":"Opcja C"},
   {"id":"d","text":"Opcja D"},
   {"id":"e","text":"Opcja E"}
 ]'::jsonb,
 'b',
 'Wyjaśnienie: dlaczego B jest poprawna i dlaczego główne dystraktory są błędne (2–5 zdań).',
 'e_mju_zal'),

('mju-zal-002', 'MJU-ZAL',
 'Treść drugiego pytania…',
 '[
   {"id":"a","text":"…"},
   {"id":"b","text":"…"},
   {"id":"c","text":"…"},
   {"id":"d","text":"…"},
   {"id":"e","text":"…"}
 ]'::jsonb,
 'a',
 'Wyjaśnienie…',
 'e_mju_zal');

-- OSTATNI rekord w VALUES kończy się );  — nie przecinkiem!

-- ============================================================
-- PO WSZYSTKICH INSERTACH — licznik na kafelku tematu
-- ============================================================

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'MJU-ZAL'
       AND is_active = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

### Wiele partii tego samego zaliczenia

Kolejny plik SQL = kontynuacja numeracji (`mju-zal-051` …), ten sam `topic_id` i zwykle ten sam `batch_label`. Zawsze jeden `UPDATE` na końcu.

---

## 5. Zasady merytoryczne (MJU)

1. Terminy polskie; łacina w nawiasie tam, gdzie standard (np. *Streptococcus mutans*).
2. Jedno pytanie = jeden fakt / jeden mechanizm — bez podwójnych negacji.
3. 5 opcji wiarygodnych, podobnej długości; opcje kombinatoryczne („prawidłowe A i C”) **dozwolone** — kolejność `a`–`e` musi się zgadzać z treścią (UI nie tasuje).
4. `explanation`: mechanizm lub uzasadnienie + krótko dlaczego 1–2 dystraktory są złe.
5. Bez emoji w `text` / `explanation`.

---

## 6. Checklist przed Run

- [ ] Każde `topic_id` = **`MJU-ZAL`**
- [ ] Każde `id` = `mju-zal-{NNN}`, unikalne, numeracja ciągła w batchu
- [ ] 5 opcji, `correct_option_id` istnieje w `options`
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Ostatni wiersz `VALUES` → `);`
- [ ] `UPDATE public.topics` dla `MJU-ZAL` na końcu
- [ ] Brak `INSERT INTO topics` (temat już istnieje)

---

## 7. Prompt-system (wklej do Claude / innego bota)

> Konwertujesz materiał na SQL do Supabase według `FormatPisaniaPytan-MikrobiologiaJU-Zaliczenie.md`.
>
> **Zasada nadrzędna:** wszystkie pytania idą do **`MJU-ZAL`** (Zaliczenie całościowe). Nie rozdzielaj na ćwiczenia ani kolokwia.
>
> 1. Wyjście = wyłącznie blok SQL (nagłówek batcha + INSERT + UPDATE).
> 2. `id`: `mju-zal-001` … kontynuuj od ostatniego w bazie lub od 001.
> 3. `topic_id`: zawsze `MJU-ZAL`.
> 4. 5 opcji `a`–`e` w stałej kolejności w JSONB.
> 5. `explanation`: 2–6 zdań po polsku.
> 6. `batch_label`: `e_mju_zal` (chyba że user poda inny).
> 7. `theme_label`, `subtheme_label`, `learning_outcome`: `NULL`.
> 8. Nie generuj `INSERT INTO topics`.
> 9. Na końcu: `UPDATE public.topics SET question_count` dla `MJU-ZAL`.

---

## 8. Kontekst w aplikacji

- Przedmiot: **Mikrobiologia jamy ustnej**, rok 2 stomatologia (`stoma-mikrobio-ju`).
- Kafelek **Zaliczenie całościowe** jest ostatni na liście tematów (`display_order` 9).
- Sesja użytkownika na ten temat = pula **wyłącznie** pytań z `topic_id = 'MJU-ZAL'`.
