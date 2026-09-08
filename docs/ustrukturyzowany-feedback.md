# Ustrukturyzowany feedback — stan na 2026-09-05

Briefing dla decyzji redakcyjnej / produktowej. To nie jest specyfikacja „jak ma być”. To jest **co już jest zbudowane**, jak student to widzi i gdzie są dziury.

Produkt: Kurs na LDEK (Next.js, Supabase). Przedmiotem jest feedback po odpowiedzi na pytanie A–E.

---

## 1. Dwie warstwy wyjaśnienia

Każde pytanie ma (albo może mieć) dwa niezależne pola:

| Pole | Typ | Wymagane | Rola |
|---|---|---|---|
| `questions.explanation` | TEXT NOT NULL | tak (puste = `''`) | klasyczny markdown, jeden kawałek prozy |
| `questions.explanation_blocks` | JSONB, nullable | nie | trzy bloki pod adaptive feedback |

Na produkcji (stan z matrycy produktu):

- `explanation` niepuste: **17 522**
- `explanation` puste: **1 363**
- `explanation_blocks` nie-NULL: **0**

Kolumna i UI admina są gotowe. Treści w blokach nie ma. Student na prod nigdy nie widział ustrukturyzowanego feedbacku.

---

## 2. Schema bloków

```ts
type StructuredExplanation = {
  takeaway: string;       // ≤ 2000
  correctReason: string;  // ≤ 8000
  distractors: Record<string, string>; // klucz = option.id (a–e), wartość ≤ 2000
};
```

Constraint w Postgresie (`questions_explanation_blocks_chk`): obiekt albo NULL; każde z trzech pól opcjonalne, ale jeśli jest — właściwy typ.

Normalizacja przy odczycie (`structuredExplanation.ts`):

- trim, obcięcie długości
- klucze dystraktorów → małe litery
- puste stringi wylatują
- jeśli wszystko puste → `null`

Klucze w `distractors` to **stabilne `id` opcji** (`a`/`b`/…), nie litera, którą student widzi po tasowaniu. Tekst **nie może** mówić „opcja C” — tasowanie zrobi z tego kłamstwo. Trzeba pisać o treści wariantu.

`explanation` zostaje. Bloki są dodatkiem, nie zastępstwem.

---

## 3. Gdzie to jest podpięte

```
Admin (edytor pytania)
  MarkdownExplanationEditor  →  explanation
  AdminStructuredExplanationFields  →  explanation_blocks
        ↓
  adminActions.ts (Zod)  →  questions
        ↓
  loadery sesji + mapSessionQuestion
        ↓
  FeedbackPanel  (tylko sesja nauki / przegląd)
```

Admin: pod klasycznym edytorem markdown jest sekcja **„Ustrukturyzowany feedback”** z hintem *„Pola są opcjonalne. Zwykłe wyjaśnienie pozostaje fallbackiem.”*

Pola w adminie:

1. **Reguła „Zapamiętaj”** → `takeaway`  
   placeholder: *„Jedno zdanie, które warto odtworzyć na egzaminie.”*
2. **Dlaczego poprawna odpowiedź jest poprawna** → `correctReason`
3. **Dlaczego dystraktory są błędne** — jeden textarea na każdą opcję **oprócz klucza**, podpisane `A. pierwsze 100 znaków treści`

Katalog pytań (`CatalogView`) **nie czyta bloków**. Pokazuje wyłącznie `explanation`. To ważna dziura: student w katalogu i student w sesji mogą dostać inny tekst, jeśli bloki będą wypełnione, a `explanation` zostanie stare.

Przedmiot `stoma-angielski` ma ukryte wyjaśnienia w UI (`subjectExplanationPolicy`). Bloki też nie wyjdą.

Fabryka pytań (`ldek-fabryka`) i eksport SQL (`ldek-eksport` / `to_sql.py`) **nie znają** `explanation_blocks`. Produkują jeden blok `WYJAŚNIENIE:` → kolumna `explanation`. Jedyna droga do bloków dziś: ręczny wpis w adminie albo UPDATE.

---

## 4. Adaptive feedback — trzy warianty

Wybór wariantu: `selectFeedbackVariant`. Działa **tylko** gdy sesja jest w treatment eksperymentu `adaptive-feedback-v1`.

Stan eksperymentu na prod: `active = false`, `rollout_percent = 0`.  
Skutek: **każdy student, zawsze, dostaje wariant `standard`.**

Gdy flaga będzie włączona:

| Wariant | Warunek | Co idzie na ekran z bloków |
|---|---|---|
| `concise` | poprawna, nie leech, nie nowe, `R ≥ 0.8`, `priorAccuracy ≥ 0.75`, czas ≤ `max(10, 0.85 × avgTime)` | `takeaway`; `correctReason` schowane pod „Pokaż pełne wyjaśnienie” |
| `standard` | poprawna, ale nie „szybka i pewna” | od razu `correctReason` |
| `remedial` | błąd **albo** leech (także przy dobrej odpowiedzi) | `correctReason` + box tylko dla **wybranego** dystraktora + karta tematu (`topics.knowledge_card`) + ewentualny komunikat o transferze pojęcia |

Fallback przy braku bloku: wszędzie `question.explanation`.

Leech: 3 błędy z rzędu na tym samym pytaniu. Reset po 2 poprawnych. Dlatego poprawna odpowiedź na leechu i tak dostaje `remedial`.

---

## 5. Co student widzi po odpowiedzi

Wspólne dla każdego werdyktu (sesja):

- opcje się blokują
- klucz pulsuje na zielono (`correct`); zła wybrana się trzęsie i jest czerwona (`wrong`); reszta przygasa (`muted`)
- pod kartą pytania wjeżdża `FeedbackPanel`
- na dole: „Jak dobrze znałeś odpowiedź?” — Nie wiedziałem / Trochę / Na pewno (nie w trybie przegląd)

### 5.1 Trafienie — prod dziś (`standard`, bez bloków)

```
✓ Poprawna odpowiedź!                          ← zieleń, CheckCircle
Twoja odpowiedź: C · Poprawna: C

┌─────────────────────────────────────────────┐
│ Wyjaśnienie                                 │  ← font heading
│                                             │
│ { questions.explanation }                   │  ← markdown + KaTeX
└─────────────────────────────────────────────┘
```

`takeaway` i dystraktory nie istnieją w UI. Nagłówek to zawsze „Wyjaśnienie”, nie „Zapamiętaj”.

### 5.2 Trafienie — po wypełnieniu bloków, flaga nadal off

Identyczny layout. Jedyna zmiana: zamiast `explanation` w karcie ląduje `correctReason` (bo `standard` bierze `correctReason || explanation`).

`takeaway` nadal niewidoczny. Dystraktory nadal niewidoczne.

### 5.3 Trafienie — flaga on, student pewny i szybki (`concise`)

```
✓ Poprawna odpowiedź!
Twoja odpowiedź: C · Poprawna: C

┌─────────────────────────────────────────────┐
│ 💡 Zapamiętaj                               │
│ { takeaway }                                │  ← jedno zdanie
│─────────────────────────────────────────────│
│ ▸ Pokaż pełne wyjaśnienie                   │  ← <details>, sage
│     { correctReason }                       │  ← dopiero po rozwinięciu
└─────────────────────────────────────────────┘
```

Żarówka (`Lightbulb`, złoto) tylko w `concise`.  
Accordion „Pokaż pełne wyjaśnienie” pokazuje się **tylko gdy `correctReason` jest wypełnione**. Sam `takeaway` bez `correctReason` = karta bez rozwinięcia.

Dystraktorów brak. Student po dobrym strzale nie dostaje katalogu błędów.

### 5.4 Trafienie na leechu (`remedial`, flaga on)

Zielony werdykt + karta „Wyjaśnienie” z `correctReason`.  
Boxu „Dlaczego ten wybór był mylący” nie ma — wybrał klucz, a klucz nie ma wpisu w `distractors`.  
Może dojść złota karta tematu (`knowledge_card`), jeśli temat ją ma.

### 5.5 Pudło — prod dziś (`standard`, bez bloków)

```
✗ Błędna odpowiedź                             ← czerwień, XCircle
Twoja odpowiedź: B · Poprawna: C

┌─────────────────────────────────────────────┐
│ Wyjaśnienie                                 │
│ { explanation }                             │  ← ten sam tekst co przy trafieniu
└─────────────────────────────────────────────┘
```

Brak boxu „dlaczego B było mylące”. Student dostaje to samo wyjaśnienie niezależnie od tego, w którą opcję wszedł.

### 5.6 Pudło — bloki wypełnione, flaga on (`remedial`)

```
✗ Błędna odpowiedź
Twoja odpowiedź: B · Poprawna: C

┌─────────────────────────────────────────────┐
│ Wyjaśnienie                                 │
│ { correctReason }                           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ DLACZEGO TEN WYBÓR BYŁ MYLĄCY           │ │  ← czerwony box, tylko wybrany id
│ │ { distractors["b"] }                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ KRÓTKA REMEDIACJA                       │ │  ← złoty box, jeśli temat ma kartę
│ │ { topics.knowledge_card }               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ↻ Wkrótce powtórzymy pokrewne pojęcie       │  ← tylko gdy transfer zaplanowany
└─────────────────────────────────────────────┘
```

Student widzi uzasadnienie **tylko swojej** złej opcji. Nie widzi pozostałych dystraktorów. Każdy wpis w `distractors` musi być samowystarczalny.

Jeśli `distractors[wybranyId]` jest puste — czerwonego boxa nie ma. Zostaje sam `correctReason` (albo stary `explanation`).

### 5.7 Czego student nigdy nie widzi

- listy wszystkich dystraktorów naraz
- `takeaway` poza wariantem `concise`
- bloków w katalogu
- liter opcji z bazy (widzi przetasowane A–E z sesji; linia „Twoja odpowiedź: X · Poprawna: Y” używa liter **ekranowych**, nie `id`)

---

## 6. Jak to się pisze (zamysł obecnego kodu)

Ton dziedziczony z fabryki: kolega tłumaczy koledze. Zero „według skryptu / w materiale”. Zero liter opcji. `**termin**`, `*łacina*`. Markdown + KaTeX jak w starym `explanation`.

| Pole | Długość | Zadanie |
|---|---|---|
| `takeaway` | 1 zdanie | reguła do odtworzenia na egzaminie, nie streszczenie pytania |
| `correctReason` | 3–5 zdań | kryterium rozstrzygające + najsilniejsza pułapka i dlaczego wpada |
| `distractors[id]` | 1–2 zdania | kotwica (dlaczego kusi) + granica (dlaczego jednak nie) |

Stary `explanation` w fabryce to właśnie sklejka tych trzech rzeczy w jeden akapit. Nowy standard je rozdziela, żeby UI mogło pokazać różną dawkę w zależności od tego, czy student umie, czy wpadł.

Dopóki flaga jest off, jedyne pole, które student naprawdę czyta z bloków, to `correctReason`. `takeaway` i dystraktory czekają na eksperyment.

---

## 7. Napięcia do decyzji

To są fakty, nie rekomendacje.

1. **Silnik bez treści.** Kod, admin, schema, testy — są. Prod = 0 wierszy. Adaptive feedback = 0% rollout. Budowa nie zmieniła doświadczenia studenta.

2. **Dwa źródła prawdy.** `explanation` (NOT NULL, 17k wierszy, katalog + fallback) vs `explanation_blocks` (puste, tylko sesja). Wypełnienie bloków bez przepisania `explanation` rozjeżdża katalog i sesję.

3. **Fabryka nie produkuje bloków.** Nowy batch LDEK nadal wychodzi jako jeden `WYJAŚNIENIE:`. Żeby bloki żyły, trzeba albo rozszerzyć TXT/SQL, albo backfill z istniejącej prozy, albo pisać ręcznie w adminie.

4. **`concise` bez treści jest pusty.** Wariant pokazuje `takeaway || explanation`. Jeśli `takeaway` nie ma, student „pewny” dostaje cały stary akapit pod nagłówkiem „Zapamiętaj” — czyli etykieta kłamie.

5. **Dystraktory są warunkowe.** Koszt redakcyjny: 4 teksty na pytanie. Zysk UI: tylko ten, w którego student wszedł, i tylko w `remedial`, i tylko przy włączonej fladze. Przy 17k pytaniach to duży nakład na feature, którego nikt jeszcze nie widział.

6. **Trafienie nie uczy błędów.** Świadoma decyzja w kodzie: po dobrym strzale nie ma katalogu dystraktorów. Jeśli redakcja chce „zawsze tłumacz wszystkie opcje”, obecny UI tego nie robi.

7. **`FormatPisaniaPytan.md` nie opisuje bloków.** Standard redakcyjny nadal mówi: 2–5 zdań w `explanation`. Admin sugeruje strukturę, której pipeline treści nie zna.

---

## 8. Pliki źródłowe

- model + normalizacja: `features/session/lib/structuredExplanation.ts`
- wariant: `features/session/lib/adaptiveFeedback.ts`
- UI studenta: `features/session/components/FeedbackPanel.tsx`
- admin: `features/admin/components/AdminStructuredExplanationFields.tsx`
- zapis: `features/admin/server/adminActions.ts` (`structuredExplanationSchema`)
- migracja: `scripts/2026-08-25-learning-concepts.sql`
- katalog (stare explanation): `features/session/components/CatalogView.tsx`
- matryca / liczby prod: `PRODUKT-MATRYCA.md` §1.7, §1.10, §6 „Standard wyjaśnień”
- fabryka (stary format): skill `ldek-fabryka`, blok `WYJAŚNIENIE:`
- etykiety PL: `messages/pl.json` → `session.correctAnswer`, `feedbackRemember`, `feedbackFullExplanation`, `feedbackWhySelected`, `feedbackRemediation`
