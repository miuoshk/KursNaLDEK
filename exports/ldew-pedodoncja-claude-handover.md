# Handover dla Claude — LDEW · Stomatologia dziecięca

> **Status:** przedmiot + **19 tematów wgranych** na produkcję (`PED-01`…`PED-19`, 2026-08-21).  
> Seed: `scripts/2026-08-21-ldew-pedodoncja-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-stomatologia-dziecieca` | Stomatologia dziecięca | `stomatologia` | `ldew` | `ped-` | `baby-carriage` |

Skrót topików: `PED-`.

---

## 2. Tematy — Pedodoncja (`ldew-stomatologia-dziecieca`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `PED-01` | 1 | Rozwój zęba, przyzębia i błony śluzowej |
| `PED-02` | 2 | Mechanizm wyrzynania zębów |
| `PED-03` | 3 | Morfologia i fizjologia zębów |
| `PED-04` | 4 | Mikrobiom jamy ustnej |
| `PED-05` | 5 | Parafunkcje i dysfunkcje narządu żucia |
| `PED-06` | 6 | Wybrane patologie rozwoju twarzoczaszki |
| `PED-07` | 7 | Dziecko jako pacjent w gabinecie stomatologicznym |
| `PED-08` | 8 | Choroby twardych tkanek zębów |
| `PED-09` | 9 | Postępowanie lecznicze w chorobie próchnicowej |
| `PED-10` | 10 | Profilaktyka próchnicy zębów |
| `PED-11` | 11 | Żywienie a zdrowie jamy ustnej |
| `PED-12` | 12 | Choroby miazgi zębów |
| `PED-13` | 13 | Pourazowe uszkodzenia zębów |
| `PED-14` | 14 | Częste choroby infekcyjne w wieku rozwojowym. Zmiany nieinfekcyjne |
| `PED-15` | 15 | Zmiany i stany zagrożone transformacją nowotworową |
| `PED-16` | 16 | Choroby przyzębia u dzieci i młodzieży |
| `PED-17` | 17 | Opieka stomatologiczna nad dziećmi niepełnosprawnymi i z przewlekłymi chorobami ogólnymi |
| `PED-18` | 18 | Zapalenia w obrębie twarzoczaszki |
| `PED-19` | 19 | Ekstrakcje zębów u dzieci i młodzieży |

### Mapowanie na rozdziały źródła (PDF)

| `topic_id` | Rozdziały źródła |
|---|---|
| `PED-01` | 3 |
| `PED-02` | 4 |
| `PED-03` | 5 |
| `PED-04` | 7 |
| `PED-05` | 10 |
| `PED-06` | 12–15 |
| `PED-07` | 17–23 |
| `PED-08` | 24–28 |
| `PED-09` | 29–33 |
| `PED-10` | 34–38 |
| `PED-11` | 39–41 |
| `PED-12` | 42–46 |
| `PED-13` | 47–54 |
| `PED-14` | 55–56 |
| `PED-15` | 59 |
| `PED-16` | 60–61 |
| `PED-17` | 62–64 |
| `PED-18` | 67 |
| `PED-19` | 71 |

---

## 3. Konwencja ID pytań

```
ped-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `ped-01-001` | `PED-01` |
| `ped-09-012` | `PED-09` |
| `ped-13-008` | `PED-13` |
| `ped-19-004` | `PED-19` |

- Numer tematu: **2 cyfry** (`01`…`19`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_ped_2026/1`, `e_ped_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `PED-09` z `PED-10` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`ped-09-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja; **perspektywa wieku rozwojowego** (mleczne / mieszane / młode stałe).

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie | PED-02, PED-04, PED-11, PED-15, PED-18, PED-19 | **8–12** |
| Standard | PED-01, PED-03, PED-05, PED-06, PED-14, PED-16, PED-17 | **10–15** |
| Core | PED-07…10, PED-12, PED-13 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie PED-01 → PED-19**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Rozwój / morfologia | PED-01…04 | rozwój tkanek, wyrzynanie, morfologia/fizjologia, mikrobiom |
| B · Funkcja / rozwój twarzy / pacjent | PED-05…07 | para-/dysfunkcje, patologie twarzoczaszki, dziecko w gabinecie |
| C · Próchnica | PED-08…11 | twarde tkanki, leczenie próchnicy, profilaktyka, żywienie |
| D · Miazga / urazy / śluzówka | PED-12…15 | miazga, urazy, infekcje/nieinfekcyjne, stany przednowotworowe |
| E · Przyzębie / specjalna opieka / chirurgia | PED-16…19 | przyzębie u dzieci, niepełnosprawność/choroby ogólne, zapalenia, ekstrakcje |

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-stomatologia-dziecieca
topic_id: PED-09
topic_name: Postępowanie lecznicze w chorobie próchnicowej
question_id_prefix: ped-09
start_question_number: 1
batch_label: e_ped_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `PED-01` … `PED-19` |
| `question_id_prefix` | `ped-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (PED-01)

```sql
-- ============================================================
-- BATCH: e_ped_2026/1 · ldew-stomatologia-dziecieca · PED-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('ped-01-001', 'PED-01',
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
 'e_ped_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'PED-01'
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
     WHERE topic_id LIKE 'PED-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-stomatologia-dziecieca'
   AND id LIKE 'PED-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'PED-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-stomatologia-dziecieca (prefiks: ped-, tematy PED-01…PED-19)
Mapa + batchowanie: exports/ldew-pedodoncja-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: ped-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')
- perspektywa wieku rozwojowego (mleczne / mieszane / młode stałe)

METADANE BATCHA
subject_id: ldew-stomatologia-dziecieca
topic_id: PED-01
topic_name: Rozwój zęba, przyzębia i błony śluzowej
question_id_prefix: ped-01
start_question_number: 1
batch_label: e_ped_2026/1
N: 12

Zacznij od tematu PED-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `PED-01`…`PED-19` są na produkcji (ten handover / seed 2026-08-21)
- [ ] `id` pytań: `ped-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `PED-01` … `PED-19`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
