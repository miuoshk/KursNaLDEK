# Format pytań — Patomorfologia (2 rok stomatologii)

> Companion do `FormatPisaniaPytan.md`. Zasady opcji A–E, kolejność w JSONB, opcje kombinatoryczne, escape apostrofów (`''`), struktura tabel — **identyczne**. Ten plik jest **promptem dla Claude** (lub innego LLM) konwertującego surowy materiał egzaminacyjny / kolokwia / testy z uczelni do batcha pytań w **Supabase**.

**Projekt:** Kurs na LDEK / KNNP  
**Subject w UI:** `stoma-patologia` · rok 2 · stomatologia  
**Stan bazy (Supabase prod, 2026-06-11):** subject istnieje, **0 topików, 0 pytań** — wszystko budujesz od zera z materiału źródłowego.

**Konwersja TXT → SQL:** ogólny pipeline w `ClaudePrompt-TXT-na-SQL.md` (sekcja METADANE BATCHA).

---

## 0. TWOJA ROLA (dla Claude)

Jesteś botem contentowym. Dostajesz surowy materiał (PDF kolokwium, test z ćwiczeń, slajdy wykładowe, plik `.txt`) i **zwracasz gotowy skrypt SQL** do wklejenia w Supabase SQL Editor.

**Nie zgaduj topików ani pytań.** Topiki wynikają z realnych rozdziałów / tematów w materiale źródłowym (program uczelni, podział wykładu, kolokwia). Jeśli materiał jest jednym blokiem bez podziału — utwórz **jeden** sensowny topik (np. `PAT-OG`) i opisz w komentarzu SQL, że to batch ogólny.

**Output:** wyłącznie SQL (+ krótki komentarz na górze: ile pytań, jaki `batch_label`, skąd materiał). Bez markdownowych tabel w treści pytań.

---

## 1. CO JUŻ JEST W BAZIE (Supabase)

### 1.1 Przedmiot (`subjects`)

| Pole              | Wartość           |
|-------------------|-------------------|
| `subjects.id`     | **`stoma-patologia`** |
| `name`            | Patomorfologia    |
| `short_name`      | Patologia         |
| `icon_name`       | `scan`            |
| `year`            | `2`               |
| `track`           | `stomatologia`    |
| `product`         | `knnp`            |
| `display_order`   | `7`               |

**Nie mylić z:** `lek-patofizjologia` (rok 3, kierunek lekarski) — ten plik dotyczy **wyłącznie stomatologii**.

### 1.2 Topiki i pytania

| Tabela      | Stan prod |
|-------------|-----------|
| `topics`    | **0** rekordów dla `subject_id = 'stoma-patologia'` |
| `questions` | **0** pytań |

**Shared content:** brak. W odróżnieniu od histologii (`histologia` + powłoka `stoma-histologia`) treść idzie **bezpośrednio** pod `stoma-patologia`. **Nigdy** nie używaj fikcyjnego `subject_id = 'patologia'`.

### 1.3 Kolumny produkcyjne (zweryfikowane w Supabase)

**`topics`:** `id`, `subject_id`, `name`, `display_order`, `question_count`, `knowledge_card`, `tracks`

**`questions`:** `id`, `topic_id`, `text`, `options` (JSONB), `correct_option_id`, `explanation`, `source_exam`, `source_code`, `image_url`, `is_active`, `question_type`, `learning_outcome`, `theme_label`, `subtheme_label`, `batch_label`, `disable_option_shuffle`, `tracks`

> Kolumny **`difficulty`** — **nie istnieją** w schemacie. Nie używaj.

---

## 2. HIERARCHIA W BAZIE

```text
subjects.id = stoma-patologia
    └── topics.id = PAT-XXX  (dział / kolokwium / wykład)
            └── questions.id = pat-xxx-NNN
```

Powiązanie z innymi przedmiotami (informacyjnie — **nie importuj** do histologii):

- Rok 1: `stoma-histologia` → kanon `histologia` (morfologia zdrowa)
- Rok 2: **`stoma-patologia`** (zmiany chorobowe, diagnostyka histopatologiczna)

---

## 3. KONWENCJA NAZW

### 3.1 `topics.id`

Prefiks **`PAT-`** + 2–4 wielkie litery / cyfry z nazwy topiku ze źródła.

| Nazwa topiku z materiału (przykłady)     | `topic_id`   |
|------------------------------------------|--------------|
| Ogólna patomorfologia / podstawy         | `PAT-OG`     |
| Uszkodzenie komórki i tkanki             | `PAT-USZ`    |
| Procesy zapalne                          | `PAT-ZAP`    |
| Nowotwory — podstawy                     | `PAT-NOW`    |
| Układ krążenia — patomorfologia          | `PAT-KRA`    |
| Układ pokarmowy — patomorfologia         | `PAT-POK`    |
| Jama ustna i zęby — patomorfologia       | `PAT-JAM`    |
| Kolokwium 1                              | `PAT-KOL1`   |
| Zaliczenie / egzamin końcowy             | `PAT-ZAL`    |

**Zasady:**

- Jedna etykieta `topic_id` = jeden logiczny rozdział / kolokwium / ćwiczenie ze źródła.
- `subject_id` **zawsze** `stoma-patologia`.
- `display_order` — kolejność w programie / w materiale (1, 2, 3…). Kafelek **Zaliczenie** (`PAT-ZAL`) zwykle na końcu listy.
- **`tracks`:** nie ustawiaj (NULL). Przedmiot istnieje tylko na stomatologii — brak współdzielenia z lekarskim.

### 3.2 `questions.id`

`pat-{topic-suffix}-{NNN}` — **małe litery**, trzycyfrowa numeracja z zerami wiodącymi.

| Przykład        | Znaczenie                                      |
|-----------------|------------------------------------------------|
| `pat-jam-001`   | Patomorfologia · Jama ustna · pytanie 1        |
| `pat-zap-014`   | Patomorfologia · Procesy zapalne · pytanie 14  |
| `pat-zal-127`   | Patomorfologia · Zaliczenie · pytanie 127      |

**Mapowanie suffix ↔ topic_id:**

| `topic_id` | Suffix w `questions.id` |
|------------|-------------------------|
| `PAT-JAM`  | `pat-jam`               |
| `PAT-KOL1` | `pat-kol1`              |
| `PAT-ZAL`  | `pat-zal`               |

Przed kolejnym batchem sprawdź ostatnie ID:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'PAT-JAM'
 ORDER BY id DESC LIMIT 1;
```

Brak wyniku → start od `pat-jam-001`.

---

## 4. POLA `questions` — CO WPISYWAĆ

| Kolumna                  | Wartość dla patomorfologii |
|--------------------------|----------------------------|
| `id`                     | `pat-{suffix}-{NNN}`       |
| `topic_id`               | `PAT-XXX`                  |
| `text`                   | Treść pytania **po polsku** |
| `options`                | JSONB, **5 opcji** `a`–`e` |
| `correct_option_id`      | `a` / `b` / `c` / `d` / `e` |
| `explanation`            | 2–6 zdań po polsku; uzasadnij poprawną i główne dystraktory |
| `question_type`          | pomijaj → domyślnie `single_choice` |
| `is_active`              | pomijaj → domyślnie `true` |
| `theme_label`            | **`NULL`** na start (§ 4.1) |
| `subtheme_label`         | **`NULL`** na start (§ 4.2) |
| `batch_label`            | patrz § 5 |
| `learning_outcome`       | `NULL` (chyba że wynika ze slajdów/programu) |
| `source_exam`            | opcjonalnie, np. `Kolokwium patomorfologia UJ 2025` |
| `source_code`            | opcjonalnie, kod pytania z arkusza |
| `image_url`              | opcjonalnie — URL obrazu histopatologicznego (§ 6) |
| `tracks`                 | **`NULL`** — nie filtruj kierunku |
| `disable_option_shuffle` | domyślnie `false`; ustaw `true` tylko jeśli opcje kombinatoryczne wymagają stałej kolejności A–E (patrz `FormatPisaniaPytan.md` § 6.1) |

### 4.1 `theme_label` (opcjonalnie, później)

Na start trzymaj `NULL`. Po zebraniu większego batcha można wprowadzić kontrolowaną listę, np.:

- `Ogólna patomorfologia`
- `Procesy zapalne i immunologiczne`
- `Nowotwory`
- `Patomorfologia układów narządowych`
- `Patomorfologia jamy ustnej i zębów`

### 4.2 `subtheme_label` (opcjonalnie, później)

Wolny tekst, węższy niż `topic_id`, np. `"Martwica koagulacyjna"`, `"Rak płaskonabłonkowy"`, `"Zapalenie przyzębia — histopatologia"`.

---

## 5. `batch_label`

Format (małe litery):

| Przykład           | Znaczenie                              |
|--------------------|----------------------------------------|
| `e_pat_2026/1`     | Egzamin / kolokwium, rok 2026, termin 1 |
| `e_pat_2025/2`     | Termin 2                               |
| `e_pat_kol1`       | Kolokwium 1 bez roku                   |
| `e_pat_cw3`        | Ćwiczenia 3                            |
| `e_pat_zal`        | Zaliczenie / egzamin końcowy           |
| `NULL`             | Pytania autorskie / bez etykiety       |

Cały batch importu = **jedna** wartość `batch_label`.

---

## 6. ZASADY MERYTORYCZNE (patomorfologia)

- Język: **polski** w `text`, `options`, `explanation` (termin łaciński w nawiasie tam, gdzie standardowo).
- Jedno jasne pytanie, bez podwójnej negacji.
- 5 opcji wiarygodnych, podobnej długości; dystraktory z tej samej dziedziny (np. nie mieszaj typów martwicy z nazwami barwień).
- Wyjaśnienie: **dlaczego** poprawna jest poprawna **i dlaczego** główne dystraktory są błędne.
- Bez emoji w `explanation`.
- Unikaj tabel markdown / backticków w treści — czysty tekst (+ ewentualnie `**pogrubienie**` jak w innych batchach MJU).
- **Obrazki:** jeśli źródło ma mikrofotografię / preparat, ustaw `image_url` (publiczny URL w Storage Supabase lub zewnętrzny HTTPS). Stem pytania opisuje, co oceniamy (np. „Na preparacie H&E widoczna jest…").
- **Nie duplikuj** pytań czysto histologicznych (struktura zdrowa) — to należy do `histologia` / `HIST-*`. Patomorfologia = mechanizmy choroby, zmiany morfologiczne, klasyfikacje, korelacja obraz–rozpoznanie.

### 6.1 Opcje kombinatoryczne

Dozwolone (jak LDEK): „Prawidłowe A i C", „Wszystkie prawidłowe", „Żadna z powyższych".

- Kolejność w JSONB: **zawsze** `a → b → c → d → e`.
- Litery w tekście opcji odnoszą się do tej samej kolejności.
- UI **nie miesza** opcji — pozycja A w aplikacji = opcja `a` w bazie.

---

## 7. BLOK METADANE BATCHA (dla konwertera TXT → SQL)

Wklej przed plikiem `.txt` (Claude / `ClaudePrompt-TXT-na-SQL.md`):

```text
METADANE BATCHA
subject_id: stoma-patologia
topic_id: PAT-JAM
topic_name: Jama ustna i zęby — patomorfologia
display_order: 7
tracks: NULL
question_id_prefix: pat-jam
start_question_number: 1
batch_label: e_pat_2026/1
is_new_topic: tak
```

| Pole | Wartość stała / uwagi |
|------|------------------------|
| `subject_id` | **zawsze** `stoma-patologia` |
| `tracks` | **zawsze** NULL / puste |
| `is_new_topic` | `tak` przy pierwszym batchu na dany `PAT-*`; potem `nie` |

---

## 8. WZÓR SQL — pełny batch (Supabase SQL Editor)

```sql
-- ============================================================
-- BATCH: e_pat_2026/1  ·  stoma-patologia
-- Topic: PAT-JAM (Jama ustna i zęby — patomorfologia)
-- Author: Claude                Date: YYYY-MM-DD
-- Źródło: <kolokwium / ćwiczenia / skrypt uczelni>
-- Pytań: 2
-- ============================================================

-- 8.1 TOPIK — tylko przy PIERWSZYM batchu na ten topic_id
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count)
VALUES
  ('PAT-JAM', 'stoma-patologia',
   'Jama ustna i zęby — patomorfologia',
   7, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- 8.2 PYTANIA
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   theme_label, subtheme_label, batch_label, source_exam)
VALUES

('pat-jam-001', 'PAT-JAM',
 'Który typ martwicy charakteryzuje się zachowaniem konturów komórek i wydzielaniem kwasu mlekowego?',
 '[
   {"id":"a","text":"Martwica zgorzelinowa (coagulation necrosis)"},
   {"id":"b","text":"Martwica rozpływna (liquefactive necrosis)"},
   {"id":"c","text":"Martwica tłuszczowa (fat necrosis)"},
   {"id":"d","text":"Martwica caseous (caseous necrosis)"},
   {"id":"e","text":"Apoptoza"}
 ]'::jsonb,
 'a',
 'Martwica koagulacyjna (zgorzelinowa) występuje m.in. przy niedokrwieniu tkanek parenchymatogennych — kontury komórek są zachowane, a denaturacja białek prowadzi do twardej, bladobiałej zmiany. Martwica rozpływna typowa jest w OUN i ropie, tłuszczowa — w trzustce i tkance tłuszczowej, caseous — w gruźlicy, a apoptoza to programowana śmierć komórki bez reakcji zapalnej.',
 NULL, NULL, 'e_pat_2026/1', 'Przykład — patomorfologia STOMA'),

('pat-jam-002', 'PAT-JAM',
 'Histopatologiczny obraz przewlekłego zapalenia przyzębia obejmuje:',
 '[
   {"id":"a","text":"Wyłącznie ostry naciek neutrofilowy bez resorpcji kości"},
   {"id":"b","text":"Infiltrację limfoplazmatyczną, utratę włókien kolagenowych i resorpcję kości zębodołowej"},
   {"id":"c","text":"Martwicę caseous w dziąśle"},
   {"id":"d","text":"Hiperplazję nabłonka jelitowego z wacuolami"},
   {"id":"e","text":"Prawidłowe A i C"}
 ]'::jsonb,
 'b',
 'Przewlekłe zapalenie przyzębia to proces destrukcyjny z utratą włókien periodontium, resorpcją kości i przewlekłym naciekiem (limfocyty, plazmocyty, makrofagi). Ostry naciek neutrofilowy dominuje w zapaleniu ostroym; martwica caseous i obraz jelitowy nie należą do patomorfologii przyzębia.',
 NULL, NULL, 'e_pat_2026/1', 'Przykład — patomorfologia STOMA');

-- 8.3 PRZELICZ LICZNIK NA TOPIKU (wymagane po każdym batchu)
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'PAT-JAM'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

> **KRYTYCZNE SQL:** ostatni rekord w `VALUES` kończy się `);`, pozostałe `),`. Apostrofy w `text`/`explanation` jako `''`. JSON w `options` — apostrofy w tekście opcji też jako `''` wewnątrz stringa SQL.

---

## 9. WZÓR — seed samych topików (bez pytań)

Jeśli znasz pełną strukturę programu zanim wgrasz pytania (wzór: `scripts/2026-05-21-stoma-y2-mikrobio-ju-topics.sql`):

```sql
-- ============================================================
-- Stomatologia rok 2: Patomorfologia — tematy (puste)
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PAT-OG',   'stoma-patologia', 'Ogólna patomorfologia', 1, 0),
  ('PAT-ZAP',  'stoma-patologia', 'Procesy zapalne', 2, 0),
  ('PAT-NOW',  'stoma-patologia', 'Nowotwory — podstawy', 3, 0),
  ('PAT-JAM',  'stoma-patologia', 'Jama ustna i zęby', 4, 0),
  ('PAT-ZAL',  'stoma-patologia', 'Zaliczenie', 5, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
```

> **Uwaga:** powyższa lista to **przykład** — dopasuj nazwy i kolejność do realnego programu uczelni. Nie wgrywaj placeholderów bez zgody redaktora.

---

## 10. ZALICZENIE — jeden worek (`PAT-ZAL`)

Jeśli egzamin końcowy ma być jednym kafelkiem (wzór: `FormatPisaniaPytan-MikrobiologiaJU-Zaliczenie.md`):

| Pole | Wartość |
|------|---------|
| `topics.id` | **`PAT-ZAL`** |
| Prefiks pytań | **`pat-zal-`** |
| Domyślny `batch_label` | `e_pat_zal` |

Bot **nie mapuje** pytań zaliczeniowych na działy wykładowe — wszystko do `PAT-ZAL`, chyba że user wyraźnie każe inaczej.

---

## 11. CHECKLISTA PRZED `RUN`

- [ ] `subject_id` topiku = **`stoma-patologia`** (nie `lek-patofizjologia`, nie `patologia`).
- [ ] `topic_id` z prefiksem **`PAT-`**; unikalny w całej bazie.
- [ ] Każde `questions.id` unikalne; numeracja ciągła w topiku (`pat-xxx-001`, `002`, …).
- [ ] `options`: kolejność `a → b → c → d → e`; poprawny JSONB; **5 opcji**.
- [ ] `correct_option_id` = jedno z `a`/`b`/`c`/`d`/`e`.
- [ ] `explanation` po polsku, 2–6 zdań.
- [ ] `tracks` = NULL (nie filtruj kierunku).
- [ ] Ostatni rekord w `VALUES` → `);`; pozostałe `),`.
- [ ] Po batchu: `UPDATE` na `question_count` dla dotkniętego `topic_id`.
- [ ] Smoke: konto **Stomatologia rok 2** → widać przedmiot i nowy dział; pytania startują w sesji.

---

## 12. EKSPORT / AUDYT (dev)

Po wgraniu batcha możesz wyeksportować dział z prod:

```bash
node scripts/export-topic-questions.mjs \
  --subject stoma-patologia \
  --topic PAT-JAM \
  --format json \
  --out exports/pat-PAT-JAM-sample.json
```

Lista topików w prod:

```sql
SELECT id, name, display_order, question_count
  FROM public.topics
 WHERE subject_id = 'stoma-patologia'
 ORDER BY display_order;
```

---

## 13. POWIĄZANE PLIKI W REPO

| Plik | Rola |
|------|------|
| `FormatPisaniaPytan.md` | Uniwersalne zasady MCQ, JSONB, checklista |
| `ClaudePrompt-TXT-na-SQL.md` | Konwerter TXT → SQL + METADANE BATCHA |
| `docs/KodyPrzedmiotow.md` | Słownik ID przedmiotów |
| `scripts/seed-subjects-curriculum.sql` | Definicja `stoma-patologia` |
| `FormatPisaniaPytan-MikrobiologiaJU-Zaliczenie.md` | Wzór „jeden worek" na zaliczenie (STOMA r.2) |
