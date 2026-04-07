# Format pytań — Kurs na LDEK / KNNP
## Instrukcja dodawania pytań do Supabase

---

## 1. STRUKTURA BAZY

Tabela `questions` w Supabase:

| Kolumna           | Typ     | Wymagane | Opis                                              |
|-------------------|---------|----------|----------------------------------------------------|
| id                | TEXT    | TAK      | Unikalny identyfikator (np. bio-etc-001)           |
| topic_id          | TEXT    | TAK      | ID tematu z tabeli topics (np. BIO-ETC)            |
| text              | TEXT    | TAK      | Treść pytania                                      |
| options           | JSONB   | TAK      | Tablica opcji [{id, text}, ...]                   |
| correct_option_id | TEXT    | TAK      | ID poprawnej opcji (a/b/c/d/e)                    |
| explanation       | TEXT    | TAK      | Wyjaśnienie poprawnej odpowiedzi                   |
| difficulty        | TEXT    | NIE      | latwe / srednie / trudne (domyślnie: srednie)      |
| source_exam       | TEXT    | NIE      | Źródło egzaminu (np. LDEK 2023 Jesień)            |
| source_code       | TEXT    | NIE      | Kod pytania (np. LDEK-2023-J-42)                  |
| image_url         | TEXT    | NIE      | URL do obrazka klinicznego                         |
| is_active         | BOOLEAN | NIE      | Czy pytanie jest aktywne (domyślnie: true)         |

---

## 2. KONWENCJA NAZEWNICTWA ID

### Tematy (topic_id):
Format: {PRZEDMIOT}-{SKRÓT_TEMATU}

Przykłady:
  BIO-AA      → Biochemia: Aminokwasy i białka
  BIO-ETC     → Biochemia: Łańcuch oddechowy
  BIO-MET     → Biochemia: Metabolizm węglowodanów
  ANA-CZA     → Anatomia: Czaszka i kości twarzoczaszki
  ANA-NER     → Anatomia: Nerwy czaszkowe
  HIS-TKN     → Histologia: Tkanki
  FIZ-KRA     → Fizjologia: Krążenie
  FAR-ANT     → Farmakologia: Antybiotyki
  MIK-BAK     → Mikrobiologia: Bakteriologia
  PAT-ZAP     → Patofizjologia: Zapalenie
  CHE-ORG     → Chemia: Chemia organiczna
  BIO-BIO     → Biofizyka: Biofizyka promieniowania

### Pytania (id):
Format: {przedmiot}-{temat}-{numer}

Przykłady:
  bio-etc-001     → Biochemia, łańcuch oddechowy, pytanie 1
  bio-etc-002     → Biochemia, łańcuch oddechowy, pytanie 2
  ana-cza-001     → Anatomia, czaszka, pytanie 1
  fiz-kra-015     → Fizjologia, krążenie, pytanie 15
  far-ant-003     → Farmakologia, antybiotyki, pytanie 3

Numeracja: 001, 002, ... 999 (trzycyfrowa, z zerami wiodącymi)

---

## 3. SZABLON SQL (kopiuj-wklej do Supabase SQL Editor)

### Dodawanie nowego tematu:

```sql
INSERT INTO topics (id, subject_id, name, display_order, question_count)
VALUES ('BIO-LIP', 'biochemia', 'Metabolizm lipidów', 4, 0);
-- question_count zaktualizuj po dodaniu pytań
```

### Dodawanie pojedynczego pytania:

```sql
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty, source_exam, source_code)
VALUES (
  'bio-lip-001',
  'BIO-LIP',
  'Treść pytania tutaj. Które stwierdzenie dotyczące beta-oksydacji kwasów tłuszczowych jest PRAWDZIWE?',
  '[
    {"id": "a", "text": "Zachodzi w cytoplazmie"},
    {"id": "b", "text": "Wymaga karnityno jako przenośnika przez wewnętrzną błonę mitochondrialną"},
    {"id": "c", "text": "Produkuje NADPH"},
    {"id": "d", "text": "Zachodzi wyłącznie w warunkach beztlenowych"},
    {"id": "e", "text": "Nie wymaga aktywacji kwasu tłuszczowego"}
  ]',
  'b',
  'Beta-oksydacja zachodzi w matrix mitochondrialnej. Długołańcuchowe kwasy tłuszczowe (>12C) wymagają układu karnitynowego (CPT-I, translokaza, CPT-II) do transportu przez wewnętrzną błonę mitochondrialną. CPT-I (na zewnętrznej błonie) jest enzymem regulatorowym — hamowanym przez malonylo-CoA (produkt ACC, pierwszy krok syntezy kwasów tłuszczowych). To zapobiega jednoczesnej syntezie i degradacji kwasów tłuszczowych.',
  'srednie',
  NULL,
  NULL
);
```

### Dodawanie wielu pytań naraz (batch):

```sql
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty) VALUES

('bio-lip-001', 'BIO-LIP',
 'Pytanie 1 tutaj?',
 '[{"id":"a","text":"Opcja A"},{"id":"b","text":"Opcja B"},{"id":"c","text":"Opcja C"},{"id":"d","text":"Opcja D"},{"id":"e","text":"Opcja E"}]',
 'b',
 'Wyjaśnienie pytania 1.',
 'srednie'),

('bio-lip-002', 'BIO-LIP',
 'Pytanie 2 tutaj?',
 '[{"id":"a","text":"Opcja A"},{"id":"b","text":"Opcja B"},{"id":"c","text":"Opcja C"},{"id":"d","text":"Opcja D"},{"id":"e","text":"Opcja E"}]',
 'c',
 'Wyjaśnienie pytania 2.',
 'latwe'),

('bio-lip-003', 'BIO-LIP',
 'Pytanie 3 tutaj?',
 '[{"id":"a","text":"Opcja A"},{"id":"b","text":"Opcja B"},{"id":"c","text":"Opcja C"},{"id":"d","text":"Opcja D"},{"id":"e","text":"Opcja E"}]',
 'a',
 'Wyjaśnienie pytania 3.',
 'trudne');

-- WAŻNE: ostatnie pytanie BEZ przecinka na końcu!
```

### Po dodaniu pytań — zaktualizuj licznik:

```sql
UPDATE topics SET question_count = (
  SELECT COUNT(*) FROM questions WHERE topic_id = 'BIO-LIP'
) WHERE id = 'BIO-LIP';
```

Albo zaktualizuj WSZYSTKIE tematy naraz:

```sql
UPDATE topics t SET question_count = (
  SELECT COUNT(*) FROM questions q WHERE q.topic_id = t.id
);
```

---

## 4. SZABLON CSV (do masowego importu)

Jeśli masz pytania w Excelu / Google Sheets, użyj tego formatu:

```csv
id,topic_id,text,option_a,option_b,option_c,option_d,option_e,correct,explanation,difficulty,source_exam,source_code
bio-lip-001,BIO-LIP,"Które stwierdzenie dotyczące beta-oksydacji jest prawdziwe?","Zachodzi w cytoplazmie","Wymaga karnityny","Produkuje NADPH","Zachodzi beztlenowo","Nie wymaga aktywacji","b","Beta-oksydacja zachodzi w matrix mitochondrialnej...","srednie","",""
bio-lip-002,BIO-LIP,"Drugi przykład pytania?","Opcja A","Opcja B","Opcja C","Opcja D","Opcja E","c","Wyjaśnienie...","latwe","",""
```

### Skrypt konwersji CSV → SQL:

Wklej do Cursora jako prompt:

> Napisz skrypt TypeScript (scripts/csv-to-sql.ts) który:
> 1. Czyta plik CSV z pytaniami (format: id, topic_id, text, option_a-e, correct, explanation, difficulty, source_exam, source_code)
> 2. Generuje plik .sql z INSERT INTO statements
> 3. Escapuje apostrofy w tekście (zamienia ' na '')
> 4. Formatuje options jako JSONB array
> 5. Uruchomienie: npx tsx scripts/csv-to-sql.ts input.csv output.sql

---

## 5. KONWERSJA Z FORMATU .ts (Valkyria) DO SQL

Twoje obecne pytania w formacie TypeScript:

```typescript
{
  id: 'egz24-024',
  text: 'Wskaż zdanie NIEPRAWDZIWE...',
  options: [
    { id: 'a', text: 'Opcja A' },
    { id: 'b', text: 'Opcja B' },
    ...
  ],
  correctOptionId: 'a',
  explanation: '...',
  topic: 'S4-ETC'
}
```

### Skrypt migracji (wklej do Cursora):

> Napisz skrypt TypeScript (scripts/migrate-ts-questions.ts) który:
> 1. Importuje wszystkie pliki z pytaniami z katalogu data/ (lub podaj ścieżkę)
> 2. Mapuje topic z formatu Valkyrii (np. 'S4-ETC') na nowy topic_id (np. 'BIO-ETC')
> 3. Generuje SQL INSERT statements
> 4. Obsługuje escapowanie znaków specjalnych w tekście i wyjaśnieniach
> 5. Usuwa emoji z wyjaśnień (❌, ⚠️, 🔑, 💡, etc.) — zamienia na tekst
> 6. Zamienia markdown w wyjaśnieniach (tabele, backticki) na czysty tekst
> 7. Wynik zapisuje do scripts/migrated-questions.sql

Mapowanie tematów (dostosuj do swoich danych):
```typescript
const TOPIC_MAP: Record<string, string> = {
  'S1-BIO': 'BIO-AA',       // lub inny temat biochemii
  'S4-ETC': 'BIO-ETC',
  'S2-ENZ': 'BIO-ENZ',
  // ... dodaj resztę
}
```

---

## 6. ZASADY PISANIA DOBRYCH PYTAŃ

### Treść pytania:
- Jedno jasne pytanie, nie zagnieżdżone
- Unikaj podwójnych negacji ("Które NIE jest NIEPRAWDZIWE")
- Jeśli pytanie jest o wyjątek: "Wskaż stwierdzenie FAŁSZYWE" / "Które NIE jest prawdziwe"
- Zapisuj pełne nazwy z polskimi znakami (β-oksydacja, α-helisa, łańcuch oddechowy)

### Opcje odpowiedzi:
- Zawsze 5 opcji (A-E)
- Wszystkie opcje powinny być wiarygodne (żadnych absurdalnych dystraktorów)
- Opcje o zbliżonej długości (żeby najdłuższa nie była "oczywistą" odpowiedzią)
- Kolejność: logiczna (np. od najmniejszego do największego) lub losowa

### Wyjaśnienie:
- ZAWSZE wyjaśnij DLACZEGO poprawna odpowiedź jest poprawna
- Wyjaśnij DLACZEGO główne dystraktory są błędne
- Dodaj kontekst kliniczny jeśli możliwy
- Dodaj mnemoniki jeśli pomagają (np. "LL = Leucyna + Lizyna = Lipidy")
- Długość: 2-5 zdań minimum. Lepiej za dużo niż za mało.
- Używaj polskich terminów medycznych z łacińskimi odpowiednikami w nawiasach

### Trudność:
- **latwe**: definicje, podstawowe fakty, "co to jest X"
- **srednie**: zastosowanie wiedzy, porównania, mechanizmy
- **trudne**: integracja wiedzy z kilku tematów, nietypowe przypadki, pułapki

### Source exam (opcjonalnie):
- Jeśli pytanie pochodzi z prawdziwego egzaminu: "LDEK 2023 Jesień", "LDEK 2024 Wiosna"
- Jeśli autorskie: zostaw NULL

---

## 7. PRZYKŁAD KOMPLETNEGO BATCHU (gotowy do wklejenia)

```sql
-- ============================================
-- BIOCHEMIA: Metabolizm lipidów (BIO-LIP)
-- Autor: [Twoje imię], Data: 2026-04-06
-- ============================================

-- Upewnij się że temat istnieje:
INSERT INTO topics (id, subject_id, name, display_order, question_count)
VALUES ('BIO-LIP', 'biochemia', 'Metabolizm lipidów', 4, 3)
ON CONFLICT (id) DO UPDATE SET question_count = 3;

-- Pytania:
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty) VALUES

('bio-lip-001', 'BIO-LIP',
 'Które stwierdzenie dotyczące beta-oksydacji kwasów tłuszczowych jest PRAWDZIWE?',
 '[{"id":"a","text":"Zachodzi w cytoplazmie komórki"},{"id":"b","text":"Wymaga układu karnitynowego do transportu długołańcuchowych kwasów tłuszczowych do matrix mitochondrialnej"},{"id":"c","text":"Produkuje NADPH jako główny koenzym redukujący"},{"id":"d","text":"Zachodzi wyłącznie w warunkach beztlenowych"},{"id":"e","text":"Nie wymaga uprzedniej aktywacji kwasu tłuszczowego do acylo-CoA"}]',
 'b',
 'Beta-oksydacja zachodzi w matrix mitochondrialnej i wymaga transportu acylo-CoA przez wewnętrzną błonę mitochondrialną za pomocą układu karnitynowego (CPT-I → translokaza karnitynowa → CPT-II). CPT-I jest enzymem regulatorowym, hamowanym allosterycznie przez malonylo-CoA — pierwszy produkt syntezy kwasów tłuszczowych. To mechanizm zapobiegający jednoczesnej syntezie i degradacji kwasów tłuszczowych. Kwasy tłuszczowe krótko- i średniołańcuchowe (<12C) mogą wchodzić do mitochondrium bez karnityny.',
 'srednie'),

('bio-lip-002', 'BIO-LIP',
 'Jaki jest końcowy produkt jednego cyklu beta-oksydacji kwasu tłuszczowego?',
 '[{"id":"a","text":"1 acetylo-CoA + 1 FADH₂ + 1 NADH"},{"id":"b","text":"1 acetylo-CoA + 1 NADPH + 1 FADH₂"},{"id":"c","text":"2 acetylo-CoA + 1 FADH₂"},{"id":"d","text":"1 acetylo-CoA + 2 NADH"},{"id":"e","text":"1 pirogronian + 1 FADH₂ + 1 NADH"}]',
 'a',
 'Jeden cykl beta-oksydacji obejmuje 4 reakcje: utlenienie (FAD→FADH₂), hydratację, utlenienie (NAD⁺→NADH), tiolizę (odcięcie acetylo-CoA). Produkty jednego cyklu to: 1 acetylo-CoA (2C) + 1 FADH₂ + 1 NADH + skrócony acylo-CoA (o 2C krótszy). Dla kwasu palmitynowego (16C): 7 cykli → 8 acetylo-CoA + 7 FADH₂ + 7 NADH.',
 'srednie'),

('bio-lip-003', 'BIO-LIP',
 'Malonylo-CoA jest inhibitorem którego enzymu?',
 '[{"id":"a","text":"Lipazy hormonowrażliwej (HSL)"},{"id":"b","text":"Karnitynopalmitylotransferazy I (CPT-I)"},{"id":"c","text":"Acylo-CoA dehydrogenazy"},{"id":"d","text":"Tiolazy (beta-ketotiolazy)"},{"id":"e","text":"Syntazy kwasów tłuszczowych (FAS)"}]',
 'b',
 'Malonylo-CoA (produkt karboksylazy acetylo-CoA, ACC) hamuje CPT-I — enzym na zewnętrznej błonie mitochondrialnej odpowiedzialny za przeniesienie grupy acylowej na karnitynę. Gdy ACC jest aktywna (stan dobrze odżywiony, wysoka insulina), malonylo-CoA blokuje wejście kwasów tłuszczowych do mitochondrium, zapobiegając ich beta-oksydacji. To elegancki mechanizm koordynacji: synteza kwasów tłuszczowych (cytoplazma) i ich degradacja (mitochondrium) nigdy nie zachodzą jednocześnie.',
 'trudne');
```

---

## 8. CHECKLISTKA PRZED WKLEJENIEM DO SUPABASE

Przed kliknięciem "Run" w SQL Editor, sprawdź:

- [ ] Każde pytanie ma unikalne `id` (nie powtarza się z istniejącymi)
- [ ] `topic_id` istnieje w tabeli `topics` (inaczej INSERT się nie powiedzie — foreign key)
- [ ] `correct_option_id` to jedno z: a, b, c, d, e
- [ ] `options` to poprawny JSON: zaczyna się od `[`, kończy na `]`, każdy obiekt ma `"id"` i `"text"`
- [ ] Apostrofy w tekście są podwojone: `it''s` zamiast `it's` (SQL escaping)
- [ ] Polskie znaki są prawidłowe (ą, ę, ć, ś, ź, ż, ó, ł, ń)
- [ ] Ostatni INSERT w batchu NIE ma przecinka na końcu (przed średnikiem)
- [ ] `difficulty` to jedno z: latwe, srednie, trudne (bez polskich znaków — tak jest w schemacie)
- [ ] Po dodaniu pytań: zaktualizuj `question_count` w tabeli `topics`