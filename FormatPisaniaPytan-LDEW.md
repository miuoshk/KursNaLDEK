# Format pytań — Kurs na LDEW (nostryfikacja)

> Uniwersalny format MCQ dla przedmiotów klinicznych LDEW.  
> Ogólne zasady JSONB, apostrofy, `explanation`: patrz **`FormatPisaniaPytan.md`**.  
> Mapa przedmiotów i tematów: handovery `exports/ldew-*-claude-handover.md` (w tym **`exports/ldew-chirurgia-claude-handover.md`**).

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
| `ldew-chirurgia-stomatologiczna` | Chirurgia stomatologiczna i szczękowo-twarzowa | `CHS-` | `chs-` |

Usunięte kafle (nie używaj): `ldew-chirurgia-szczekowo-twarzowa`, `ldew-radiologia`, `ldew-zdrowie-publiczne`, `ldew-orzecznictwo`.

| Przedmiot | Handover / seed tematów |
|---|---|
| Periodontologia | `exports/ldew-periodontologia-claude-handover.md` · `scripts/2026-08-20-ldew-periodontologia-topics.sql` |
| Ortodoncja | `exports/ldew-ortodoncja-claude-handover.md` |
| Zachowawcza | `exports/ldew-zachowawcza-claude-handover.md` · `scripts/2026-08-10-ldew-zachowawcza-topics.sql` |
| Błona śluzowa | `exports/ldew-sluzowka-claude-handover.md` · `scripts/2026-08-20-ldew-sluzowka-topics.sql` |
| Endodoncja | `exports/ldew-endodoncja-claude-handover.md` · `scripts/2026-08-20-ldew-endodoncja-topics.sql` |
| Pedodoncja | `exports/ldew-pedodoncja-claude-handover.md` · `scripts/2026-08-21-ldew-pedodoncja-topics.sql` |
| Protetyka | `exports/ldew-protetyka-claude-handover.md` · `scripts/2026-08-22-ldew-protetyka-topics.sql` |
| Chirurgia | `exports/ldew-chirurgia-claude-handover.md` · `scripts/2026-08-26-ldew-chirurgia-topics.sql` |

---

## 2. Konwencja ID pytań

```
{prefiks}-{nr_tematu}-{NNN}
```

| Przedmiot | Przykład `questions.id` | `topic_id` |
|---|---|---|
| Periodontologia | `per-01-001` | `PER-01` |
| Periodontologia | `per-08-014` | `PER-08` |
| Periodontologia | `per-16-004` | `PER-16` |
| Zachowawcza | `zac-01-001` | `ZAC-01` |
| Zachowawcza | `zac-14-012` | `ZAC-14` |
| Zachowawcza | `zac-23-004` | `ZAC-23` |
| Błona śluzowa | `slu-01-001` | `SLU-01` |
| Błona śluzowa | `slu-08-012` | `SLU-08` |
| Błona śluzowa | `slu-14-004` | `SLU-14` |
| Endodoncja | `end-01-001` | `END-01` |
| Endodoncja | `end-13-012` | `END-13` |
| Endodoncja | `end-24-004` | `END-24` |
| Pedodoncja | `ped-01-001` | `PED-01` |
| Pedodoncja | `ped-09-012` | `PED-09` |
| Pedodoncja | `ped-19-004` | `PED-19` |
| Protetyka | `pro-01-001` | `PRO-01` |
| Protetyka | `pro-13-012` | `PRO-13` |
| Protetyka | `pro-28-004` | `PRO-28` |
| Chirurgia | `chs-01-001` | `CHS-01` |
| Chirurgia | `chs-07-012` | `CHS-07` |
| Chirurgia | `chs-25-004` | `CHS-25` |
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

### Periodontologia

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-periodontologia (prefiks: per-, tematy PER-01…PER-16)
Mapa + batchowanie: exports/ldew-periodontologia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID per-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [PER-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Stomatologia zachowawcza

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-stomatologia-zachowawcza (prefiks: zac-, tematy ZAC-01…ZAC-23)
Mapa + batchowanie: exports/ldew-zachowawcza-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID zac-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [ZAC-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Choroby błony śluzowej

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-choroby-sluzowki (prefiks: slu-, tematy SLU-01…SLU-14)
Mapa + batchowanie: exports/ldew-sluzowka-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID slu-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [SLU-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Endodoncja

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-endodoncja (prefiks: end-, tematy END-01…END-24)
Mapa + batchowanie: exports/ldew-endodoncja-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID end-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [END-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Stomatologia dziecięca

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-stomatologia-dziecieca (prefiks: ped-, tematy PED-01…PED-19)
Mapa + batchowanie: exports/ldew-pedodoncja-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID ped-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [PED-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Protetyka

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-protetyka (prefiks: pro-, tematy PRO-01…PRO-28)
Mapa + batchowanie: exports/ldew-protetyka-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID pro-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [PRO-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```

### Chirurgia stomatologiczna i szczękowo-twarzowa

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-chirurgia-stomatologiczna
  (UI: Chirurgia stomatologiczna i szczękowo-twarzowa;
   prefiks: chs-, tematy CHS-01…CHS-25)
Mapa + batchowanie: exports/ldew-chirurgia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady: jeden temat = jeden SQL; single_choice; 5 opcji a–e; ID chs-{NN}-{NNN};
na końcu UPDATE question_count; apostrofy w SQL podwojone ('').

Zacznij od tematu [CHS-01 / …] — wygeneruj [N] pytań (domyślnie 12).
```
