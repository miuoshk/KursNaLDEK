# Handover dla Claude — LDEW · Periodontologia

> **Status:** przedmiot + **16 tematów wgranych** na produkcję (`PER-01`…`PER-16`, 2026-08-20).  
> Seed: `scripts/2026-08-20-ldew-periodontologia-topics.sql` (zastąpił starą mapę 22-tematową).  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-periodontologia` | Periodontologia | `stomatologia` | `ldew` | `per-` | `dental-broken` |

Skrót topików: `PER-`.

---

## 2. Tematy — Periodontologia (`ldew-periodontologia`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `PER-01` | 1 | Podstawy anatomii i fizjologii przyzębia |
| `PER-02` | 2 | Etiopatogeneza chorób przyzębia i okołowszczepowych |
| `PER-03` | 3 | Epidemiologia periodontologiczna |
| `PER-04` | 4 | Diagnostyka chorób przyzębia i tkanek wokół implantów |
| `PER-05` | 5 | Kliniczne badanie periodontologiczne |
| `PER-06` | 6 | Diagnostyka obrazowa w periodontologii |
| `PER-07` | 7 | Profilaktyka chorób przyzębia |
| `PER-08` | 8 | Niechirurgiczne leczenie chorób przyzębia |
| `PER-09` | 9 | Chirurgiczne leczenie chorób przyzębia |
| `PER-10` | 10 | Terapia śluzówkowo-dziąsłowa |
| `PER-11` | 11 | Podstawy współczesnej implantologii stomatologicznej |
| `PER-12` | 12 | Lasery w leczeniu chorób przyzębia i zapalenia tkanek okołowszczepowych |
| `PER-13` | 13 | Leczenie podtrzymujące |
| `PER-14` | 14 | Rehabilitacja protetyczna pacjentów obciążonych chorobami przyzębia |
| `PER-15` | 15 | Leczenie ortodontyczne u pacjentów z zapaleniem przyzębia |
| `PER-16` | 16 | Związek zapalenia przyzębia z chorobami ogólnymi |

> Stara mapa `PER-01`…`PER-22` (Górska) została usunięta — **nie** generuj pytań pod stare nazwy tematów.

---

## 3. Konwencja ID pytań

```
per-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `per-01-001` | `PER-01` |
| `per-08-012` | `PER-08` |
| `per-11-008` | `PER-11` |
| `per-16-004` | `PER-16` |

- Numer tematu: **2 cyfry** (`01`…`16`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_per_2026/1`, `e_per_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `PER-08` z `PER-09` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`per-08-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja.

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie / proceduralne | PER-03, PER-06, PER-07, PER-12, PER-13 | **8–12** |
| Standard | PER-01, PER-05, PER-10, PER-14, PER-15 | **10–15** |
| Core | PER-02, PER-04, PER-08, PER-09, PER-11, PER-16 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie PER-01 → PER-16**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Fundamenty | PER-01…03 | anatomia/fizjologia, etiopatogeneza (też periimplantitis), epidemiologia |
| B · Diagnostyka | PER-04…06 | diagnostyka chorób + implanty, badanie kliniczne, obrazowanie |
| C · Leczenie | PER-07…10 | profilaktyka, niechirurgiczne, chirurgiczne, śluzówkowo-dziąsłowe |
| D · Implanty / lasery / SPT | PER-11…13 | implantologia, lasery (periodontitis + periimplantitis), leczenie podtrzymujące |
| E · Interdyscyplinarne | PER-14…16 | protetyka, ortodoncja, choroby ogólne |

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-periodontologia
topic_id: PER-08
topic_name: Niechirurgiczne leczenie chorób przyzębia
question_id_prefix: per-08
start_question_number: 1
batch_label: e_per_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `PER-01` … `PER-16` |
| `question_id_prefix` | `per-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (PER-01)

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

### Po imporcie wielu tematów naraz

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

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-periodontologia'
   AND id LIKE 'PER-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'PER-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-periodontologia (prefiks: per-, tematy PER-01…PER-16)
Mapa + batchowanie: exports/ldew-periodontologia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: per-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-periodontologia
topic_id: PER-01
topic_name: Podstawy anatomii i fizjologii przyzębia
question_id_prefix: per-01
start_question_number: 1
batch_label: e_per_2026/1
N: 12

Zacznij od tematu PER-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `PER-01`…`PER-16` są na produkcji (ten handover / seed 2026-08-20)
- [ ] `id` pytań: `per-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `PER-01` … `PER-16` (nie `PER-17`+)
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
