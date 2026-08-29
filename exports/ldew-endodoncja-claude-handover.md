# Handover dla Claude — LDEW · Endodoncja

> **Status:** przedmiot + **24 tematy wgrane** na produkcję (`END-01`…`END-24`, 2026-08-20).  
> Seed: `scripts/2026-08-20-ldew-endodoncja-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-endodoncja` | Endodoncja | `stomatologia` | `ldew` | `end-` | `needle` |

Skrót topików: `END-`.

> Uwaga: w zachowawczej są też tematy endo (`ZAC-15`…`ZAC-19`). Tu trzymaj **pełny program endodoncji**; nie kopiuj 1:1 pytań ze `ZAC-*`.

---

## 2. Tematy — Endodoncja (`ldew-endodoncja`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `END-01` | 1 | Morfologia oraz funkcja endodontium i okołowierzchołkowych tkanek zęba |
| `END-02` | 2 | Etiologia oraz profilaktyka chorób endodontium i okołowierzchołkowych tkanek zęba |
| `END-03` | 3 | Etiogeneza i patomechanizm chorób endodontium i okołowierzchołkowych tkanek zęba |
| `END-04` | 4 | Symptomatologia chorób endodontium i okołowierzchołkowych tkanek zęba |
| `END-05` | 5 | Diagnostyka kliniczna chorób endodontium i okołowierzchołkowych tkanek zęba |
| `END-06` | 6 | Morfologia jam zębowych a leczenie endodontyczne |
| `END-07` | 7 | Rentgenodiagnostyka w endodoncji |
| `END-08` | 8 | Zwalczanie bólu w endodoncji |
| `END-09` | 9 | Urządzenia do powiększania pola zabiegowego w leczeniu endodontycznym |
| `END-10` | 10 | Instrumentarium endodontyczne |
| `END-11` | 11 | Koferdam w leczeniu endodontycznym |
| `END-12` | 12 | Metody określania długości roboczej zęba |
| `END-13` | 13 | Opracowanie kanałów korzeniowych |
| `END-14` | 14 | Wypełnianie kanałów korzeniowych |
| `END-15` | 15 | Pierwsza pomoc w endodoncji - leczenie stanów nagłych |
| `END-16` | 16 | Leczenie endodontyczne |
| `END-17` | 17 | Powikłania w leczeniu endodontycznym |
| `END-18` | 18 | Ponowne leczenie endodontyczne |
| `END-19` | 19 | Przebarwienie i wybielanie zębów leczonych endodontycznie |
| `END-20` | 20 | Postępowanie endodontyczne w urazowych uszkodzeniach zębów stałych |
| `END-21` | 21 | Odbudowa i wzmocnienie struktury zębów leczonych endodontycznie |
| `END-22` | 22 | Zespół zmian endo-perio |
| `END-23` | 23 | Patologiczna resorpcja zębów |
| `END-24` | 24 | Chirurgia endodontyczna |

---

## 3. Konwencja ID pytań

```
end-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `end-01-001` | `END-01` |
| `end-13-012` | `END-13` |
| `end-17-008` | `END-17` |
| `end-24-004` | `END-24` |

- Numer tematu: **2 cyfry** (`01`…`24`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_end_2026/1`, `e_end_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `END-13` z `END-14` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`end-13-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja.

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie / proceduralne | END-09, END-11, END-12, END-15, END-19 | **8–12** |
| Standard | END-01, END-02, END-06, END-07, END-08, END-10, END-20, END-21, END-22 | **10–15** |
| Core | END-03…05, END-13, END-14, END-16…18, END-23, END-24 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie END-01 → END-24**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Biologia / choroba | END-01…05 | morfologia, etio/profilaktyka, patomechanizm, symptomy, diagnostyka kliniczna |
| B · Anatomia / RTG / ból / optyka | END-06…09 | jamy zębowe, rentgenodiagnostyka, ból, powiększenie pola |
| C · Technika kanałowa | END-10…14 | instrumentarium, koferdam, długość robocza, opracowanie, wypełnianie |
| D · Leczenie / powikłania | END-15…18 | stany nagłe, leczenie, powikłania, reendo |
| E · Specjalne / chirurgia | END-19…24 | wybielanie, urazy, odbudowa, endo-perio, resorpcja, chirurgia endo |

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-endodoncja
topic_id: END-13
topic_name: Opracowanie kanałów korzeniowych
question_id_prefix: end-13
start_question_number: 1
batch_label: e_end_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `END-01` … `END-24` |
| `question_id_prefix` | `end-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (END-01)

```sql
-- ============================================================
-- BATCH: e_end_2026/1 · ldew-endodoncja · END-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('end-01-001', 'END-01',
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
 'e_end_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'END-01'
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
     WHERE topic_id LIKE 'END-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-endodoncja'
   AND id LIKE 'END-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'END-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-endodoncja (prefiks: end-, tematy END-01…END-24)
Mapa + batchowanie: exports/ldew-endodoncja-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: end-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-endodoncja
topic_id: END-01
topic_name: Morfologia oraz funkcja endodontium i okołowierzchołkowych tkanek zęba
question_id_prefix: end-01
start_question_number: 1
batch_label: e_end_2026/1
N: 12

Zacznij od tematu END-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `END-01`…`END-24` są na produkcji (ten handover / seed 2026-08-20)
- [ ] `id` pytań: `end-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `END-01` … `END-24`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
