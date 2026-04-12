# Kurs na LDEK — Dokumentacja bazy danych Supabase

> Wygenerowane automatycznie ze schematu produkcyjnego  
> Ostatnia aktualizacja: kwiecień 2026

---

## Spis treści

1. [Mapa tabel i relacji](#1-mapa-tabel-i-relacji)
2. [Tabele — szczegółowy opis](#2-tabele)
3. [Hierarchia treści: Przedmioty → Tematy → Pytania](#3-hierarchia-tresci)
4. [Manual: Jak dodawać pytania](#4-manual-dodawanie-pytan)
5. [Formatowanie wyjaśnień (Markdown)](#5-formatowanie-wyjasnien)
6. [Manual: Jak naprawiać pytania](#6-naprawianie-pytan)
7. [Bezpieczeństwo (RLS)](#7-rls)
8. [Funkcje i triggery](#8-funkcje-triggery)
9. [Indexy](#9-indexy)
10. [Statystyki bazy](#10-statystyki)

---

## 1. Mapa tabel i relacji

```
auth.users (Supabase Auth)
  └── profiles (1:1, trigger: handle_new_user)
       ├── study_sessions (1:N)
       │    └── session_answers (1:N)
       ├── user_question_progress (1:N)
       ├── learning_events (1:N)
       ├── topic_mastery_cache (1:N)
       ├── user_achievements (1:N)
       ├── user_challenge_progress (1:N)
       ├── osce_simulations (1:N)
       │    └── osce_station_results (1:N)
       └── question_discussions (1:N)

subjects ← [product: knnp/osce]
  ├── topics (1:N)
  │    └── questions (1:N)
  ├── daily_challenges (1:N)
  ├── study_sessions (FK subject_id)
  └── osce_station_results (FK subject_id)

achievements
  └── user_achievements (1:N)

opg_atlas_images
  └── opg_structures (1:N, FK atlas_id)
```

**Kierunek czytania**: `subjects` → `topics` → `questions` to hierarchia treści.
Wszystkie dane użytkownika (postęp, sesje, odpowiedzi) łączą się z `profiles` przez `user_id`.

---

## 2. Tabele

### 2.1 `profiles` — Profil użytkownika

Tworzony automatycznie przez trigger `handle_new_user` po rejestracji.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | uuid | NIE | — | = auth.users.id |
| `display_name` | text | NIE | — | Imię/nick |
| `avatar_initials` | text | TAK | — | Np. "MK" |
| `current_year` | int | TAK | 1 | Rok studiów (1-5) |
| `current_track` | text | TAK | 'stomatologia' | 'stomatologia' / 'lekarski' |
| `current_product` | text | TAK | 'knnp' | 'knnp' / 'ldek' |
| `daily_goal` | int | TAK | 25 | Cel dzienny pytań |
| `xp` | int | TAK | 0 | Suma punktów XP |
| `current_streak` | int | TAK | 0 | Dni z rzędu |
| `longest_streak` | int | TAK | 0 | Rekordowy streak |
| `last_active_date` | date | TAK | — | Ostatnia aktywność |
| `rank_tier` | text | TAK | 'praktykant' | Ranga gracza |
| `exam_date` | date | TAK | — | Planowana data egzaminu |
| `exam_readiness_score` | float | TAK | 0 | Gotowość 0–100 |
| `preferred_session_length` | int | TAK | 25 | Preferowana długość sesji |
| `avg_session_hour` | float | TAK | — | Średnia pora nauki |
| `learning_velocity` | float | TAK | 1.0 | Szybkość uczenia się |
| `stripe_customer_id` | text | TAK | — | Stripe ID |
| `subscription_status` | text | TAK | 'inactive' | Status subskrypcji |
| `subscription_ends_at` | timestamptz | TAK | — | Koniec subskrypcji |
| `notifications_reviews` | bool | TAK | true | Powiadomienia o powtórkach |
| `notifications_weekly` | bool | TAK | false | Tygodniowe podsumowanie |
| `theme` | text | TAK | 'dark' | Motyw |

**⚠️ WAŻNE**: Tabela `profiles` NIE ma kolumny `role`. Nie ma mechanizmu admin na poziomie bazy — admin operations wykonywane są przez service_role_key w server actions.

---

### 2.2 `subjects` — Przedmioty / stacje

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | text | NIE | — | ID tekstowe, np. `"anatomia-1-stom"` |
| `name` | text | NIE | — | Pełna nazwa |
| `short_name` | text | NIE | — | Skrócona nazwa |
| `icon_name` | text | TAK | 'book-open' | Ikona Lucide |
| `year` | int | NIE | — | Rok studiów (1-5) |
| `track` | text | NIE | 'stomatologia' | 'stomatologia' / 'lekarski' |
| `product` | text | NIE | 'knnp' | 'knnp' / 'osce' |
| `display_order` | int | TAK | 0 | Kolejność wyświetlania |
| `exam_tasks` | jsonb | TAK | — | Opis zadań egzaminacyjnych (OSCE) |
| `exam_day` | int | TAK | — | Dzień egzaminu (OSCE: 1 lub 2) |

**Kluczowe filtry:**
- KNNP (nauki podstawowe): `WHERE product = 'knnp' AND track = 'stomatologia' AND year = 1`
- OSCE (egzamin praktyczny): `WHERE product = 'osce'`

---

### 2.3 `topics` — Tematy w przedmiocie

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | text | NIE | — | ID tekstowe, np. `"anat-1-stom-kości"` |
| `subject_id` | text | TAK | — | FK → subjects.id |
| `name` | text | NIE | — | Nazwa tematu |
| `display_order` | int | TAK | 0 | Kolejność |
| `question_count` | int | TAK | 0 | Liczba pytań (cache) |
| `knowledge_card` | jsonb | TAK | — | Fiszka wiedzy (markdown) |

---

### 2.4 `questions` — Pytania ⭐

To jest **najważniejsza tabela** z perspektywy tworzenia treści.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | text | NIE | — | ID tekstowe, np. `"anat-1-stom-q001"` |
| `topic_id` | text | TAK | — | FK → topics.id |
| `text` | text | NIE | — | Treść pytania |
| `options` | jsonb | NIE | — | Opcje odpowiedzi (patrz format niżej) |
| `correct_option_id` | text | NIE | — | ID poprawnej opcji |
| `explanation` | text | NIE | — | Wyjaśnienie (**obsługuje Markdown!**) |
| `difficulty` | text | TAK | 'srednie' | 'latwe' / 'srednie' / 'trudne' |
| `source_exam` | text | TAK | — | Źródło, np. "LDEK 2024 jesień" |
| `source_code` | text | TAK | — | Kod źródłowy pytania |
| `image_url` | text | TAK | — | URL obrazka |
| `is_active` | bool | TAK | true | Czy pytanie jest aktywne |
| `question_type` | text | TAK | 'single_choice' | Typ: 'single_choice', 'ordering', 'image_identify', 'conversion_drill', 'opg_identify' |
| `timer_seconds` | int | TAK | — | Limit czasu (OSCE) |
| `learning_outcome` | text | TAK | — | Efekt kształcenia |
| `correct_order` | jsonb | TAK | — | Poprawna kolejność (ordering) |
| `hotspots` | jsonb | TAK | — | Hotspoty (image_identify) |
| `drill_questions` | jsonb | TAK | — | Sub-pytania (conversion_drill) |
| `identify_mode` | text | TAK | — | Tryb identyfikacji |

#### Format `options` (JSONB):

```json
[
  { "id": "a", "text": "Odpowiedź A" },
  { "id": "b", "text": "Odpowiedź B" },
  { "id": "c", "text": "Odpowiedź C" },
  { "id": "d", "text": "Odpowiedź D" },
  { "id": "e", "text": "Odpowiedź E" }
]
```

Minimalna ilość opcji: 4. Opcja `"e"` jest opcjonalna.

---

### 2.5 `study_sessions` — Sesje nauki

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | uuid | NIE | auto | — |
| `user_id` | uuid | TAK | — | FK → profiles.id |
| `subject_id` | text | TAK | — | FK → subjects.id |
| `mode` | text | NIE | — | 'nauka' / 'egzamin' |
| `total_questions` | int | NIE | — | Ile pytań w sesji |
| `correct_answers` | int | TAK | 0 | Ile poprawnych |
| `accuracy` | float | TAK | — | Trafność % |
| `duration_seconds` | int | TAK | — | Czas trwania |
| `xp_earned` | int | TAK | 0 | Zdobyte XP |
| `is_completed` | bool | TAK | false | Czy ukończona |
| `question_ids` | jsonb | TAK | '[]' | Lista ID pytań |
| `antares_insights` | jsonb | TAK | — | Insighty ANTARES |

---

### 2.6 `session_answers` — Odpowiedzi w sesji

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | uuid | NIE | auto | — |
| `session_id` | uuid | TAK | — | FK → study_sessions.id |
| `question_id` | text | TAK | — | FK → questions.id |
| `selected_option_id` | text | NIE | — | Wybrana opcja |
| `is_correct` | bool | NIE | — | Czy poprawna |
| `confidence` | text | TAK | — | 'nie_wiedzialem' / 'troche' / 'na_pewno' |
| `time_spent_seconds` | int | TAK | — | Czas na pytanie |
| `question_order` | int | TAK | — | Kolejność w sesji |
| `is_first_exposure` | bool | TAK | true | Czy pierwszy raz widziane |

**Unique constraint**: `(session_id, question_id)` — jedno pytanie = jedna odpowiedź w sesji.

---

### 2.7 `user_question_progress` — Stan FSRS per pytanie

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | uuid | NIE | auto | — |
| `user_id` | uuid | TAK | — | FK → profiles.id |
| `question_id` | text | TAK | — | FK → questions.id |
| `stability` | float | TAK | 0 | FSRS: stabilność |
| `difficulty_rating` | float | TAK | 0.3 | FSRS: trudność |
| `elapsed_days` | int | TAK | 0 | Dni od ostatniej powtórki |
| `scheduled_days` | int | TAK | 0 | Zaplanowany interwał |
| `reps` | int | TAK | 0 | Liczba powtórek |
| `lapses` | int | TAK | 0 | Liczba zapomień |
| `state` | text | TAK | 'new' | 'new' / 'learning' / 'review' / 'relearning' |
| `next_review` | timestamptz | TAK | — | Kiedy następna powtórka |
| `times_answered` | int | TAK | 0 | Ile razy odpowiadano |
| `times_correct` | int | TAK | 0 | Ile razy poprawnie |
| `correct_streak` | int | TAK | 0 | Seria poprawnych z rzędu |
| `wrong_streak` | int | TAK | 0 | Seria błędnych z rzędu |
| `is_leech` | bool | TAK | false | Czy to "pijawka" (≥3 błędy z rzędu) |
| `leech_count` | int | TAK | 0 | Ile razy oznaczono jako leech |

**Unique constraint**: `(user_id, question_id)` — jeden rekord per pytanie per user.

---

### 2.8 Pozostałe tabele (skrót)

| Tabela | Rola | Główne kolumny |
|--------|------|----------------|
| `learning_events` | Log zdarzeń ANTARES | user_id, event_type, payload (jsonb) |
| `topic_mastery_cache` | Cache opanowania tematu | user_id, topic_id, mastery_score, weakness_rank, trend |
| `achievements` | Definicje osiągnięć (12 wierszy) | id, name, description, target_value, xp_reward |
| `user_achievements` | Postęp osiągnięć per user | user_id, achievement_id, progress, unlocked |
| `daily_challenges` | Wyzwania dzienne | subject_id, challenge_date, target_questions |
| `user_challenge_progress` | Postęp wyzwań per user | user_id, challenge_id, completed |
| `osce_simulations` | Symulacje OSCE | user_id, exam_day, total_score_percent, passed |
| `osce_station_results` | Wyniki stacji OSCE | simulation_id, subject_id, score_percent, passed |
| `question_discussions` | Dyskusje pod pytaniami | question_id, user_id, content, upvotes |
| `opg_atlas_images` | Atlasy OPG (1 wiersz) | atlas_id, image_url |
| `opg_structures` | Struktury na panoramie (30 wierszy) | atlas_id, structure_number, name_pl, pos_x_pct, pos_y_pct |

---

## 3. Hierarchia treści

```
SUBJECTS (33 wiersze)
  │
  ├── KNNP × stomatologia (rok 1, 2, 3)
  │    Przykłady: Anatomia, Biofizyka, Biochemia, Histologia...
  │
  ├── KNNP × lekarski (rok 1, 2, 3)
  │    Przykłady: Anatomia, Biofizyka, Biochemia, Histologia...
  │
  └── OSCE (exam_day = 1 lub 2)
       Stacje egzaminu praktycznego

TOPICS (26 wierszy) — tematy w ramach przedmiotu
  │
  Przykład: Anatomia → "Kości czaszki", "Mięśnie głowy", "Unaczynienie"

QUESTIONS (95 wierszy) — pytania w ramach tematu
  │
  Przykład: "Kości czaszki" → "Ile kości tworzy czaszkę mózgową?"
```

### Konwencja ID

```
Subjects:  {skrót}-{rok}-{track}        → "anatomia-1-stom"
Topics:    {subject_id}-{skrót-tematu}   → "anatomia-1-stom-kości"
Questions: {topic_id}-q{NNN}             → "anatomia-1-stom-kości-q001"
```

### Jak znaleźć pytania dla danego przedmiotu

```sql
-- Wszystkie pytania z Anatomii, rok 1, stomatologia:
SELECT q.*
FROM questions q
JOIN topics t ON q.topic_id = t.id
JOIN subjects s ON t.subject_id = s.id
WHERE s.id = 'anatomia-1-stom'
  AND q.is_active = true
ORDER BY t.display_order, q.id;
```

---

## 4. Manual: Jak dodawać pytania

### 4.1 Krok po kroku (Supabase Dashboard)

#### Krok 1: Upewnij się, że temat istnieje

Idź do: **Table Editor → topics**

Znajdź temat, do którego chcesz dodać pytanie. Jeśli nie istnieje:

```sql
INSERT INTO topics (id, subject_id, name, display_order, question_count)
VALUES (
  'biochemia-1-stom-aminokwasy',     -- id (tekst, bez spacji, kebab-case)
  'biochemia-1-stom',                 -- subject_id (musi istnieć w subjects)
  'Aminokwasy i peptydy',            -- name (widoczna dla użytkownika)
  1,                                   -- display_order
  0                                    -- question_count (zaktualizuj po dodaniu pytań)
);
```

#### Krok 2: Dodaj pytanie

Idź do: **Table Editor → questions → Insert Row**

Lub użyj SQL:

```sql
INSERT INTO questions (
  id, topic_id, text, options, correct_option_id, explanation,
  difficulty, source_exam, is_active, question_type
) VALUES (
  'biochemia-1-stom-aminokwasy-q001',
  'biochemia-1-stom-aminokwasy',
  'Który z poniższych aminokwasów jest aminokwasem egzogennym (niezbędnym)?',
  '[
    {"id": "a", "text": "Alanina"},
    {"id": "b", "text": "Leucyna"},
    {"id": "c", "text": "Kwas glutaminowy"},
    {"id": "d", "text": "Seryna"}
  ]'::jsonb,
  'b',
  'Leucyna jest jednym z 9 aminokwasów egzogennych (niezbędnych), których organizm nie jest w stanie syntetyzować samodzielnie.

**Aminokwasy egzogenne** to: His, Ile, Leu, Lys, Met, Phe, Thr, Trp, Val.

Zapamiętaj mnemonik: **„Fachowy Lit Wie, Że Metylowanie To Trudna Historia"**

| Skrót | Aminokwas |
|-------|-----------|
| Phe   | Fenyloalanina |
| Leu   | Leucyna |
| Val   | Walina |
| Lys   | Lizyna |
| Met   | Metionina |
| Thr   | Treonina |
| Trp   | Tryptofan |
| His   | Histydyna |
| Ile   | Izoleucyna |',
  'srednie',
  'LDEK 2024 wiosna',
  true,
  'single_choice'
);
```

#### Krok 3: Zaktualizuj question_count w temacie

```sql
UPDATE topics
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE topic_id = 'biochemia-1-stom-aminokwasy' AND is_active = true
)
WHERE id = 'biochemia-1-stom-aminokwasy';
```

### 4.2 Dodawanie wielu pytań naraz (batch)

```sql
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty, question_type) VALUES
('topic-q001', 'topic-id', 'Treść pytania 1?', '[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]'::jsonb, 'b', 'Wyjaśnienie 1', 'latwe', 'single_choice'),
('topic-q002', 'topic-id', 'Treść pytania 2?', '[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]'::jsonb, 'c', 'Wyjaśnienie 2', 'srednie', 'single_choice'),
('topic-q003', 'topic-id', 'Treść pytania 3?', '[{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}]'::jsonb, 'a', 'Wyjaśnienie 3', 'trudne', 'single_choice');
```

### 4.3 Checklist — zanim klikniesz "Save"

- [ ] `id` jest unikalny i w formacie `{topic_id}-q{NNN}`
- [ ] `topic_id` wskazuje na istniejący temat
- [ ] `text` — treść pytania jest jasna i jednoznaczna
- [ ] `options` — minimum 4 opcje, każda ma `id` i `text`
- [ ] `correct_option_id` — zgadza się z jednym z `id` w options
- [ ] `explanation` — jest wypełnione, zawiera wyjaśnienie poprawnej odpowiedzi
- [ ] `difficulty` — to jeden z: `latwe`, `srednie`, `trudne`
- [ ] `is_active` = `true`
- [ ] `question_type` = `single_choice` (chyba że OSCE)
- [ ] Po dodaniu → zaktualizuj `question_count` w topics

---

## 5. Formatowanie wyjaśnień (Markdown)

Pole `explanation` w tabeli `questions` renderuje się przez `react-markdown`. Obsługuje pełny Markdown.

### Co możesz użyć:

#### Pogrubienie i kursywa

```markdown
**Ważne pojęcie** — pogrubienie
*Dodatkowa informacja* — kursywa
***Bardzo ważne*** — pogrubienie + kursywa
```

#### Listy

```markdown
Aminokwasy egzogenne:
- Histydyna
- Izoleucyna
- Leucyna

Kolejność etapów:
1. Inicjacja
2. Elongacja
3. Terminacja
```

#### Tabele

```markdown
| Enzym | Funkcja | Lokalizacja |
|-------|---------|-------------|
| Amylaza | Trawienie skrobi | Jama ustna, trzustka |
| Pepsyna | Trawienie białek | Żołądek |
| Lipaza | Trawienie tłuszczów | Trzustka |
```

#### Nagłówki (w ramach wyjaśnienia)

```markdown
## Mechanizm działania

Tekst wyjaśnienia...

## Znaczenie kliniczne

Tekst...
```

#### Kod / wzory chemiczne

```markdown
Wzór sumaryczny glukozy: `C₆H₁₂O₆`

Reakcja: `ATP → ADP + Pi + energia`
```

#### Wyróżnienia

```markdown
> 💡 **Wskazówka kliniczna**: Niedobór witaminy B12 prowadzi do anemii megaloblastycznej.
```

### Pełny przykład wyjaśnienia

```markdown
Leucyna jest aminokwasem egzogennym — organizm **nie potrafi** jej zsyntetyzować samodzielnie i musi ją pozyskiwać z diety.

## Aminokwasy egzogenne (niezbędne)

Jest ich **9** u dorosłych:

| Skrót | Nazwa | Grupa |
|-------|-------|-------|
| His | Histydyna | Zasadowy |
| Ile | Izoleucyna | BCAA |
| **Leu** | **Leucyna** | **BCAA** |
| Lys | Lizyna | Zasadowy |
| Met | Metionina | Siarkowy |
| Phe | Fenyloalanina | Aromatyczny |
| Thr | Treonina | Hydroksylowy |
| Trp | Tryptofan | Aromatyczny |
| Val | Walina | BCAA |

> 💡 **Mnemonik**: **„Fachowy Lit Wie, Że Metylowanie To Trudna Historia"**
> (Phe, Leu, Val, Lys, Met, Thr, Trp, His, Ile)

## Dlaczego nie pozostałe opcje?

- **Alanina** — aminokwas endogenny, syntetyzowany z pirogronianu
- **Kwas glutaminowy** — endogenny, kluczowy w transaminacji
- **Seryna** — endogenny, powstaje z 3-fosfoglicerynianu

## Znaczenie kliniczne

Leucyna jest najsilniejszym stymulatorem szlaku **mTOR**, co ma znaczenie w:
1. Regulacji syntezy białek mięśniowych
2. Terapii żywieniowej pacjentów z sarkopenią
3. Suplementacji sportowej (BCAA)
```

---

## 6. Manual: Jak naprawiać pytania

### 6.1 Znajdź pytanie

**W Supabase Dashboard:** Table Editor → questions → użyj filtrów:
- Szukaj po `id` jeśli znasz
- Filtruj po `topic_id` żeby zobaczyć wszystkie pytania z tematu
- Filtruj po `is_active = true` żeby widzieć tylko aktywne

**Albo SQL:**
```sql
-- Szukaj po fragmencie tekstu:
SELECT id, text, correct_option_id, difficulty
FROM questions
WHERE text ILIKE '%leucyna%';

-- Szukaj po ID:
SELECT * FROM questions WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

### 6.2 Napraw treść pytania

```sql
UPDATE questions
SET text = 'Poprawiona treść pytania?'
WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

### 6.3 Napraw opcje odpowiedzi

```sql
UPDATE questions
SET options = '[
  {"id": "a", "text": "Poprawiona opcja A"},
  {"id": "b", "text": "Poprawiona opcja B"},
  {"id": "c", "text": "Poprawiona opcja C"},
  {"id": "d", "text": "Poprawiona opcja D"}
]'::jsonb
WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

### 6.4 Zmień poprawną odpowiedź

```sql
UPDATE questions
SET correct_option_id = 'c'  -- zmień na poprawny ID
WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

### 6.5 Napraw wyjaśnienie

```sql
UPDATE questions
SET explanation = 'Nowe, poprawione wyjaśnienie z **markdownem** i tabelami.

| Kolumna 1 | Kolumna 2 |
|-----------|-----------|
| Wartość   | Opis      |'
WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

### 6.6 Dezaktywuj wadliwe pytanie (zamiast usuwać!)

**Nigdy nie usuwaj pytań** — mógłby się zepsuć postęp użytkowników. Zamiast tego:

```sql
UPDATE questions
SET is_active = false
WHERE id = 'biochemia-1-stom-aminokwasy-q001';
```

Pytanie zniknie z puli, ale dane historyczne (odpowiedzi, postęp FSRS) zostają nienaruszone.

### 6.7 Resetowanie postępu po naprawie

Jeśli pytanie było błędne i użytkownicy na nim stracili punkty, możesz wyczyścić ich postęp na tym pytaniu:

```sql
-- Usuń postęp FSRS dla jednego pytania (wszystkich userów):
DELETE FROM user_question_progress
WHERE question_id = 'biochemia-1-stom-aminokwasy-q001';
```

⚠️ **Uwaga**: to jest operacja destrukcyjna. Używaj ostrożnie.

### 6.8 Najczęstsze błędy i jak je naprawić

| Problem | Diagnoza | Rozwiązanie |
|---------|----------|-------------|
| Pytanie nie wyświetla się | `is_active = false` lub brak `topic_id` | Sprawdź i popraw |
| Żadna odpowiedź nie jest poprawna | `correct_option_id` nie pasuje do `options` | Porównaj ID opcji z correct_option_id |
| Wyjaśnienie nie renderuje się | Błąd Markdown (np. niezamknięta tabela) | Sprawdź składnię MD |
| Pytanie pojawia się podwójnie | Duplikat ID | Znajdź i usuń duplikat |
| Zły przedmiot | Błędny `topic_id` | UPDATE topic_id na poprawny |
| Obrazek nie ładuje się | Błędny `image_url` | Sprawdź URL, re-upload |

### 6.9 Weryfikacja spójności danych

```sql
-- Pytania z brakującym tematem:
SELECT q.id, q.topic_id
FROM questions q
LEFT JOIN topics t ON q.topic_id = t.id
WHERE t.id IS NULL;

-- Tematy z zerowym question_count ale z pytaniami:
SELECT t.id, t.question_count,
  (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.is_active = true) AS actual
FROM topics t
WHERE t.question_count != (SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id AND q.is_active = true);

-- Pytania z opcjami, w których nie ma correct_option_id:
SELECT q.id, q.correct_option_id, q.options
FROM questions q
WHERE NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(q.options) opt
  WHERE opt->>'id' = q.correct_option_id
);
```

---

## 7. Bezpieczeństwo (RLS)

RLS jest włączony na **wszystkich** tabelach. Podsumowanie reguł:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | own (uid=id) | trigger only | own | — |
| `subjects` | all authenticated | — | — | — |
| `topics` | all authenticated | — | — | — |
| `questions` | all authenticated | — | — | — |
| `achievements` | all authenticated | — | — | — |
| `study_sessions` | own | own | own | — |
| `session_answers` | own (via session) | own (via session) | own (via session) | — |
| `user_question_progress` | own | own | own | — |
| `learning_events` | own | own | own | — |
| `topic_mastery_cache` | own | own | own | — |
| `user_achievements` | own | own | own | — |
| `osce_simulations` | own | own | own | — |
| `osce_station_results` | own (via simulation) | own (via simulation) | — | — |
| `question_discussions` | all authenticated | own | own | — |
| `opg_atlas_images` | all authenticated | — | — | — |
| `opg_structures` | all authenticated | — | — | — |

**"own"** = `auth.uid() = user_id`
**"own (via session/simulation)"** = subquery sprawdza czy parent należy do usera

**Jak dodawać/edytować pytania jako admin?** Użyj `SUPABASE_SERVICE_ROLE_KEY` (w server actions) — pomija RLS. Dashboard Supabase też pomija RLS.

---

## 8. Funkcje i triggery

| Nazwa | Typ | Opis |
|-------|-----|------|
| `handle_new_user()` | FUNCTION → trigger | Po INSERT na auth.users tworzy wiersz w profiles z display_name i avatar_initials |
| `reset_subject_progress()` | FUNCTION → void | Resetuje postęp użytkownika dla danego przedmiotu |

Brak dodatkowych triggerów — logika biznesowa jest w Next.js server actions.

---

## 9. Indexy

Poza primary keys, kluczowe indexy:

| Index | Tabela | Kolumny | Cel |
|-------|--------|---------|-----|
| `idx_questions_topic` | questions | topic_id | Szybkie filtrowanie po temacie |
| `idx_questions_difficulty` | questions | difficulty | Filtrowanie po trudności |
| `idx_questions_type` | questions | question_type | Filtrowanie po typie |
| `idx_uqp_next_review` | user_question_progress | (user_id, next_review) | Znajdowanie pytań do powtórki |
| `idx_uqp_leech` | user_question_progress | (user_id, is_leech) WHERE is_leech=true | Szybkie znajdowanie pijawek |
| `idx_uqp_state` | user_question_progress | (user_id, state) | Filtrowanie po stanie FSRS |
| `idx_le_user_time` | learning_events | (user_id, created_at DESC) | Historia zdarzeń |
| `idx_tmc_weakness` | topic_mastery_cache | (user_id, mastery_score) | Ranking słabych tematów |
| `idx_session_answers_session` | session_answers | session_id | Odpowiedzi z sesji |
| `idx_subjects_product` | subjects | product | KNNP vs OSCE |
| `idx_opg_atlas_number` | opg_structures | (atlas_id, structure_number) UNIQUE | Unikalność struktury w atlasie |

---

## 10. Statystyki bazy (stan na kwiecień 2026)

| Tabela | Wierszy | Komentarz |
|--------|---------|-----------|
| session_answers | 235 | Odpowiedzi |
| learning_events | 184 | Zdarzenia ANTARES |
| user_question_progress | 108 | Postęp FSRS |
| questions | 95 | Pytania |
| study_sessions | 40 | Sesje nauki |
| subjects | 33 | Przedmioty |
| opg_structures | 30 | Struktury OPG |
| topics | 26 | Tematy |
| achievements | 12 | Osiągnięcia |
| profiles | 2 | Użytkownicy |
| opg_atlas_images | 1 | Atlas OPG |
| question_discussions | 1 | Dyskusje |

Tabele z 0 wierszy: osce_station_results, topic_mastery_cache, daily_challenges, user_challenge_progress, user_achievements, osce_simulations.
