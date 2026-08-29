# Handover dla Claude — LDEW · Choroby błony śluzowej jamy ustnej

> **Status:** przedmiot + **14 tematów wgranych** na produkcję (`SLU-01`…`SLU-14`, 2026-08-20).  
> Seed: `scripts/2026-08-20-ldew-sluzowka-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-choroby-sluzowki` | Choroby błony śluzowej jamy ustnej | `stomatologia` | `ldew` | `slu-` | `microscope` |

Skrót topików: `SLU-`.

---

## 2. Tematy — Błona śluzowa (`ldew-choroby-sluzowki`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `SLU-01` | 1 | Podstawy anatomii i fizjologii jamy ustnej |
| `SLU-02` | 2 | Badanie pacjenta i symptomatologia chorób błony śluzowej jamy ustnej |
| `SLU-03` | 3 | Wady i choroby języka |
| `SLU-04` | 4 | Objawy chorób wirusowych w jamie ustnej |
| `SLU-05` | 5 | Kandydozy jamy ustnej |
| `SLU-06` | 6 | Swoiste choroby bakteryjne |
| `SLU-07` | 7 | Aftozy |
| `SLU-08` | 8 | Potencjalnie złośliwiejące zaburzenia błony śluzowej jamy ustnej |
| `SLU-09` | 9 | Choroby skórno-śluzówkowe |
| `SLU-10` | 10 | Alergie w jamie ustnej |
| `SLU-11` | 11 | Choroby układowe tkanki łącznej |
| `SLU-12` | 12 | Zaburzenia wydzielania śliny |
| `SLU-13` | 13 | BMS (zespół pieczenia jamy ustnej) |
| `SLU-14` | 14 | Zmiany na błonach śluzowych jamy ustnej w przebiegu chorób układu krwiotwórczego i chłonnego |

---

## 3. Konwencja ID pytań

```
slu-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `slu-01-001` | `SLU-01` |
| `slu-05-012` | `SLU-05` |
| `slu-08-008` | `SLU-08` |
| `slu-14-004` | `SLU-14` |

- Numer tematu: **2 cyfry** (`01`…`14`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_slu_2026/1`, `e_slu_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `SLU-04` z `SLU-05` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`slu-05-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja.

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie | SLU-01, SLU-06, SLU-07, SLU-10, SLU-12, SLU-13 | **8–12** |
| Standard | SLU-02, SLU-03, SLU-04, SLU-05, SLU-11 | **10–15** |
| Core (onkologia / skórno-śluzówkowe / hematologia) | SLU-08, SLU-09, SLU-14 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie SLU-01 → SLU-14**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Fundamenty | SLU-01…03 | anatomia/fizjologia, badanie + symptomatologia, język |
| B · Infekcje | SLU-04…06 | wirusy, kandydozy, swoiste bakteryjne |
| C · Zmiany miejscowe | SLU-07…08 | aftozy, potencjalnie złośliwiejące (OLP, leukoplakia, erytroplakia…) |
| D · Skóra / alergia / CTD | SLU-09…11 | skórno-śluzówkowe, alergie, choroby tkanki łącznej |
| E · Ślina / BMS / hematologia | SLU-12…14 | kserostomia/ślinianki, BMS, choroby krwiotwórcze i chłonne |

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-choroby-sluzowki
topic_id: SLU-05
topic_name: Kandydozy jamy ustnej
question_id_prefix: slu-05
start_question_number: 1
batch_label: e_slu_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `SLU-01` … `SLU-14` |
| `question_id_prefix` | `slu-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (SLU-01)

```sql
-- ============================================================
-- BATCH: e_slu_2026/1 · ldew-choroby-sluzowki · SLU-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('slu-01-001', 'SLU-01',
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
 'e_slu_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'SLU-01'
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
     WHERE topic_id LIKE 'SLU-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-choroby-sluzowki'
   AND id LIKE 'SLU-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'SLU-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-choroby-sluzowki (prefiks: slu-, tematy SLU-01…SLU-14)
Mapa + batchowanie: exports/ldew-sluzowka-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: slu-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-choroby-sluzowki
topic_id: SLU-01
topic_name: Podstawy anatomii i fizjologii jamy ustnej
question_id_prefix: slu-01
start_question_number: 1
batch_label: e_slu_2026/1
N: 12

Zacznij od tematu SLU-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `SLU-01`…`SLU-14` są na produkcji (ten handover / seed 2026-08-20)
- [ ] `id` pytań: `slu-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `SLU-01` … `SLU-14`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
