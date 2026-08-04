# Format pytań — Kurs na LDEW (nostryfikacja)

> Uniwersalny format MCQ dla przedmiotów klinicznych LDEW.  
> Ogólne zasady JSONB, apostrofy, `explanation`: patrz **`FormatPisaniaPytan.md`**.  
> Mapa przedmiotów i tematów: **`exports/ldew-periodontologia-claude-handover.md`**, **`exports/ldew-ortodoncja-claude-handover.md`**.

---

## 1. Produkty i przedmioty

| `profiles.current_product` | Opis |
|---|---|
| `ldew` | Lekarsko-Dentystyczny Egzamin Weryfikacyjny (nostryfikacja) |

Wszystkie przedmioty LDEW: `product = 'ldew'`, `track = 'stomatologia'`, `year = 1`.

| `subjects.id` | Nazwa | Skrót topików | Prefiks pytań |
|---|---|---|---|
| `ldew-stomatologia-zachowawcza` | Stomatologia zachowawcza | `ZAC-` | `zac-` |
| `ldew-endodoncja` | Endodoncja | `END-` | `end-` |
| `ldew-periodontologia` | Periodontologia | `PER-` | `per-` |
| `ldew-choroby-sluzowki` | Choroby błony śluzowej jamy ustnej | `SLU-` | `slu-` |
| `ldew-stomatologia-dziecieca` | Stomatologia dziecięca | `PED-` | `ped-` |
| `ldew-ortodoncja` | Ortodoncja | `ORT-` | `ort-` |
| `ldew-protetyka` | Protetyka stomatologiczna | `PRO-` | `pro-` |
| `ldew-chirurgia-stomatologiczna` | Chirurgia stomatologiczna | `CHS-` | `chs-` |
| `ldew-chirurgia-szczekowo-twarzowa` | Chirurgia szczękowo-twarzowa | `CST-` | `cst-` |
| `ldew-radiologia` | Radiologia stomatologiczna | `RAD-` | `rad-` |
| `ldew-zdrowie-publiczne` | Zdrowie publiczne | `ZDP-` | `zdp-` |
| `ldew-orzecznictwo` | Orzecznictwo | `ORZ-` | `orz-` |

Tematy poza Periodontologią dodawaj przy pierwszym batchu (wzorzec `PER-01`).

---

## 2. Konwencja ID pytań

```
{prefiks}-{nr_tematu}-{NNN}
```

| Przedmiot | Przykład `questions.id` | `topic_id` |
|---|---|---|
| Periodontologia | `per-01-001` | `PER-01` |
| Periodontologia | `per-07-014` | `PER-07` |
| Endodoncja (przyszłość) | `end-03-002` | `END-03` |
| Ortodoncja | `ort-01-001` | `ORT-01` |
| Ortodoncja | `ort-12-004` | `ORT-12` |

- Numer tematu w ID: **2 cyfry** (`01`, `07`, `22`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice` (domyślnie).
- `options`: JSONB, 5 opcji `a`–`e`.
- `is_active`: `true`.
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub NULL).
- `batch_label`: np. `e_per_2026/1`, `e_per_kol1` albo `NULL`.

---

## 3. Szablon SQL — batch pytań

```sql
-- ============================================================
-- BATCH: e_per_2026/1 · ldew-periodontologia · PER-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('per-01-001', 'PER-01',
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
 'e_per_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'PER-01'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

### Po każdym batchu

```sql
UPDATE public.topics t
   SET question_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id LIKE 'PER-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 4. Checklista importu

- [ ] `id` unikalne, małe litery, format `{prefiks}-{NN}-{NNN}`
- [ ] `topic_id` dokładnie jak w handover (`PER-01`, …)
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w tekście podwojone (`''`)
- [ ] Po imporcie: UPDATE `topics.question_count`

---

## 5. Prompt startowy dla Claude (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-periodontologia (prefiks pytań: per-, tematy PER-01…PER-22)

Pełna mapa tematów: exports/ldew-periodontologia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md (single_choice, 5 opcji a–e)

Output: gotowy SQL INSERT do Supabase + UPDATE question_count na końcu batcha.

Zacznij od tematu [PER-01 / …] — wygeneruj [N] pytań.
```
