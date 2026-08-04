# Handover dla Claude — LDEW · Ortodoncja

> **Status:** przedmiot w Supabase; tematy — `scripts/2026-08-04-ldew-ortodoncja-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-ortodoncja` | Ortodoncja | `stomatologia` | `ldew` | `ort-` | `braces` |

---

## 2. Tematy — Ortodoncja (`ldew-ortodoncja`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `ORT-01` | 1 | Rozwój i wzrost twarzy |
| `ORT-02` | 2 | Etiologia wad zgryzu |
| `ORT-03` | 3 | Badanie kliniczne pacjenta i badania pomocnicze |
| `ORT-04` | 4 | Klasyfikacja stosunków zębowo-zgryzowo-szkieletowych |
| `ORT-05` | 5 | Diagnostyka wad zgryzu |
| `ORT-06` | 6 | Aparaty profilaktyczne i lecznicze |
| `ORT-07` | 7 | Profilaktyka i oświata zdrowotna |
| `ORT-08` | 8 | Różne metody leczenia |

---

## 3. Konwencja ID pytań

```
{prefiks}-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `ort-01-001` | `ORT-01` |
| `ort-05-012` | `ORT-05` |
| `ort-08-008` | `ORT-08` |

- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `batch_label`: np. `e_ort_2026/1`, `e_ort_kol1` albo `NULL`

---

## 4. Szablon SQL — batch pytań (ORT-01)

```sql
-- ============================================================
-- BATCH: e_ort_2026/1 · ldew-ortodoncja · ORT-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('ort-01-001', 'ORT-01',
 'Treść pytania…',
 '[
   {"id":"a","text":"Opcja A"},
   {"id":"b","text":"Opcja B"},
   {"id":"c","text":"Opcja C"},
   {"id":"d","text":"Opcja D"},
   {"id":"e","text":"Opcja E"}
 ]'::jsonb,
 'b',
 'Wyjaśnienie poprawnej odpowiedzi (2–5 zdań).',
 'e_ort_2026/1');

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'ORT-01'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

### Po imporcie wielu tematów naraz

```sql
UPDATE public.topics t
   SET question_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id LIKE 'ORT-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 5. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-ortodoncja'
   AND id LIKE 'ORT-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'ORT-%'`.

---

## 6. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-ortodoncja (prefiks: ort-, tematy ORT-01…ORT-08)
Mapa: exports/ldew-ortodoncja-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Output: SQL INSERT + UPDATE question_count.

Zacznij od tematu [ORT-01 / …] — wygeneruj [N] pytań.
```

---

## 7. Checklist przed importem

- [ ] Uruchomiono `scripts/2026-08-04-ldew-ortodoncja-topics.sql` na produkcji
- [ ] `id` pytań: `ort-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `ORT-01` … `ORT-08`
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Po batchu: UPDATE `topics.question_count`
