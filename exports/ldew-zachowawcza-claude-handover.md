# Handover dla Claude — LDEW · Stomatologia zachowawcza

> **Status:** przedmiot + **23 tematy wgrane** na produkcję (`ZAC-01`…`ZAC-23`, 2026-08-10). Seed: `scripts/2026-08-10-ldew-zachowawcza-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-stomatologia-zachowawcza` | Stomatologia zachowawcza | `stomatologia` | `ldew` | `zac-` | `dental` |

Skrót topików: `ZAC-`.

---

## 2. Tematy — Zachowawcza (`ldew-stomatologia-zachowawcza`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `ZAC-01` | 1 | Postępowanie lekarsko-stomatologiczne |
| `ZAC-02` | 2 | Zasady ergonomii pracy w stomatologii zachowawczej |
| `ZAC-03` | 3 | Komputer i internet – nowe elementy ergonomii stomatologicznej |
| `ZAC-04` | 4 | Materiały stosowane w leczeniu zachowawczym zębów |
| `ZAC-05` | 5 | Nieprawidłowości rozwojowe zębów |
| `ZAC-06` | 6 | Choroby twardych tkanek zębów |
| `ZAC-07` | 7 | Nadwrażliwość zębiny |
| `ZAC-08` | 8 | Epidemiologia próchnicy zębów |
| `ZAC-09` | 9 | Zapobieganie próchnicy zębów |
| `ZAC-10` | 10 | Etiologia próchnicy |
| `ZAC-11` | 11 | Patologia próchnicy |
| `ZAC-12` | 12 | Przebieg kliniczny i podział próchnicy zębów |
| `ZAC-13` | 13 | Diagnostyka próchnicy |
| `ZAC-14` | 14 | Leczenie próchnicy |
| `ZAC-15` | 15 | Choroby miazgi zęba |
| `ZAC-16` | 16 | Choroby tkanek okołowierzchołkowych zęba |
| `ZAC-17` | 17 | Leczenie endodontyczne |
| `ZAC-18` | 18 | Izolacja pola operacyjnego |
| `ZAC-19` | 19 | Trudności i powikłania w leczeniu endodontycznym |
| `ZAC-20` | 20 | Resorpcja zębów |
| `ZAC-21` | 21 | Gerostomatologia |
| `ZAC-22` | 22 | Zakażenie ogniskowe |
| `ZAC-23` | 23 | Wybielanie przebarwionych zębów |

---

## 3. Konwencja ID pytań

```
zac-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `zac-01-001` | `ZAC-01` |
| `zac-14-012` | `ZAC-14` |
| `zac-17-008` | `ZAC-17` |
| `zac-23-004` | `ZAC-23` |

- Numer tematu: **2 cyfry** (`01`…`23`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_zac_2026/1`, `e_zac_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `ZAC-08` z `ZAC-09` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu do istniejącego tematu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`zac-14-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja (nie „ciekawostki”, tylko egzaminowalne fakty).

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie / proceduralne | ZAC-01, ZAC-02, ZAC-03, ZAC-07, ZAC-18, ZAC-22, ZAC-23 | **8–12** |
| Standard | ZAC-05, ZAC-06, ZAC-08, ZAC-09, ZAC-20, ZAC-21 | **10–15** |
| Core (próchnica + endo) | ZAC-04, ZAC-10–ZAC-17, ZAC-19 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie ZAC-01 → ZAC-23**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Gabinet | ZAC-01…03 | postępowanie, ergonomia, IT |
| B · Materiał / tkanki | ZAC-04…07 | materiały, wady rozwojowe, twarde tkanki, nadwrażliwość |
| C · Próchnica | ZAC-08…14 | epi → profilaktyka → etio → patologia → klinika → diagnostyka → leczenie |
| D · Endo w zachowawczej | ZAC-15…19 | miazga, okołowierzchołkowe, leczenie, koferdam, powikłania |
| E · Specjalne | ZAC-20…23 | resorpcja, gerostoma, ogniska, wybielanie |

> Uwaga: jest osobny przedmiot `ldew-endodoncja`. W ZAC-15…19 trzymaj zakres **zachowawczo-endodontyczny** (klasyka z podręcznika zachowawczego), bez dublowania pełnego programu endodoncji.

### Metadane batcha (wklej nad poleceniem / nad TXT)

```text
METADANE BATCHA
subject_id: ldew-stomatologia-zachowawcza
topic_id: ZAC-14
topic_name: Leczenie próchnicy
question_id_prefix: zac-14
start_question_number: 1
batch_label: e_zac_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `ZAC-01` … `ZAC-23` |
| `question_id_prefix` | `zac-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (ZAC-01)

```sql
-- ============================================================
-- BATCH: e_zac_2026/1 · ldew-stomatologia-zachowawcza · ZAC-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('zac-01-001', 'ZAC-01',
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
 'e_zac_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'ZAC-01'
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
     WHERE topic_id LIKE 'ZAC-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-stomatologia-zachowawcza'
   AND id LIKE 'ZAC-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'ZAC-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-stomatologia-zachowawcza (prefiks: zac-, tematy ZAC-01…ZAC-23)
Mapa + batchowanie: exports/ldew-zachowawcza-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: zac-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-stomatologia-zachowawcza
topic_id: ZAC-01
topic_name: Postępowanie lekarsko-stomatologiczne
question_id_prefix: zac-01
start_question_number: 1
batch_label: e_zac_2026/1
N: 12

Zacznij od tematu ZAC-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Uruchomiono `scripts/2026-08-10-ldew-zachowawcza-topics.sql` na produkcji
- [ ] `id` pytań: `zac-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `ZAC-01` … `ZAC-23`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
