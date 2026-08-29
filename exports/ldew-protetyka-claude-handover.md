# Handover dla Claude — LDEW · Protetyka stomatologiczna

> **Status:** przedmiot + **28 tematów wgranych** na produkcję (`PRO-01`…`PRO-28`, 2026-08-22).  
> Seed: `scripts/2026-08-22-ldew-protetyka-topics.sql`.  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md` + `FormatPisaniaPytan.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań | Ikona (`icon_name`) |
|---|---|---|---|---|---|
| `ldew-protetyka` | Protetyka stomatologiczna | `stomatologia` | `ldew` | `pro-` | `crown` |

Skrót topików: `PRO-`.

---

## 2. Tematy — Protetyka (`ldew-protetyka`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `PRO-01` | 1 | Protetyka stomatologiczna jako dziedzina współczesnej nauki i praktyki medycznej |
| `PRO-02` | 2 | Układ stomatognatyczny (US) - wzajemne relacje morfologii i czynności |
| `PRO-03` | 3 | Anatomia i topografia elementów składowych układu stomatognatycznego o szczególnym znaczeniu dla praktyki protetycznej |
| `PRO-04` | 4 | Elementy fizjologii jamy ustnej w aspekcie protetyki |
| `PRO-05` | 5 | Stany artykulacyjne żuchwy w warunkach normy morfologiczno-funkcjonalnej |
| `PRO-06` | 6 | Zmiany w układzie stomatognatycznym związane z wiekiem i utratą zębów |
| `PRO-07` | 7 | Estetyka twarzy jako jeden z celów leczenia protetycznego |
| `PRO-08` | 8 | Psychologiczne aspekty leczenia protetycznego |
| `PRO-09` | 9 | Diagnostyka i wskazania do leczenia protetycznego |
| `PRO-10` | 10 | Planowanie leczenia i zabiegi przygotowawcze oraz przykłady leczenia etapowego w przypadkach trudnych |
| `PRO-11` | 11 | Procedury zabiegowe - wyciski, płaszczyzna protetyczna, zwarcie centralne oraz przenoszenie danych klinicznych na modele |
| `PRO-12` | 12 | Charakterystyka ogólna podstawowych konstrukcji protetycznych |
| `PRO-13` | 13 | Procedury zabiegowe w protetyce protez stałych |
| `PRO-14` | 14 | Leczenie protetyczne z zastosowaniem ruchomych protez częściowych |
| `PRO-15` | 15 | Rehabilitacja protetyczna pacjentów bezzębnych z zastosowaniem protez całkowitych |
| `PRO-16` | 16 | Specyfika leczenia protetycznego pacjentów w wieku rozwojowym |
| `PRO-17` | 17 | Implantoprotetyczna metoda rekonstrukcji uzębienia |
| `PRO-18` | 18 | Mikrobiologiczne aspekty leczenia protetycznego i profilaktyka przeciwzakaźna |
| `PRO-19` | 19 | Stomatopatie protetyczne - diagnostyka i leczenie |
| `PRO-20` | 20 | Patologiczne starcie zębów |
| `PRO-21` | 21 | Okluzja urazowa - zaburzenia okluzyjne |
| `PRO-22` | 22 | Dysfunkcje układu stomatognatycznego |
| `PRO-23` | 23 | Zasady profilaktyki periodontologicznej w postępowaniu protetycznym |
| `PRO-24` | 24 | Zasady współpracy zespołu kliniczno-laboratoryjnego |
| `PRO-25` | 25 | Pracownia techniki dentystycznej i nowe technologie laboratoryjnego wykonawstwa uzupełnień protetycznych |
| `PRO-26` | 26 | Kliniczne i laboratoryjne materiały protetyczne |
| `PRO-27` | 27 | Tkankowa reaktywność na protezy i materiały protetyczne |
| `PRO-28` | 28 | Kliniczne aspekty technicznego wykonawstwa uzupełnień protetycznych |

---

## 3. Konwencja ID pytań

```
pro-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `pro-01-001` | `PRO-01` |
| `pro-13-012` | `PRO-13` |
| `pro-17-008` | `PRO-17` |
| `pro-28-004` | `PRO-28` |

- Numer tematu: **2 cyfry** (`01`…`28`).
- Numer pytania: **3 cyfry** (`001`, `014`).
- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `is_active`: `true` (domyślnie)
- `theme_label` / `subtheme_label`: opcjonalne (wolny tekst lub `NULL`)
- `batch_label`: np. `e_pro_2026/1`, `e_pro_kol1` albo `NULL`

---

## 4. Jak batchować (dla Claude)

### Zasady twarde

1. **Jeden temat = jeden plik SQL / jeden batch** (nie mieszaj `PRO-13` z `PRO-14` w jednym `INSERT`).
2. W jednym batchu **jedna** wartość `batch_label` na wszystkie wiersze.
3. Numeracja pytań w temacie: ciągła od `001`. Przy dopisywaniu — **najpierw sprawdź max ID w bazie**, potem kontynuuj (`pro-13-013`…).
4. Output: **gotowy SQL** (`INSERT` + `UPDATE question_count`), bez markdownu wokół bloku SQL.
5. Apostrofy w SQL podwojone (`''`).
6. Bez `DELETE` / `DROP` / `TRUNCATE` w batchach pytań.
7. Treść kliniczna po polsku, poziom LDEW / nostryfikacja.

### Rekomendowany rozmiar batcha

| Typ tematu | Tematy | Pierwszy pass (N) |
|---|---|---:|
| Wąskie | PRO-01, PRO-07, PRO-08, PRO-16, PRO-24 | **8–12** |
| Standard | PRO-02…06, PRO-09, PRO-10, PRO-12, PRO-18, PRO-20, PRO-23, PRO-25…28 | **10–15** |
| Core | PRO-11, PRO-13…15, PRO-17, PRO-19, PRO-21, PRO-22 | **12–20** |

Domyślnie, jeśli użytkownik nie poda N: **12 pytań na temat**.

### Kolejność generowania

Idź **sekwencyjnie PRO-01 → PRO-28**, chyba że użytkownik wskaże inny temat.

Logiczne bloki (do planowania, nie do mieszania w jednym SQL):

| Blok | Tematy | Fokus |
|---|---|---|
| A · Fundamenty US | PRO-01…06 | dziedzina, US, anatomia/topografia, fizjologia, artykulacja, zmiany z wiekiem/utratą zębów |
| B · Cele / diagnostyka | PRO-07…11 | estetyka, psychologia, wskazania, planowanie, wyciski/zwarcie/modele |
| C · Konstrukcje / leczenie | PRO-12…17 | konstrukcje, protezy stałe, częściowe, całkowite, wiek rozwojowy, implantoprotetyka |
| D · Powikłania / okluzja | PRO-18…23 | mikrobiologia, stomatopatie, starcie, okluzja urazowa, dysfunkcje US, perio w protetyce |
| E · Lab / materiały | PRO-24…28 | współpraca kliniczno-lab, pracownia/technologie, materiały, reaktywność tkanek, aspekty kliniczne lab |

### Metadane batcha (wklej nad poleceniem)

```text
METADANE BATCHA
subject_id: ldew-protetyka
topic_id: PRO-13
topic_name: Procedury zabiegowe w protetyce protez stałych
question_id_prefix: pro-13
start_question_number: 1
batch_label: e_pro_2026/1
N: 12
```

| Pole | Znaczenie |
|---|---|
| `topic_id` | Dokładnie `PRO-01` … `PRO-28` |
| `question_id_prefix` | `pro-{NN}` (małe litery) |
| `start_question_number` | Następny wolny numer (z bazy lub `1` przy pustym temacie) |
| `batch_label` | Jedna etykieta na cały batch |
| `N` | Liczba pytań do wygenerowania |

---

## 5. Szablon SQL — batch pytań (PRO-01)

```sql
-- ============================================================
-- BATCH: e_pro_2026/1 · ldew-protetyka · PRO-01
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation, batch_label)
VALUES

('pro-01-001', 'PRO-01',
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
 'e_pro_2026/1');

-- Ostatni rekord w VALUES kończy się `);` — nie przecinkiem.

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE topic_id = 'PRO-01'
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
     WHERE topic_id LIKE 'PRO-%'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Rollback (tylko tematy, bez pytań)

```sql
DELETE FROM public.topics
 WHERE subject_id = 'ldew-protetyka'
   AND id LIKE 'PRO-%';
```

> Jeśli w tematach są już pytania — najpierw usuń `questions` z `topic_id LIKE 'PRO-%'`.

---

## 7. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-protetyka (prefiks: pro-, tematy PRO-01…PRO-28)
Mapa + batchowanie: exports/ldew-protetyka-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md + FormatPisaniaPytan.md

Zasady batcha:
- jeden temat = jeden SQL INSERT
- single_choice, 5 opcji a–e
- ID: pro-{NN}-{NNN}
- na końcu UPDATE topics.question_count dla tego topic_id
- apostrofy w SQL podwojone ('')

METADANE BATCHA
subject_id: ldew-protetyka
topic_id: PRO-01
topic_name: Protetyka stomatologiczna jako dziedzina współczesnej nauki i praktyki medycznej
question_id_prefix: pro-01
start_question_number: 1
batch_label: e_pro_2026/1
N: 12

Zacznij od tematu PRO-01 — wygeneruj 12 pytań.
```

---

## 8. Checklist przed importem

- [ ] Tematy `PRO-01`…`PRO-28` są na produkcji (ten handover / seed 2026-08-22)
- [ ] `id` pytań: `pro-{NN}-{NNN}` (małe litery)
- [ ] `topic_id` dokładnie `PRO-01` … `PRO-28`
- [ ] `correct_option_id` ∈ {`a`,`b`,`c`,`d`,`e`}
- [ ] Apostrofy w SQL podwojone (`''`)
- [ ] Jeden `batch_label` na cały plik
- [ ] Po batchu: UPDATE `topics.question_count`
