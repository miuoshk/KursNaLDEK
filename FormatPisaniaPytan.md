# Format pytań — Kurs na LDEK / KNNP
## Instrukcja dodawania pytań do Supabase (v2 — 2026-05-16)

---

## 1. STRUKTURA TABELI `questions`

| Kolumna             | Typ     | Wymagane | Opis                                                                                |
|---------------------|---------|----------|-------------------------------------------------------------------------------------|
| `id`                | TEXT    | TAK      | Unikalny identyfikator pytania (np. `ana-ner-001`)                                  |
| `topic_id`          | TEXT    | TAK      | FK do `topics.id` (np. `ANA-NER`)                                                   |
| `text`              | TEXT    | TAK      | Treść pytania                                                                       |
| `options`           | JSONB   | TAK      | Tablica `[{"id":"a","text":"..."}, ...]` — zwykle 5 opcji (A–E)                     |
| `correct_option_id` | TEXT    | TAK      | ID poprawnej opcji (`a`/`b`/`c`/`d`/`e`)                                            |
| `explanation`       | TEXT    | TAK      | Wyjaśnienie poprawnej odpowiedzi (min. 2–5 zdań)                                    |
| `question_type`     | TEXT    | NIE      | `single_choice` (domyślne) / `multi_choice` / `ordering` / `image_identify`         |
| `is_active`         | BOOL    | NIE      | Domyślnie `true`                                                                    |
| `source_exam`       | TEXT    | NIE      | Tekstowa nazwa źródła (np. „LDEK 2023 Jesień") — informacyjnie                      |
| `source_code`       | TEXT    | NIE      | Kod pytania w źródle (np. „LDEK-2023-J-42")                                         |
| `learning_outcome`  | TEXT    | NIE      | Kod ministerialny efektu kształcenia (np. `A.U1`, `C.U14`)                          |
| `image_url`         | TEXT    | NIE      | URL do obrazu (jeśli pytanie kliniczne/obrazowe)                                    |
| **`theme_label`**   | TEXT    | NIE      | **NOWE** — szeroka etykieta z kontrolowanej listy (np. `Ośrodkowy układ nerwowy`)   |
| **`subtheme_label`**| TEXT    | NIE      | **NOWE** — węższy podtemat dobierany z treści (np. `Nerw trójdzielny (V)`)          |
| **`batch_label`**   | TEXT    | NIE      | **NOWE** — etykieta zestawu/egzaminu (np. `e_anat_2025/1`). NULL = „Wszystkie"      |

> Uwaga: w starym formacie figurowała kolumna `difficulty` — **NIE ISTNIEJE** w schemacie. Pomijaj ją.

---

## 2. KONWENCJA `id` i `topic_id`

### Topiki (już istnieją w bazie dla `stoma-anatomia`)
| `topic_id` | Nazwa                              |
|------------|------------------------------------|
| `ANA-CZA`  | Czaszka i kości twarzoczaszki      |
| `ANA-MIE`  | Mięśnie żucia i mimiczne           |
| `ANA-NAC`  | Naczynia głowy i szyi              |
| `ANA-NER`  | Nerwy czaszkowe                    |
| `ANA-JAM`  | Jama ustna i jej struktury         |

### `id` pytania
Format: `{przedmiot}-{temat}-{NNN}` — małe litery, numeracja trzycyfrowa z zerami wiodącymi.

Przykłady:
- `ana-ner-001` → Anatomia · Nerwy czaszkowe · pytanie 1
- `ana-cza-014` → Anatomia · Czaszka · pytanie 14

---

## 3. NOWE ETYKIETY — JAK JE WYPEŁNIA BOT

### 3.1 `theme_label` — kontrolowana lista (wybierasz DOKŁADNIE z listy)

**Lista dozwolonych wartości dla `stoma-anatomia` (Anatomia, rok 1 stomatologii):**

```
1.  Układ ruchu kończyn
2.  Układ ruchu tułowia
3.  Układ ruchu głowy i szyi
4.  Układ krążenia
5.  Układ oddechowy
6.  Układ pokarmowy
7.  Układ moczowo-płciowy
8.  Ośrodkowy układ nerwowy
9.  Obwodowy układ nerwowy
10. Topografia głowy i szyi
11. Topografia kończyn
12. Topografia tułowia
```

Zasady:
- Wpisuj **dokładnie** taki ciąg jak na liście (case-sensitive, polskie znaki, spacja po `/`/myślniku).
- Jeden `theme_label` na pytanie.
- Jeśli treść pytania nie pasuje do żadnej etykiety lub jest na pograniczu kilku → `NULL`.

**Mapowanie pomocnicze (topic → najczęstszy `theme_label`):**

| `topic_id` | Domyślnie idzie do `theme_label`                         |
|------------|----------------------------------------------------------|
| `ANA-CZA`  | `Układ ruchu głowy i szyi` (kości) lub `Topografia głowy i szyi` (relacje topograficzne) |
| `ANA-MIE`  | `Układ ruchu głowy i szyi` (mięśnie żucia/mimiczne)      |
| `ANA-NAC`  | `Układ krążenia` (tętnice/żyły) lub `Topografia głowy i szyi` (jeśli pytanie o położenie) |
| `ANA-NER`  | `Obwodowy układ nerwowy` (nerwy czaszkowe = PNS) — chyba że pytanie o jądra w pniu mózgu, wtedy `Ośrodkowy układ nerwowy` |
| `ANA-JAM`  | `Układ pokarmowy` (anatomia jamy ustnej jako początek przewodu pokarmowego) lub `Topografia głowy i szyi` |

> Reguła rozstrzygająca: jeśli pytanie testuje **co to jest / z czego się składa** → wybierz układ funkcjonalny (1–9). Jeśli testuje **gdzie leży / czego sąsiaduje** → wybierz topografię (10–12).

### 3.2 `subtheme_label` — bot wybiera z treści (wolny tekst, węższy niż `topic_id`)

Zasady:
- Krótka fraza rzeczownikowa (1–4 słowa), zaczynająca się z **wielkiej litery**.
- **Węższa** niż `topic_id`. Przykłady:
  - `topic_id=ANA-NER` (Nerwy czaszkowe) → `subtheme_label="Nerw trójdzielny (V)"`, `"Nerw twarzowy (VII)"`, `"Nerw językowo-gardłowy (IX)"`
  - `topic_id=ANA-CZA` (Czaszka) → `subtheme_label="Kość szczękowa"`, `"Żuchwa"`, `"Podstawa czaszki"`
  - `topic_id=ANA-MIE` (Mięśnie żucia) → `subtheme_label="Mięsień żwacz"`, `"Mięsień skroniowy"`
  - `topic_id=ANA-NAC` (Naczynia) → `subtheme_label="Tętnica szczękowa"`, `"Splot skrzydłowy"`
  - `topic_id=ANA-JAM` (Jama ustna) → `subtheme_label="Język"`, `"Podniebienie miękkie"`
- Trzymaj konsekwencję — jeśli już użyłeś frazy w batchu, używaj jej dalej (case-sensitive).

### 3.3 `batch_label` — etykieta zestawu/egzaminu

Format: `e_<kod_przedmiotu>_<rok>/<termin>`

| Przykład          | Znaczenie                                       |
|-------------------|-------------------------------------------------|
| `e_anat_2025/1`   | Egzamin z Anatomii, 2025, termin 1              |
| `e_anat_2024/2`   | Egzamin z Anatomii, 2024, termin 2              |
| `e_anat_kol1`     | Kolokwium 1 z Anatomii (bez roku)               |
| `NULL`            | Pytanie autorskie / bez przypisania — w UI „Wszystkie" |

Zasady:
- Małe litery, podkreślniki, slash przed numerem terminu.
- Cały batch importu wpisuje JEDNĄ wartość `batch_label`.
- Brak `batch_label` (`NULL`) jest OK — pytanie i tak jest aktywne.

---

## 4. SZABLON SQL — BATCH PYTAŃ (kopiuj-wklej do Supabase SQL Editor)

```sql
-- ============================================================
-- BATCH: e_anat_2025/1  ·  stoma-anatomia
-- Author: <bot>            Date: 2026-05-16
-- Topic:  ANA-NER (Nerwy czaszkowe)
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   theme_label, subtheme_label, batch_label)
VALUES

('ana-ner-001', 'ANA-NER',
 'Który nerw czaszkowy unerwia ruchowo wszystkie mięśnie żucia?',
 '[
   {"id":"a","text":"Nerw twarzowy (VII)"},
   {"id":"b","text":"Nerw trójdzielny (V), gałąź żuchwowa (V3)"},
   {"id":"c","text":"Nerw językowo-gardłowy (IX)"},
   {"id":"d","text":"Nerw błędny (X)"},
   {"id":"e","text":"Nerw podjęzykowy (XII)"}
 ]'::jsonb,
 'b',
 'Mięśnie żucia (żwacz, skroniowy, skrzydłowy boczny i przyśrodkowy) są unerwione ruchowo przez gałąź żuchwową nerwu trójdzielnego (V3) — konkretnie przez gałęzie żwaczowe, głębokie skroniowe oraz skrzydłowe. Nerw twarzowy (VII) unerwia mięśnie mimiczne, IX i X unerwiają inne struktury, a XII tylko mięśnie języka.',
 'Obwodowy układ nerwowy',
 'Nerw trójdzielny (V)',
 'e_anat_2025/1'),

('ana-ner-002', 'ANA-NER',
 'Porażenie którego nerwu czaszkowego objawia się brakiem ruchów mimicznych po jednej stronie twarzy?',
 '[
   {"id":"a","text":"V — trójdzielny"},
   {"id":"b","text":"VII — twarzowy"},
   {"id":"c","text":"IX — językowo-gardłowy"},
   {"id":"d","text":"X — błędny"},
   {"id":"e","text":"XII — podjęzykowy"}
 ]'::jsonb,
 'b',
 'Nerw twarzowy (VII) unerwia ruchowo wszystkie mięśnie mimiczne twarzy. Jednostronne porażenie obwodowe VII (porażenie Bella) objawia się wygładzeniem zmarszczek czołowych, opadnięciem kącika ust i niedomykaniem powieki po stronie chorej.',
 'Obwodowy układ nerwowy',
 'Nerw twarzowy (VII)',
 'e_anat_2025/1');

-- ============================================================
-- PO WSZYSTKICH INSERTACH — przelicz licznik na topiku
-- (topics.question_count jest zdenormalizowane i go używamy w UI)
-- ============================================================

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'ANA-NER'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

> **KRYTYCZNE:** ostatni `INSERT` w sekcji `VALUES` ma **kropkę i średnik na końcu**, a NIE przecinek. Innym ułożeniem PostgreSQL wywali błąd.

---

## 5. CHECKLISTA PRZED `RUN`

- [ ] Każde `id` jest unikalne i pasuje do konwencji `{przedmiot}-{topic}-{NNN}`.
- [ ] `topic_id` istnieje w `topics` (FK, inaczej INSERT się wywali).
- [ ] `options` to poprawny JSONB: tablica obiektów `{"id":"a","text":"..."}`, każdy `id` unikalny, zwykle 5 opcji.
- [ ] `correct_option_id` matchuje jeden z `id` w `options`.
- [ ] Apostrofy w `text`/`explanation` są **podwojone** (`it''s`, nie `it's`).
- [ ] Polskie znaki zachowane (ą, ę, ć, ś, ź, ż, ó, ł, ń).
- [ ] `theme_label` (jeśli wpisany) jest **dokładnie** taki jak na liście § 3.1.
- [ ] `subtheme_label` jest **węższy** niż `topic_id` (nie kopiuj nazwy topiku — sekcja § 3.2).
- [ ] `batch_label` w formacie `e_<kod>_<rok>/<termin>` albo `NULL`.
- [ ] Ostatni rekord w `VALUES` zakończony `);`, pozostałe `),`.
- [ ] Na końcu batcha UPDATE na `topics.question_count`.

---

## 6. ZASADY MERYTORYCZNE (skrócone)

- Jedno jasne pytanie, bez podwójnych negacji.
- 5 opcji (A–E) wiarygodnych, podobnej długości, **każda opcja samodzielna**.
- Wyjaśnienie: **dlaczego** poprawna jest poprawna **i dlaczego** główne dystraktory są błędne (2–5 zdań).
- Terminy polskie + łaciński odpowiednik w nawiasie tam gdzie to ma sens.
- Bez emoji w `explanation` (renderer nie obsługuje).
- Tabel markdown / backticków unikaj — wszystko ma być czystym tekstem.

### 6.1 OPCJE KOMBINATORYCZNE — DOZWOLONE, ale z zachowaniem porządku

Pytania w stylu LDEK z opcjami typu „prawidłowe A i C", „wszystkie prawidłowe", „A, B i C" **są dozwolone**. UI od commita `2d4de0d` serwuje opcje w **oryginalnej kolejności z bazy** (bez shuffle), więc pozycja w UI dokładnie pokrywa się z `id` opcji w bazie:

| Pozycja UI | `option.id` w bazie | Co widzi user                |
|------------|---------------------|------------------------------|
| A          | `"a"`               | tekst opcji `a`              |
| B          | `"b"`               | tekst opcji `b`              |
| C          | `"c"`               | tekst opcji `c`              |
| D          | `"d"`               | tekst opcji `d`              |
| E          | `"e"`               | tekst opcji `e`              |

**Twarda zasada dla bota:**

- **Zawsze** wstawiaj opcje do `options` w kolejności `a → b → c → d → e`. Nigdy `[{id:"c"…}, {id:"a"…}…]` — to złamie odniesienia w opcjach typu „A i C".
- **Zawsze** sprawdź, że jeśli któraś opcja zawiera referencję do litery (np. „prawidłowe A i C"), to dosłownie chodzi o opcję `a` i `c` z tej samej tablicy.
- `correct_option_id` to ZAWSZE `id` opcji w bazie (np. `"d"`), nie pozycja.

Przykład poprawny:

```json
[
  {"id":"a","text":"Leży w dole zażuchwowym"},
  {"id":"b","text":"Jej przewód znajduje się w dnie jamy ustnej"},
  {"id":"c","text":"Jej przewód znajduje się w przedsionku jamy ustnej"},
  {"id":"d","text":"Prawidłowe A i B"},
  {"id":"e","text":"Prawidłowe A i C"}
]
```
`correct_option_id: "e"` → user widzi „E. Prawidłowe A i C" i wybiera E. Pozycja UI „A" to opcja `a` (Leży w dole zażuchwowym), pozycja UI „C" to opcja `c` (Jej przewód… przedsionku) → wszystko spójne.

Akceptowalne meta-opcje:
- „A i B", „A i C", „B i D", itd.
- „A, B i C" / „A, B, C i D"
- „Wszystkie prawidłowe" / „Wszystkie powyższe" / „Wszystkie odpowiedzi prawidłowe"
- „Żadne z powyższych" / „Żadna z powyższych"
- „Tylko A" / „Tylko B i C"

---

## 7. PRZYPOMINAJKA: STAN OBECNY ANATOMII W BAZIE

Wszystkie 5 topików w `stoma-anatomia` ma `question_count=5` w tabeli `topics`, ale w `questions` jest **0 rzeczywistych pytań**. Dlatego:

- pierwszy batch nadpisuje rzeczywistość → `question_count` zostanie przeliczony przez UPDATE na końcu;
- karta „Anatomia" jest renderowana jako aktywna (`topic_count=5 > 0`), więc po dodaniu pytań od razu wskoczą do sesji.

