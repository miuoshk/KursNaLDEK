# Handover dla Claude — LDEW · Chirurgia stomatologiczna i szczękowo-twarzowa

> **Status:** przedmiot przemianowany + **25 tematów wgranych** (`CHS-01`…`CHS-25`, 2026-08-26).  
> Seed: `scripts/2026-08-26-ldew-chirurgia-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-chirurgia-stomatologiczna` | Chirurgia stomatologiczna i szczękowo-twarzowa | `stomatologia` | `ldew` | `chs-` | `scissors` |

Skrót topików: `CHS-`.  
`short_name` w UI: `Chirurgia`.

### Usunięte kafle LDEW (nie generuj pod nie pytań)

| Byłe `subjects.id` | Powód |
|---|---|
| `ldew-chirurgia-szczekowo-twarzowa` | Scalone z chirurgią stomatologiczną |
| `ldew-radiologia` | Brak osobnego programu |
| `ldew-zdrowie-publiczne` | Brak osobnego programu |
| `ldew-orzecznictwo` | Brak osobnego programu |

Prefiksy `CST-` / `RAD-` / `ZDP-` / `ORZ-` **nie są używane**.

---

## 2. Tematy — Chirurgia (`ldew-chirurgia-stomatologiczna`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `CHS-01` | 1 | Rys historyczny chirurgii stomatologicznej i szczękowo-twarzowej w Polsce |
| `CHS-02` | 2 | Profilaktyka zakażeń w gabinecie chirurgii stomatologicznej i szczękowo-twarzowej |
| `CHS-03` | 3 | Znieczulenie w chirurgii szczękowo-twarzowej |
| `CHS-04` | 4 | Podstawy chirurgii wyrostka zębodołowego cz. I |
| `CHS-05` | 5 | Podstawy chirurgii wyrostka zębodołowego cz. II |
| `CHS-06` | 6 | Podstawy chirurgii wyrostka zębodołowego cz. III |
| `CHS-07` | 7 | Implantologia stomatologiczna |
| `CHS-08` | 8 | Podstawy farmakoterapii w stomatologii |
| `CHS-09` | 9 | Stany zapalne tkanek miękkich i kości części twarzowej czaszki |
| `CHS-10` | 10 | Torbiele kości szczękowych |
| `CHS-11` | 11 | Schorzenia zatok przynosowych |
| `CHS-12` | 12 | Onkologia głowy i szyi |
| `CHS-13` | 13 | Traumatologia szczękowo-twarzowa cz. I |
| `CHS-14` | 14 | Traumatologia szczękowo-twarzowa cz. II |
| `CHS-15` | 15 | Traumatologia szczękowo-twarzowa cz. III |
| `CHS-16` | 16 | Wady rozwojowe i ortognatyka cz. I |
| `CHS-17` | 17 | Wady rozwojowe i ortognatyka cz. II - Chirurgia ortognatyczna |
| `CHS-18` | 18 | Wady rozwojowe i ortognatyka cz. III |
| `CHS-19` | 19 | Choroby i leczenie stawu skroniowo-żuchwowego cz. I |
| `CHS-20` | 20 | Choroby i leczenie stawu skroniowo-żuchwowego cz. II |
| `CHS-21` | 21 | Rehabilitacja narządu żucia |
| `CHS-22` | 22 | Rehabilitacja protetyczna pacjentów po leczeniu nowotworów części twarzowej czaszki |
| `CHS-23` | 23 | Zastosowanie laseroterapii w chirurgii stomatologicznej |
| `CHS-24` | 24 | Chirurgia plastyczna |
| `CHS-25` | 25 | Dokumentacja medyczna w praktyce lekarza dentysty |

---

## 3. Konwencja ID pytań

```
chs-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `chs-01-001` | `CHS-01` |
| `chs-07-012` | `CHS-07` |
| `chs-13-008` | `CHS-13` |
| `chs-25-004` | `CHS-25` |

- Numer tematu: **2 cyfry** (`01`…`25`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_chs_2026/1`, `e_chs_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `CHS-04` z `CHS-05` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`chs-07-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja; zakres **stom. + szczękowo-twarzowy**.

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie | CHS-01, CHS-08, CHS-23, CHS-25 | **8–12** |
| Standard | CHS-02, CHS-03, CHS-10, CHS-11, CHS-21, CHS-22, CHS-24 | **10–15** |
| Core (serie + implanty / stany zapalne / onko / trauma / ortognatyka / SSŻ) | CHS-04…07, CHS-09, CHS-12…20 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie CHS-01 → CHS-25**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Wstęp / aseptyka / znieczulenie | CHS-01…03 | historia, zakażenia, znieczulenie |
| B · Wyrostek / implanty / farmakoterapia | CHS-04…08 | chirurgia wyrostka I–III, implantologia, farmakoterapia |
| C · Zapalenia / torbiele / zatoki / onko | CHS-09…12 | stany zapalne, torbiele, zatoki, onkologia głowy i szyi |
| D · Trauma / ortognatyka / SSŻ | CHS-13…20 | traumatologia I–III, wady/ortognatyka I–III, SSŻ I–II |
| E · Rehabilitacja / laser / plastyka / docs | CHS-21…25 | rehabilitacja, protetyczna po onko, laser, plastyka, dokumentacja |

> Części I/II/III tego samego bloku (wyrostek, trauma, ortognatyka, SSŻ) trzymaj **rozłączne merytorycznie** — nie powielaj tych samych faktów między częściami.

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-chirurgia-stomatologiczna
topic_id: CHS-07
topic_name: Implantologia stomatologiczna
question_id_prefix: chs-07
start_question_number: 1
batch_label: e_chs_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `CHS-01` … `CHS-25` |
| `question_id_prefix` | `chs-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (CHS-01)

```sql
-- ============================================================
-- BATCH: e_chs_2026/1 · ldew-chirurgia-stomatologiczna · CHS-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('chs-01-001', 'CHS-01',
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
 'e_chs_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'CHS-01'
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
     WHERE topic_id LIKE 'CHS-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-chirurgia-stomatologiczna'
   AND id LIKE 'CHS-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'CHS-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-chirurgia-stomatologiczna
  (nazwa UI: Chirurgia stomatologiczna i szczękowo-twarzowa;
   prefiks: chs-, tematy CHS-01…CHS-25)
Mapa + batchowanie: exports/ldew-chirurgia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: chs-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-chirurgia-stomatologiczna
topic_id: CHS-01
topic_name: Rys historyczny chirurgii stomatologicznej i szczękowo-twarzowej w Polsce
question_id_prefix: chs-01
start_question_number: 1
batch_label: e_chs_2026/1
N: 12

Zacznij od tematu CHS-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `CHS-01`…`CHS-25` są na produkcji (ten handover / seed 2026-08-26)
- [ ] `id` pytań: `chs-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `CHS-01` … `CHS-25`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
