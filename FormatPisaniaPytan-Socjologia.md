# Format pytań — Socjologia medycyny (1 rok stomatologii)

> Companion do `FormatPisaniaPytan.md`. Zasady opcji A–E, kolejność `id`, opcje kombinatoryczne, escape-owanie apostrofów, struktura tabel — **identyczne**. Ten plik jest **wzorem SQL** dla LLM-a (Claude / inny bot) konwertującego surowy materiał egzaminacyjny do batcha pytań w Supabase.

---

## 1. CO JUŻ JEST W BAZIE

Tylko sam subject:

| Pole              | Wartość                |
|-------------------|------------------------|
| `subjects.id`     | `stoma-socjologia`     |
| `name`            | Socjologia medycyny    |
| `short_name`      | Socjologia             |
| `icon_name`       | `users`                |
| `year`            | `1`                    |
| `track`           | `stomatologia`         |
| `display_order`   | `7`                    |

**Topików w tej chwili nie ma żadnych.** Każdy topik powstaje razem z pierwszym batchem pytań do niego — na podstawie **realnego materiału źródłowego** (program nauczania uczelni / pytania egzaminacyjne / kolokwia), a nie zgadywania.

---

## 2. KONWENCJA NAZW

### `topics.id`

`SOC-XXX` — 3-4 wielkie litery, dobierane z nazwy topiku. Trzymaj się tej samej etykiety we wszystkich pytaniach jednego topiku. Przykład decyzyjny:

| Nazwa topiku z materiału                                  | `topic_id` |
|-----------------------------------------------------------|------------|
| „Komunikacja lekarz–pacjent"                              | `SOC-KOM`  |
| „Etyka i bioetyka lekarska"                               | `SOC-ETK`  |
| „Rola chorego wg Parsonsa"                                | `SOC-ROL`  |

Jeśli to **pierwszy** batch w nowym topiku → najpierw wstaw rekord w `topics` (krok 3 niżej), dopiero potem pytania.

### `questions.id`

`soc-{topic-suffix}-{NNN}` — małe litery, trzycyfrowa numeracja z zerami wiodącymi.

| Przykład         | Co to                                          |
|------------------|------------------------------------------------|
| `soc-kom-001`    | Socjologia · Komunikacja · pytanie 1           |
| `soc-etk-014`    | Socjologia · Etyka · pytanie 14                |

Pierwsze pytanie w topiku numerowane `…-001`. Sprawdź `MAX(id)` w bazie zanim wgrasz kolejny batch:

```sql
SELECT id FROM public.questions WHERE topic_id = 'SOC-KOM' ORDER BY id DESC LIMIT 1;
```

---

## 3. WZÓR SQL — pełny batch (kopiuj-wklej do Supabase SQL Editor)

```sql
-- ============================================================
-- BATCH: <batch_label>  ·  stoma-socjologia
-- Topic: <SOC-XXX> (<pełna nazwa topiku>)
-- Author: Claude                Date: YYYY-MM-DD
-- Źródło: <skąd pytania — egzamin / kolokwium / podręcznik>
-- ============================================================

-- 3.1 TOPIK — uruchom tylko przy PIERWSZYM batchu na ten topic_id.
-- Idempotentne: ON CONFLICT aktualizuje nazwę/kolejność.
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count)
VALUES
  ('SOC-KOM', 'stoma-socjologia',
   'Komunikacja lekarz–pacjent',
   4, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
  -- question_count celowo nie ruszamy — przeliczy go UPDATE niżej.

-- 3.2 PYTANIA. Każdy rekord oddzielony przecinkiem, OSTATNI kropką-średnikiem.
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   theme_label, subtheme_label, batch_label, learning_outcome)
VALUES

('soc-kom-001', 'SOC-KOM',
 'Świadoma zgoda pacjenta na zabieg stomatologiczny wymaga, aby pacjent:',
 '[
   {"id":"a","text":"Podpisał formularz przed konsultacją"},
   {"id":"b","text":"Otrzymał informację o naturze zabiegu, ryzyku, alternatywach i prognozie, oraz wyraził zgodę dobrowolnie i kompetentnie"},
   {"id":"c","text":"Wykazał się rozumieniem łacińskich nazw procedur"},
   {"id":"d","text":"Zgodził się ustnie w obecności asystentki"},
   {"id":"e","text":"Prawidłowe A i D"}
 ]'::jsonb,
 'b',
 'Świadoma zgoda (informed consent) opiera się na czterech warunkach: (1) dobrowolność (brak przymusu), (2) kompetencja decyzyjna pacjenta (rozumienie sytuacji), (3) ujawnienie istotnych informacji przez lekarza (rodzaj zabiegu, ryzyko, alternatywy, prognoza bez interwencji), (4) wyraźne wyrażenie zgody. Sam podpis na formularzu nie wystarcza, jeśli pacjent nie rozumiał lub działał pod przymusem.',
 NULL, NULL, NULL, NULL),

('soc-kom-002', 'SOC-KOM',
 'Akronim SPIKES w komunikacji medycznej oznacza model:',
 '[
   {"id":"a","text":"Wywiadu zawodowego u kandydatów do pracy"},
   {"id":"b","text":"Przekazywania pacjentowi złych wiadomości w sześciu krokach"},
   {"id":"c","text":"Diagnostyki różnicowej bólu w klatce piersiowej"},
   {"id":"d","text":"Triage''u w SOR"},
   {"id":"e","text":"Oceny ryzyka samobójczego"}
 ]'::jsonb,
 'b',
 'SPIKES (Setting, Perception, Invitation, Knowledge, Emotions, Strategy/Summary) to sześcioetapowy model przekazywania pacjentowi złych wiadomości, zaproponowany przez Buckmana i Baile''a. Etap S — przygotowanie warunków rozmowy, P — sprawdzenie co pacjent już wie, I — ustalenie ile chce wiedzieć, K — komunikat główny, E — reakcja na emocje, S — plan dalszego postępowania.',
 NULL, NULL, NULL, NULL);

-- 3.3 PRZELICZ LICZNIK NA TOPIKU — bez tego karta pokaże stary licznik.
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'SOC-KOM'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

> **KRYTYCZNE:** ostatni `INSERT` w `VALUES` kończy się `);`, pozostałe `),`. Apostrof w treści/wyjaśnieniu jako `''` (dwa apostrofy), nigdy `\'`.

---

## 4. POLA, KTÓRE LLM MA WYPEŁNIĆ

| Pole                 | Wymagane | Co tam wpisać                                                                                                                            |
|----------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                 | TAK      | `soc-{topic}-{NNN}`, unikalne, numeracja od pierwszego wolnego w topiku.                                                                 |
| `topic_id`           | TAK      | `SOC-XXX` — istniejące lub nowo-wstawione w kroku 3.1.                                                                                    |
| `text`               | TAK      | Treść pytania, jedno zdanie pytajne lub stwierdzenie do dokończenia. Bez markdownu.                                                       |
| `options`            | TAK      | JSONB array w kolejności `a → b → c → d → e`. Każda opcja samodzielna. Patrz § 6.1 głównego docu (opcje kombinatoryczne).                  |
| `correct_option_id`  | TAK      | `id` poprawnej opcji (`a`/`b`/`c`/`d`/`e`).                                                                                                |
| `explanation`        | TAK      | 2–5 zdań: dlaczego poprawna jest poprawna i dlaczego główne dystraktory są błędne.                                                        |
| `theme_label`        | NIE      | `NULL` na razie — etykiety motywów dla socjologii zostaną dopisane jak zbierzemy więcej batchy i wyłoni się sensowna lista.                |
| `subtheme_label`     | NIE      | `NULL` na razie z tego samego powodu. Później krótka fraza rzeczownikowa, węższa niż `topic_id`.                                          |
| `batch_label`        | NIE      | `NULL` lub `e_smed_<rok>/<termin>` (np. `e_smed_2025/1`, `e_smed_kol1`). Cały batch ma JEDNĄ wartość.                                       |
| `learning_outcome`   | NIE      | `NULL` lub kod efektu kształcenia z curriculum (zwykle `F.W*` / `F.U*` dla socjologii). Wpisuj tylko jeśli wynika to ze źródła.            |

Wszystkie inne kolumny (`is_active`, `question_type`, `difficulty`, ...) mają sensowne defaulty na poziomie tabeli — nie podawaj ich.

---

## 5. CHECKLISTA PRZED `RUN`

- [ ] `topic_id` istnieje (krok 3.1 wykonany lub topik już był w bazie).
- [ ] Każde `id` pytania jest unikalne (`SELECT id FROM questions WHERE id IN (...)` zwraca pustkę).
- [ ] Numeracja `NNN` ciągła i bez luk od poprzedniego batcha.
- [ ] `options` w kolejności `a → b → c → d → e`, każda samodzielna.
- [ ] `correct_option_id` matchuje jedno z `id` w `options`.
- [ ] Apostrofy w `text`/`explanation` **podwojone** (`it''s`, `Baile''a`).
- [ ] Polskie znaki zachowane (ą, ę, ć, ś, ź, ż, ó, ł, ń).
- [ ] Ostatni rekord w `VALUES` zakończony `);`, pozostałe `),`.
- [ ] UPDATE `topics.question_count` po batchu (krok 3.3) — bez tego karta pokaże zły licznik.

---

## 6. JEŚLI MASZ WĄTPLIWOŚCI

Wszystko, czego TUTAJ nie ma — apostrofy, kolejność opcji, opcje kombinatoryczne, ogólne zasady merytoryczne pytań — jest w **`FormatPisaniaPytan.md`** (sekcje 1–2, 4–6). Ten plik to wyłącznie socjologia-specific overlay.
