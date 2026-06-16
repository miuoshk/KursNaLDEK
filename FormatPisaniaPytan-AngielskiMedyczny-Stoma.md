# Format pytań — Język angielski medyczny (1 rok stomatologii)

> Companion do `FormatPisaniaPytan.md`. Zasady opcji A–E, kolejność `id`, opcje kombinatoryczne, escape apostrofów, struktura tabel — **identyczne**. Ten plik jest **promptem dla Claude** (lub innego LLM) konwertującego surowy materiał egzaminacyjny / słownictwo / testy z uczelni do batcha pytań w **Supabase**.

**Projekt:** Kurs na LDEK / KNNP  
**Subject w UI:** `stoma-angielski` · rok 1 · stomatologia  
**Stan bazy (2026-06):** subject istnieje, **0 topików, 0 pytań** — wszystko budujesz od zera z materiału źródłowego.

---

## 0. TWOJA ROLA (dla Claude)

Jesteś botem contentowym. Dostajesz surowy materiał (PDF kolokwium, lista słówek, test z uczelni, slajdy, plik `.txt`) i **zwracasz gotowy skrypt SQL** do wklejenia w Supabase SQL Editor.

**Nie zgaduj topików ani pytań.** Topiki wynikają z realnych rozdziałów / tematów w materiale źródłowym. Jeśli materiał jest jednym blokiem bez podziału — utwórz **jeden** sensowny topik (np. `ENG-OG`) i opisz w komentarzu SQL, że to batch ogólny.

**Output:** wyłącznie SQL (+ krótki komentarz na górze: ile pytań, jaki `batch_label`, skąd materiał). Bez markdownowych tabel w treści pytań.

---

## 1. CO JUŻ JEST W BAZIE

| Pole              | Wartość                         |
|-------------------|---------------------------------|
| `subjects.id`     | `stoma-angielski`               |
| `name`            | Język angielski medyczny        |
| `short_name`      | Angielski                       |
| `icon_name`       | `languages`                     |
| `year`            | `1`                             |
| `track`           | `stomatologia`                  |
| `product`         | `knnp`                          |
| `display_order`   | `2`                             |

**Nie mylić z:** `lek-angielski` (rok 2, kierunek lekarski) — ten plik dotyczy **wyłącznie stomatologii**.

**Topików i pytań nie ma.** Każdy topik powstaje razem z pierwszym batchem pytań.

---

## 2. JĘZYK PYTAŃ — ZASADY MERYTORYCZNE

Odbiorcą jest **polski student stomatologii** uczący się angielskiego medycznego. Zachowaj spójność w całym batchu.

### 2.1 Język pól

| Pole            | Język | Uwagi |
|-----------------|-------|-------|
| `text`          | **EN lub PL** | Dopasuj do stylu źródła. Typowe wzorce poniżej (§ 2.2). |
| `options`       | **EN** | Terminy medyczne / stomatologiczne po angielsku (ew. krótki kontekst PL w dystraktorze, jeśli tak jest w źródle). |
| `explanation`   | **PL** | 2–5 zdań po polsku. Angielski termin podaj w nawiasie lub cudzysłowie. Bez emoji. |
| `theme_label`   | PL lub EN | Na razie preferuj `NULL` (§ 4). |
| `subtheme_label`| EN lub PL | Na razie preferuj `NULL`. Później: węższa etykieta, np. `"Dental instruments"`, `"Patient history"`. |

### 2.2 Typowe wzorce pytań (single choice)

Wybierz wzorzec zgodny ze źródłem — **nie mieszaj losowo** w jednym batchu:

1. **PL → EN (najczęstszy na kolokwium)**  
   *„Jak po angielsku nazywa się: …?"* / *„Which English term corresponds to: …?"*

2. **EN → PL (definicja po angielsku)**  
   Stem po angielsku, opcje po polsku **albo** stem EN + opcje EN z jedną poprawną definicją/ terminem.

3. **Dopasowanie w obrębie EN**  
   *„Which term best describes …?"* — wszystko po angielsku, wyjaśnienie po polsku.

4. **Luka / uzupełnienie**  
   Zdanie kliniczne po angielsku z brakującym terminem w opcjach.

**Unikaj:** podwójnej negacji, pytań czysto gramatycznych (czasy, irregular verbs) bez kontekstu medycznego, pytań wymagających wiedzy klinicznej spoza zakresu angielskiego (to ma być **język**, nie egzamin z patologii).

### 2.3 Terminologia

- Preferuj **British English** (UK) o ile źródło uczelniane tego wymaga; w razie wątpliwości — termin najczęstszy w podręcznikach medycznych dla stomatologów (np. *mandible*, *maxilla*, *gingiva*, *pulp*, *caries*).
- Pierwsze wystąpienie rzadkiego terminu w `explanation`: krótko po polsku + EN w nawiasie.
- Skróty: pierwsze wystąpienie rozpisz (*TMJ — temporomandibular joint*), potem możesz używać skrótu.
- **Nie** tłumacz dosłownie polskich kolokwializmów — używaj standardowego EN medycznego.

### 2.4 Dystraktory

- 5 opcji (A–E), **wiarygodne** terminy z tej samej dziedziny (np. wszystkie nazwy narządów jamy ustnej, nie „apple / table").
- Podobna długość i styl zapisu.
- Opcje kombinatoryczne („A and C", „All of the above") — dozwolone; patrz `FormatPisaniaPytan.md` § 6.1.

---

## 3. KONWENCJA NAZW

### 3.1 `topics.id`

Prefiks **`ENG-`** + 3–4 wielkie litery z nazwy topiku ze źródła.

| Nazwa topiku z materiału              | `topic_id`  |
|---------------------------------------|-------------|
| Ogólne słownictwo medyczne            | `ENG-OG`    |
| Anatomia jamy ustnej (EN)             | `ENG-ORA`   |
| Wywiad z pacjentem / komunikacja      | `ENG-COM`   |
| Procedury stomatologiczne             | `ENG-PRO`   |
| Sprzęt i materiały dentystyczne       | `ENG-EQP`   |
| Farmakologia — nazwy leków (EN)       | `ENG-PHR`   |
| Radiologia / obrazowanie              | `ENG-RAD`   |

**Zasady:**
- Jedna etykieta `topic_id` = jeden logiczny rozdział ze źródła.
- `subject_id` **zawsze** `stoma-angielski`.
- `display_order` — kolejność w programie / w materiale (1, 2, 3…).
- **Nie ustawiaj** `tracks` na topiku — przedmiot jest tylko stomatologiczny.

### 3.2 `questions.id`

`eng-{topic-suffix}-{NNN}` — małe litery, trzycyfrowa numeracja.

| Przykład       | Znaczenie                                      |
|----------------|------------------------------------------------|
| `eng-ora-001`  | Angielski · Oral anatomy · pytanie 1           |
| `eng-com-014`  | Angielski · Communication · pytanie 14       |

Przed kolejnym batchem sprawdź ostatnie ID:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'ENG-ORA'
 ORDER BY id DESC LIMIT 1;
```

---

## 4. POLA OPCJONALNE

| Pole               | Na start | Uwagi |
|--------------------|----------|-------|
| `theme_label`      | `NULL`   | Po zebraniu batchy można wprowadzić listę, np. „Dental anatomy", „Communication", „Pharmacology". |
| `subtheme_label`   | `NULL`   | Węższa fraza, np. `"Molar teeth"`, `"Informed consent"`. |
| `batch_label`      | patrz § 5 | Jedna wartość na cały import. |
| `learning_outcome` | `NULL`   | Wpisuj tylko jeśli wynika ze slajdów/programu uczelni. |
| `source_exam`      | opcjonalnie | Np. „Kolokwium UJ 2024". |
| `source_code`      | opcjonalnie | Np. kod pytania z arkusza. |
| `question_type`    | pomijaj  | Domyślnie `single_choice`. |

Kolumny **`difficulty`** — **nie istnieje** w schemacie. Nie używaj.

---

## 5. `batch_label`

Format (małe litery):

| Przykład           | Znaczenie                              |
|--------------------|----------------------------------------|
| `e_eng_2025/1`     | Egzamin / kolokwium, rok 2025, termin 1 |
| `e_eng_2024/2`     | Termin 2                               |
| `e_eng_kol1`       | Kolokwium 1 bez roku                   |
| `e_eng_slownik1`   | Batch ze słownika / listy słówek        |
| `NULL`             | Pytania autorskie / bez etykiety       |

Cały batch importu = **jedna** wartość `batch_label`.

---

## 6. WZÓR SQL — pełny batch (Supabase SQL Editor)

```sql
-- ============================================================
-- BATCH: e_eng_2025/1  ·  stoma-angielski
-- Topic: ENG-ORA (Oral cavity anatomy — English terms)
-- Author: Claude                Date: YYYY-MM-DD
-- Źródło: <kolokwium / lista słówek / skrypt uczelni>
-- Pytań: N
-- ============================================================

-- 6.1 TOPIK — tylko przy PIERWSZYM batchu na ten topic_id
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count)
VALUES
  ('ENG-ORA', 'stoma-angielski',
   'Anatomia jamy ustnej — terminologia angielska',
   1, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- 6.2 PYTANIA
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   theme_label, subtheme_label, batch_label, source_exam)
VALUES

('eng-ora-001', 'ENG-ORA',
 'Which English term corresponds to the Polish name: ''żuchwa''?',
 '[
   {"id":"a","text":"Maxilla"},
   {"id":"b","text":"Mandible"},
   {"id":"c","text":"Zygomatic bone"},
   {"id":"d","text":"Palatine bone"},
   {"id":"e","text":"Hyoid bone"}
 ]'::jsonb,
 'b',
 'Żuchwa to **mandible** — pojedyncza kość tworząca dolną szczękę. Maxilla to szczęka górna. Kość jarzmowa to zygomatic bone, podniebienna — palatine bone, językowa — hyoid bone (nie należy do szkieletu twarzoczaszki w sensie żucia).',
 NULL, NULL, 'e_eng_2025/1', 'Kolokwium EN med — przykład'),

('eng-ora-002', 'ENG-ORA',
 'The English term ''gingiva'' refers to:',
 '[
   {"id":"a","text":"Dental pulp"},
   {"id":"b","text":"Gums (gum tissue)"},
   {"id":"c","text":"Tooth enamel"},
   {"id":"d","text":"Alveolar bone"},
   {"id":"e","text":"Periodontal ligament"}
 ]'::jsonb,
 'b',
 '**Gingiva** to dziąsło — tkanka otaczająca zęby u ich szyjki. Pulp to miazga zęba, enamel to szkliwo, alveolar bone to kość zębodołowa, a więzadło okołozębowe to periodontal ligament.',
 NULL, NULL, 'e_eng_2025/1', 'Kolokwium EN med — przykład');

-- 6.3 PRZELICZ LICZNIK NA TOPIKU (wymagane po każdym batchu)
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'ENG-ORA'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

> **KRYTYCZNE SQL:** ostatni rekord w `VALUES` kończy się `);`, pozostałe `),`. Apostrofy w `text`/`explanation` jako `''` (np. `''gingiva''`, `patient''s`). JSON w `options` — pojedyncze apostrofy w tekście opcji też jako `''` wewnątrz stringa SQL.

---

## 7. CHECKLISTA PRZED `RUN`

- [ ] `topic_id` istnieje (krok 6.1) lub był już w bazie.
- [ ] `subject_id` topiku = `stoma-angielski` (nie `lek-angielski`).
- [ ] Każde `questions.id` unikalne; numeracja ciągła w topiku.
- [ ] `options`: kolejność `a → b → c → d → e`; poprawny JSONB.
- [ ] `correct_option_id` = jedno z `a`/`b`/`c`/`d`/`e`.
- [ ] `explanation` po polsku, 2–5 zdań, uzasadnia poprawną i odrzuca główne dystraktory.
- [ ] Terminy EN medyczne, nie potoczne (chyba że źródło wymaga inaczej).
- [ ] Brak emoji, markdownowych tabel i backticków w polach UI.
- [ ] UPDATE `topics.question_count` (krok 6.3).

---

## 8. EKSPORT / WERYFIKACJA (opcjonalnie)

Po wgraniu batcha w repo można podejrzeć pytania:

```bash
node scripts/export-topic-questions.mjs ENG-ORA
```

Porównanie z UI: przedmiot **Angielski** na pulpicie rok 1 stomatologia.

---

## 9. JEŚLI MASZ WĄTPLIWOŚCI

Wszystko, czego **nie ma w tym pliku** — apostrofy, opcje kombinatoryczne, ogólna struktura tabeli `questions`, shuffle opcji — jest w **`FormatPisaniaPytan.md`**.

Ten plik to wyłącznie overlay pod **Język angielski medyczny · stomatologia · `stoma-angielski`**.

---

## 10. PROMPT STARTOWY (wklej do Claude razem z materiałem)

```
Przeczytaj FormatPisaniaPytan.md (ogólne zasady) oraz FormatPisaniaPytan-AngielskiMedyczny-Stoma.md (ten przedmiot).

Materiał źródłowy załączam poniżej / w pliku.

Zadanie:
1. Wyodrębnij sensowne topiki (ENG-XXX) zgodnie z rozdziałami materiału.
2. Wygeneruj pytania single_choice w stylu kolokwium angielskiego medycznego dla studentów stomatologii.
3. Zwróć WYŁĄCZNIE gotowy skrypt SQL do Supabase (INSERT topics jeśli nowe + INSERT questions + UPDATE question_count).
4. Ustaw batch_label: <podaj np. e_eng_2025/1>.
5. Na końcu krótko podsumuj: ile pytań, ile topików, zakres numeracji ID.

Nie wymyślaj faktów klinicznych ponad materiał źródłowy. Explanation zawsze po polsku.
```
