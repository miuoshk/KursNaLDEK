# Audyt warstwy wyjaśnień (UFO)

Data odczytu: 2026-09-05.  
Baza: **prod** — projekt Supabase `Kurs na LDEK` (`unfcpipxraiyacyzqanh`, region `eu-central-1`). MCP `list_projects` zwraca tylko ten jeden projekt; `list_branches` = `[]`. Nie ma stagingu ani lokalnego `supabase/config.toml` w repo.  
Każda liczba SQL poniżej: **źródło: prod, 2026-09-05**, o ile nie napisano inaczej.  
`supabase-schema.sql` w repo jest **nieaktualny** względem produkcji (brak m.in. `explanation_blocks`, `source`, `explanation_status`). Stan na prod potwierdzony `information_schema` + `pg_constraint`.

---

## A. MODEL DANYCH

### A.1 `explanation`, `explanation_blocks`, `questions_explanation_blocks_chk`

**`supabase-schema.sql` (repo, nie jest stanem prod):**

```161:180:supabase-schema.sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source_exam TEXT,
  source_code TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  question_type TEXT NOT NULL DEFAULT 'single_choice',
  timer_seconds INTEGER,
  correct_order JSONB,
  learning_outcome TEXT,
  hotspots JSONB,
  drill_questions JSONB,
  identify_mode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

W `supabase-schema.sql` **nie ma** `explanation_blocks` ani `questions_explanation_blocks_chk` (`rg` po pliku: 0 trafień).

**Najnowszy skrypt w repo, który ich dotyka:** `scripts/2026-08-25-learning-concepts.sql:4-34`. Na prod ta zmiana siedzi jako migracja `20260826010555` / `learning_concepts_tables` (`list_migrations`).

```4:34:scripts/2026-08-25-learning-concepts.sql
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation_blocks jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.questions'::regclass
      AND conname = 'questions_explanation_blocks_chk'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_explanation_blocks_chk
      CHECK (
        explanation_blocks IS NULL
        OR (
          jsonb_typeof(explanation_blocks) = 'object'
          AND (
            NOT (explanation_blocks ? 'takeaway')
            OR jsonb_typeof(explanation_blocks -> 'takeaway') = 'string'
          )
          AND (
            NOT (explanation_blocks ? 'correctReason')
            OR jsonb_typeof(explanation_blocks -> 'correctReason') = 'string'
          )
          AND (
            NOT (explanation_blocks ? 'distractors')
            OR jsonb_typeof(explanation_blocks -> 'distractors') = 'object'
          )
        )
      );
  END IF;
END
$$;
```

**Stan na prod** (`information_schema.columns` + `pg_get_constraintdef`):

| kolumna / constraint | typ | null | default |
|---|---|---|---|
| `explanation` | `text` | NOT NULL | — |
| `explanation_blocks` | `jsonb` | NULL | — |

Constraint na prod (identyczny z skryptem):

```
CHECK (((explanation_blocks IS NULL) OR ((jsonb_typeof(explanation_blocks) = 'object'::text)
  AND ((NOT (explanation_blocks ? 'takeaway'::text)) OR (jsonb_typeof((explanation_blocks -> 'takeaway'::text)) = 'string'::text))
  AND ((NOT (explanation_blocks ? 'correctReason'::text)) OR (jsonb_typeof((explanation_blocks -> 'correctReason'::text)) = 'string'::text))
  AND ((NOT (explanation_blocks ? 'distractors'::text)) OR (jsonb_typeof((explanation_blocks -> 'distractors'::text)) = 'object'::text)))))
```

Różnica schema vs migracja: schema **nie zna** kolumny i constraintu. **Na prod obowiązuje migracja / skrypt z 2026-08-25.**

### A.2 `explanation_legacy` / wersjonowanie / audyt

- Kolumny `explanation_legacy` **nie ma** na prod (`information_schema.columns` dla `questions` — pełna lista w A.3).
- Osobnej historii wersji samego wyjaśnienia **nie ma**.
- Jest tabela audytu edycji admina: `question_edits` (521 wierszy; źródło: prod, 2026-09-05, `list_tables`). Definicja: `scripts/2026-05-18-question-edits-audit.sql:4-12` — `question_id`, `editor_id`, `editor_role`, `report_id`, `changes jsonb`, `created_at`. Wpis powstaje w `updateQuestionFull` (`features/admin/server/adminActions.ts:420-432`). Komentarz w kodzie: update nie jest cofany, gdy insert audytu padnie.
- `editQuestion` (`adminActions.ts:129-154`) zapisuje `explanation` **bez** wpisu do `question_edits`. `rg` nie znajduje żadnego wywołania `editQuestion(` poza definicją.

### A.3 Kolumny `questions` na prod

źródło: prod, 2026-09-05 (`information_schema.columns`)

| kolumna | typ | nullable | default |
|---|---|---|---|
| `id` | text | NO | — |
| `topic_id` | text | YES | — |
| `text` | text | NO | — |
| `options` | jsonb | NO | — |
| `correct_option_id` | text | NO | — |
| `explanation` | text | NO | — |
| `source_exam` | text | YES | — |
| `source_code` | text | YES | — |
| `image_url` | text | YES | — |
| `is_active` | boolean | YES | `true` |
| `created_at` | timestamptz | YES | `now()` |
| `question_type` | text | YES | `'single_choice'` |
| `timer_seconds` | integer | YES | — |
| `learning_outcome` | text | YES | — |
| `correct_order` | jsonb | YES | — |
| `hotspots` | jsonb | YES | — |
| `drill_questions` | jsonb | YES | — |
| `identify_mode` | text | YES | — |
| `theme_label` | text | YES | — |
| `subtheme_label` | text | YES | — |
| `batch_label` | text | YES | — |
| `disable_option_shuffle` | boolean | NO | `false` |
| `tracks` | text[] | YES | — |
| `source` | enum `question_source` | NO | `'own'` |
| `first_seen_session` | text | YES | — |
| `repeat_count` | smallint | NO | `0` |
| `explanation_status` | text | NO | `'reviewed'` |
| `content_hash` | text | YES | — |
| `reserve_bucket` | smallint | YES | — |
| `explanation_blocks` | jsonb | YES | — |

**`options`:** na prod **100% tablica** JSON (`jsonb_typeof = 'array'`: 18 856; `object`: 0). Kształt: `[{"id":"a","text":"..."}, ...]` — id małą literą `a`–`e` (próbka 3 wierszy + histogram B.5). Klucz poprawnej odpowiedzi: `correct_option_id` (litera, nie indeks).

**`source` / `source_exam`:** `source` to enum `own | cem | uczelnia`. `source_exam` to osobny tekst (etykieta/termin egzaminu), nie to samo co `source`.

**`subject_id`:** nie ma na `questions`. Jest na `topics` (`topics.subject_id`).

**`topic_id`:** tak, FK → `topics.id`, nullable.

**`concept_id`:** nie ma kolumny na `questions`. Relacja przez `question_concepts` (20 703 wiersze; źródło: prod, 2026-09-05, `list_tables`).

**Status / publikacja:** `is_active` (nullable, default true); `explanation_status` IN (`missing`, `draft`, `reviewed`) — constraint `questions_explanation_status_chk`. źródło: prod, 2026-09-05:

```
SELECT explanation_status, COUNT(*) FROM questions GROUP BY 1;
reviewed | 18856
```

`reserve_bucket`; `tracks`; `source` + `first_seen_session` (FK → `cem_sessions`, coherence: `source='cem'` albo `first_seen_session IS NULL`).

### A.4 `topics.knowledge_card`

`supabase-schema.sql:157`: `knowledge_card TEXT`.  
Na prod: `text`, nullable (`information_schema`).  
`docs/SUPABASE.md:116` pisze `jsonb` — to **rozjeżdża się** z prod i ze schema.

źródło: prod, 2026-09-05

| subject_id | tematy z niepustą kartą | tematy łącznie |
|---|---:|---:|
| anatomia | 0 | 12 |
| biofizyka | 0 | 14 |
| farmakologia | 0 | 20 |
| fizjologia | 0 | 10 |
| histologia | 0 | 23 |
| ldew-chirurgia-stomatologiczna | 0 | 25 |
| ldew-choroby-sluzowki | 0 | 14 |
| ldew-endodoncja | 0 | 24 |
| ldew-ortodoncja | 0 | 12 |
| ldew-periodontologia | 0 | 16 |
| ldew-protetyka | 0 | 28 |
| ldew-stomatologia-dziecieca | 0 | 19 |
| ldew-stomatologia-zachowawcza | 0 | 23 |
| lek-prof-humanizm | 0 | 4 |
| mikrobiologia | 0 | 12 |
| stoma-angielski | 0 | 6 |
| stoma-biochemia | 0 | 6 |
| stoma-mikrobio-ju | 0 | 9 |
| stoma-narzad-zucia | **1** | 7 |
| stoma-patologia | 0 | 14 |
| stoma-socjologia | 0 | 1 |
| stoma-zakazne | 0 | 24 |

Jedyna niepusta karta: temat `NZ-01` (`stoma-narzad-zucia`), markdown zaczynający się od `# Fizjologia narządu żucia…`. Suma tematów = 323 = `list_tables`.

### A.5 `StructuredExplanation` vs Zod

**Typ + normalizacja** — `features/session/lib/structuredExplanation.ts` w całości:

```1:45:features/session/lib/structuredExplanation.ts
export type StructuredExplanation = {
  takeaway: string;
  correctReason: string;
  distractors: Record<string, string>;
};

function cleanText(value: unknown, maxLength = 8_000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeStructuredExplanation(
  value: unknown,
): StructuredExplanation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const rawDistractors =
    input.distractors &&
    typeof input.distractors === "object" &&
    !Array.isArray(input.distractors)
      ? (input.distractors as Record<string, unknown>)
      : {};
  const distractors = Object.fromEntries(
    Object.entries(rawDistractors)
      .map(([key, reason]) => [key.toLowerCase(), cleanText(reason, 2_000)])
      .filter(([key, reason]) => /^[a-z0-9_-]{1,8}$/.test(key) && reason),
  );

  const result: StructuredExplanation = {
    takeaway: cleanText(input.takeaway, 2_000),
    correctReason: cleanText(input.correctReason),
    distractors,
  };

  return result.takeaway ||
    result.correctReason ||
    Object.keys(result.distractors).length > 0
    ? result
    : null;
}

export function structuredExplanationForStorage(
  value: StructuredExplanation,
): StructuredExplanation | null {
  return normalizeStructuredExplanation(value);
}
```

**Zod** — `features/admin/server/adminActions.ts:162-175`:

```162:175:features/admin/server/adminActions.ts
const structuredExplanationSchema = z.object({
  takeaway: z.string().max(2000),
  correctReason: z.string().max(8000),
  distractors: z.record(z.string().max(8), z.string().max(2000)),
});

const updateQuestionSchema = z.object({
  // ...
  explanation: z.string().max(8000),
  explanationBlocks: structuredExplanationSchema.nullable(),
```

**Nie są identyczne.** Różnice:

| | `normalizeStructuredExplanation` (odczyt / storage helper) | `structuredExplanationSchema` (zapis admin) |
|---|---|---|
| puste pola | zwraca `null`, jeśli wszystko puste | akceptuje `{takeaway:"",correctReason:"",distractors:{}}` jako nie-null |
| trim | tak | nie |
| lowercase kluczy dystraktorów | tak | nie |
| filtr klucza | `/^[a-z0-9_-]{1,8}$/` + niepusty powód | tylko `max(8)` na klucz, pusty string przechodzi |
| `correctReason` max | 8000 (default `cleanText`) | 8000 |
| `takeaway` max | 2000 | 2000 |
| zapis do DB | `updateQuestionFull` **nie** woła `structuredExplanationForStorage`; pisze wynik Zoda wprost (`adminActions.ts:329`) | |

Constraint SQL sprawdza tylko typy JSON (`object` / `string`), nie długości ani alfabet kluczy.

---

## B. STATYSTYKA ISTNIEJĄCEJ PROZY

źródło: prod, 2026-09-05

### B.1 Pokrycie

| total | empty_explanation | with_blocks |
|---:|---:|---:|
| 18856 | 1363 | **0** |

**GROUP BY subject_id**

| subject_id | total | empty_explanation | with_blocks |
|---|---:|---:|---:|
| anatomia | 1568 | 0 | 0 |
| biofizyka | 852 | 0 | 0 |
| farmakologia | 1741 | 0 | 0 |
| fizjologia | 933 | 0 | 0 |
| histologia | 1193 | 1 | 0 |
| ldew-chirurgia-stomatologiczna | 2349 | 0 | 0 |
| ldew-choroby-sluzowki | 232 | 0 | 0 |
| ldew-endodoncja | 644 | 0 | 0 |
| ldew-ortodoncja | 759 | 0 | 0 |
| ldew-periodontologia | 383 | 0 | 0 |
| ldew-protetyka | 1039 | 0 | 0 |
| ldew-stomatologia-dziecieca | 1060 | 0 | 0 |
| ldew-stomatologia-zachowawcza | 1464 | 0 | 0 |
| lek-prof-humanizm | 608 | 0 | 0 |
| mikrobiologia | 560 | 0 | 0 |
| stoma-angielski | 1361 | **1361** | 0 |
| stoma-biochemia | 10 | 0 | 0 |
| stoma-mikrobio-ju | 465 | 0 | 0 |
| stoma-narzad-zucia | 111 | 0 | 0 |
| stoma-patologia | 577 | 0 | 0 |
| stoma-socjologia | 64 | 0 | 0 |
| stoma-zakazne | 883 | 1 | 0 |

**GROUP BY source**

| source | total | empty_explanation | with_blocks |
|---|---:|---:|---:|
| own | 13423 | 1361 | 0 |
| cem | 854 | 0 | 0 |
| uczelnia | 4579 | 2 | 0 |

Puste explanation = prawie cały `stoma-angielski` (ukryty w UI, C.3) + 1 histologia + 1 stoma-zakazne.

### B.2 Długość prozy (gdzie `explanation <> ''`)

| | znaki | słowa (`regexp_split_to_array(btrim(explanation), '\s+')`) |
|---|---:|---:|
| p50 | 539 | 68 |
| p90 | 1063.8 | 148 |
| p99 | 1395.08 | 190 |
| max | 4827 | 618 |

**Histogram znaków**

| kosz | n |
|---|---:|
| &lt;200 | 1121 |
| 200–500 | 6372 |
| 500–1000 | 7798 |
| 1000–2000 | 2136 |
| &gt;2000 | 66 |

Suma koszy 17 493 + 1363 puste = 18 856.

### B.3 Łamanie zasad

Zapytania jak w briefie (emoji: `LIKE '%✅%' OR LIKE '%⚠%' OR LIKE '%💡%' OR ~ U+1F300–U+1FAFF` — wariant `\u{…}` z briefu jest nielegalny w POSIX PG).

| reguła | n |
|---|---:|
| litery opcji (`(odpowied[źz]\|opcj[aięe]\|wariant)\s*[A-E]\b`) | **0** |
| nagłówki markdown `(^|\n)#{1,6}\s` | **0** |
| tabele `\n\|` | 204 |
| blockquote `(^|\n)>` | 2404 |
| listy `(^|\n)\s*[-*]\s` | 2652 |
| emoji | 2514 |
| KaTeX `\$` | 198 |
| „według skryptu / w materiale / zgodnie z podręcznikiem” | 12 |

**GROUP BY subject_id** — ten sam regex briefu (`\b` = backspace w POSIX PG, nie granica słowa). źródło: prod, 2026-09-05:

| subject_id | letter_refs | markdown_headings |
|---|---:|---:|
| anatomia | 0 | 0 |
| biofizyka | 0 | 0 |
| farmakologia | 0 | 0 |
| fizjologia | 0 | 0 |
| histologia | 0 | 0 |
| ldew-chirurgia-stomatologiczna | 0 | 0 |
| ldew-choroby-sluzowki | 0 | 0 |
| ldew-endodoncja | 0 | 0 |
| ldew-ortodoncja | 0 | 0 |
| ldew-periodontologia | 0 | 0 |
| ldew-protetyka | 0 | 0 |
| ldew-stomatologia-dziecieca | 0 | 0 |
| ldew-stomatologia-zachowawcza | 0 | 0 |
| lek-prof-humanizm | 0 | 0 |
| mikrobiologia | 0 | 0 |
| stoma-angielski | 0 | 0 |
| stoma-biochemia | 0 | 0 |
| stoma-mikrobio-ju | 0 | 0 |
| stoma-narzad-zucia | 0 | 0 |
| stoma-patologia | 0 | 0 |
| stoma-socjologia | 0 | 0 |
| stoma-zakazne | 0 | 0 |

Uwaga faktograficzna: 2349 wierszy zaczyna się od `**✅ Poprawna odpowiedź:**` (B.4) — regex z briefu na „odpowiedź A” ich nie łapie, bo nie ma litery opcji po słowie.

### B.4 Format STANDARD-WYJAŚNIEŃ 1.0

źródło: prod, 2026-09-05. `count(*) FILTER (WHERE explanation ~ '^\*\*✅ Poprawna odpowiedź:\*\*')` = **2349**.

Wszystkie 2349 to `ldew-chirurgia-stomatologiczna` (100% tego przedmiotu). Przykład `chs-12-010`:

```
**✅ Poprawna odpowiedź:** włókniak szkliwiakowy, wykrywany zwykle u pacjentów młodocianych
```

### B.5 Liczba opcji / klucz poza a–e

| | n |
|---|---:|
| &gt;5 opcji | 2 |
| &lt;4 opcji | 22 |
| klucz `correct_option_id` poza `a`–`e` | **0** |
| options jako array | 18856 |
| options jako object | 0 |

Histogram: 2 opcje = 8; 3 = 14; 4 = 901; 5 = 17 931; 6 = 2.

Dwa 6-opcjowe: `micro-exam-322`, `micro-exam-323` — mają id `f`, klucz nadal `e` („b, d oraz f poprawne”). Reszta &lt;4 to głównie biofizyka (prawda/fałsz i 3-wybór). `distractors[id]` ma sens dla 17 931 pytań 5-opcjowych; dla 901 4-opcjowych też, o ile id są z `a`–`d`.

---

## C. KTO CZYTA WYJAŚNIENIA

### C.1 Trafienia czytające pole z bazy / obiektu pytania

`rg` po `*.{ts,tsx}` (bez `node_modules`). Poniżej tylko odczyt `questions.explanation` / `explanation_blocks` albo zmapowanego obiektu pytania — nie kategoria zgłoszenia `"explanation"`, nie i18n, nie marketingowe mocki.

| plik:linia | pole | kontekst | markdown? | policy? |
|---|---|---|---|---|
| `features/session/server/loadQuestionsByIdsOrdered.ts:28,34` | oba | sesja nauki (SELECT) | nie (ładuje) | nie |
| `features/session/lib/mapSessionQuestion.ts:65-66` | oba | sesja / katalog (mapowanie) | nie | nie |
| `features/session/components/FeedbackPanel.tsx:39-46,101-117,127` | oba (fallback do `explanation`) | sesja nauki (inteligentna + przegląd) | tak (`markdownBlock`) | tak (przez rodzica `hideExplanation`) |
| `features/session/components/SessionQuestionContent.tsx:81,155-162` | oba (przez FeedbackPanel) | sesja | tak | **tak** `:81` |
| `features/session/components/CatalogView.tsx:273,567,586,739-755` | wyłącznie `explanation` | katalog | tak | **tak** `:145,564,583` |
| `features/session/hooks/useSessionOptionOrder.ts:18` + `sessionOptionOrder.ts:17` | `explanation` | sesja/katalog — blokada shuffle przy `(A)`–`(E)` | nie | nie |
| `features/session/server/sessionSummaryBuilder.ts:118,133,211` | `explanation` | podsumowanie sesji (review) | nie (ładuje) | nie |
| `features/session/lib/buildClientSessionSummary.ts:89` | `explanation` | podsumowanie (klient) | nie | nie |
| `features/session/components/SummaryAnswerStrip.tsx:111-117` | `explanation` | podsumowanie / przegląd odpowiedzi | tak | **nie** |
| `features/admin/server/loadAdminQuestionDetail.ts:59,107-108` | oba | admin | nie (ładuje) | nie (admin) |
| `features/admin/server/loadAdminQuestions.ts:105,133-139,179-187` | `explanation` | admin lista / szukaj `ilike` | nie (snippet) | nie |
| `features/admin/components/AdminQuestionEditor.tsx:340,435-445,774` | oba (podgląd tylko `explanation`) | admin | tak (proza) | nie |
| `features/admin/components/MarkdownExplanationEditor.tsx:198` | `explanation` | admin edytor | tak | nie |
| `features/admin/components/AdminStructuredExplanationFields.tsx:16-105` | `explanation_blocks` | admin zapis bloków | nie (textarea) | nie |
| `features/admin/server/generateTestExport.ts:158,178,233` | `explanation` | admin eksport Word | docx (plain/runs) | nie |
| `features/admin/lib/testExport/buildDocuments.ts:525` | `explanation` | admin eksport Word | nie (runs) | nie |
| `features/admin/lib/formatQuestionCopyText.ts:46` | `explanation` | schowek / zgłoszenie | plaintext | nie |
| `features/notifications/server/loadReportNotifications.ts:87` | `explanation` | powiadomienie o zgłoszeniu (SELECT) | — | nie |
| `features/notifications/components/ReportNotificationItem.tsx:57-76` | załadowane w C.1 wyżej, **nie renderowane** | powiadomienie | — | — |

Świadomie poza tabelą (nie czytają pola z bazy): `ReportErrorDialog` (kategoria), `LandingContent` / `HeroMotion` / `DemoMarkdown` (i18n), `messages/*.json`.

### C.2 Potwierdzenia

**a) CatalogView czyta wyłącznie `explanation` — tak.**  
`CatalogView.tsx:567,586` przekazuje `explanation={q.explanation}` do `CatalogExplanationPanel`; panel (`:744-755`) woła `markdownBlock(explanation)`. `explanationBlocks` nie występuje w tym pliku.

**b) Tryb egzaminu CEM (arkusz na czas).**  
Osobnej trasy studenckiej „rozwiąż cały arkusz CEM na czas, wyjaśnienia po końcu” **nie ma** w `app/**/page.tsx`. `hasCemExams` (`lib/products.ts:37-43`) steruje filtrem źródła / rezerwą / pigułkami, nie osobnym runnerem arkusza.  
To, co istnieje:

- katalog, tryb `egzamin` (`CatalogView.tsx:175,550,707`) — lokalny quiz, wyjaśnienie (`explanation`) po wyborze opcji (`isRevealed`, `:277`);
- sesja `przeglad` (w DB `mode='egzamin'`, `SessionPageClient.tsx:218-219`) — stoper `examElapsedSeconds` (`SessionStudyView.tsx:360`), FeedbackPanel **po każdej** odpowiedzi, nie dopiero na końcu;
- admin `/admin/testy` — eksport Word arkusza + osobny plik wyjaśnień (`generateTestExport.ts`).

**c) Przegląd sesji (review).**  
W trakcie sesji: `FeedbackPanel` przez `SessionQuestionContent.tsx:155`.  
Po sesji: `SummaryAnswerStrip.tsx:111-117` — tylko `a.explanation`, nie bloki.

**d) Eksport poza aplikację.**

| kanał | zawiera `explanation`? | bloki? |
|---|---|---|
| admin Word (test + klucz + wyjaśnienia) | tak (`generateTestExport.ts:158,233`) | nie |
| schowek admin / zgłoszenie | tak, plaintext (`formatQuestionCopyText.ts:46`) | nie |
| e-mail „pytanie dnia” | **nie** — `rg` nie znajduje takiego maila |
| share link pytania | **nie** — brak |
| powiadomienie o zgłoszeniu | SELECT tak, UI **nie pokazuje** explanation (`ReportNotificationItem.tsx:57-76`) | nie |

**e) Indeks wyszukiwarki.**  
źródło: prod, 2026-09-05 (`pg_indexes` WHERE `tablename='questions'`). Indeksy: `idx_questions_batch_label`, `idx_questions_learning_outcome`, `idx_questions_subtheme_label`, `idx_questions_theme_label`, `idx_questions_topic`, `idx_questions_tracks` (GIN na `tracks`), `idx_questions_type`, `questions_content_hash_idx`, `questions_pkey`, `questions_topic_source_active_idx`. **Żaden nie jest na `explanation`.** Brak `pg_trgm` / FTS. Admin szuka `ilike` (`loadAdminQuestions.ts:133-139`).

### C.3 `subjectExplanationPolicy`

```1:11:lib/content/subjectExplanationPolicy.ts
/**
 * Przedmioty STOMA r.1 bez wyjaśnień w UI (sesja, katalog).
 * explanation w DB może istnieć (admin, kopiowanie) — student go nie widzi.
 */
export const STOMA_Y1_SUBJECTS_WITHOUT_EXPLANATION = new Set([
  "stoma-angielski",
]);

export function isExplanationHiddenForSubject(subjectId: string): boolean {
  return STOMA_Y1_SUBJECTS_WITHOUT_EXPLANATION.has(subjectId);
}
```

Ukryty przedmiot: **`stoma-angielski`** (1361 pytań, wszystkie z pustym `explanation`).

**Sprawdzana:**

- `CatalogView.tsx:145,564,583`
- `SessionQuestionContent.tsx:81,160` (FeedbackPanel)
- `QuestionFooterActions.tsx:27` — tylko chowa kategorię zgłoszenia „explanation”, nie treść

**Nie sprawdzana, a explanation wychodzi:**

- `SummaryAnswerStrip.tsx:111-117`
- `generateTestExport.ts` / `buildDocuments.ts:525`
- `formatQuestionCopyText.ts:46`
- cały admin
- `sessionSummaryBuilder.ts` (payload podsumowania)

Dla `stoma-angielski` proza i tak jest pusta, więc wyciek UI dziś nic nie pokazuje. Policy nie obroni przyszłych niepustych wyjaśnień na podsumowaniu / eksporcie.

---

## D. KTO PISZE WYJAŚNIENIA

### D.1 Ścieżki zapisu

| ścieżka | plik:linia | `explanation`? | `explanation_blocks`? | pole, którego nie dostał |
|---|---|---|---|---|
| admin `updateQuestionFull` | `adminActions.ts:324-345` | tak, zawsze w payloadzie | tak, wartość Zoda (w tym `null`) | brakujące bloki → **NULL** (nadpisuje) |
| admin `editQuestion` | `adminActions.ts:136-147` | tak, tylko gdy podane | nie | zostawia drugie pole; **martwy kod** (brak callerów) |
| seed | `scripts/seed-content.sql:77,148-154` | tak | nie | `ON CONFLICT` ustawia `explanation = EXCLUDED.explanation`; blocks nietknięte |
| fabryka skill `to_sql.py` | skill, nie w repo — cytat D.2 | tak | nie | SET bez `explanation_blocks` → zostawia |
| ostatni batch w repo `exports/anatomia-batch-lek-2026-1.sql:616-623` | INSERT **bez** `ON CONFLICT` | tak | nie | re-import tego samego id padnie na PK; blocks nietknięte |
| skrypty `UPDATE … explanation =` (katex, normalizacja list) | m.in. `scripts/2026-06-18-biofizyka-katex-*.sql`, `scripts/normalize-question-list-format.mjs` | tak | nie | blocks zostawia |
| RPC | brak funkcji piszącej te kolumny (`pg_proc` ilike explanation/question/feedback — żadna nie UPDATE-uje `questions.explanation*`) | — | — | — |

### D.2 ON CONFLICT fabryki — czy nadpisze `explanation_blocks` NULL-em?

**Nie.** Skill `/Users/miuoshk/.codex/skills/ldek-eksport/scripts/to_sql.py` (nie ma kopii w repo):

Wariant LDEW — `to_sql.py:145-149`:

```145:149:/Users/miuoshk/.codex/skills/ldek-eksport/scripts/to_sql.py
        lines.append("ON CONFLICT (id) DO UPDATE SET")
        lines.append("  text              = EXCLUDED.text,")
        lines.append("  options           = EXCLUDED.options,")
        lines.append("  correct_option_id = EXCLUDED.correct_option_id,")
        lines.append("  explanation       = EXCLUDED.explanation;")
```

Wariant KNNP — `to_sql.py:238-243`:

```238:243:/Users/miuoshk/.codex/skills/ldek-eksport/scripts/to_sql.py
        lines.append("ON CONFLICT (id) DO UPDATE SET")
        lines.append("  question_text     = EXCLUDED.question_text,")
        lines.append("  options           = EXCLUDED.options,")
        lines.append("  correct_option_id = EXCLUDED.correct_option_id,")
        lines.append("  explanation       = EXCLUDED.explanation;")
        lines.append("  -- uwaga: is_active celowo NIE jest nadpisywane")
```

W obu SET **nie ma** `explanation_blocks`. Postgres aktualizuje tylko wymienione kolumny — `explanation_blocks` zostaje.

Ostatni wygenerowany SQL **w repo** (`exports/anatomia-batch-lek-2026-1.sql:616-623`, generator `scripts/build-anatlek-e2026-1.py`) w ogóle **nie ma** `ON CONFLICT` — sam INSERT. Też nie wyzeruje bloków.

### D.3 Funkcje / triggery na `questions`

źródło: prod, 2026-09-05

```
SELECT tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'questions' AND NOT tgisinternal;
```

| tgname | pg_get_triggerdef |
|---|---|
| `questions_refresh_topic_count` | `CREATE TRIGGER questions_refresh_topic_count AFTER INSERT OR DELETE OR UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION trg_questions_refresh_topic_count()` |

Definicja funkcji: `scripts/2026-05-21-questions-topic-count-trigger.sql:26-59` — przelicza `topics.question_count`. **Nie dotyka explanation.**

`pg_proc` (public, te nazwy istnieją): `active_question_count_by_topic`, `apply_user_question_review`, `due_review_question_ids`, `finalize_learning_answer`, `record_concept_attempt`, `record_feedback_consumption`, `refresh_topic_question_count`, `trg_questions_refresh_topic_count`. Żadna nie renderuje `blocks → explanation`.

### D.4 Admin: jedna transakcja? Podgląd?

- Bloki i proza idą **w jednym** `.update(fullUpdatePayload)` (`adminActions.ts:324-345`). To jeden request PostgREST, nie dwa save’y UI (`AdminQuestionEditor.tsx:242-264` woła raz `updateQuestionFull` z obu pól).
- Insert do `question_edits` jest **osobnym** requestem po udanym update (`:420-432`) — nie jedna transakcja SQL; komentarz w kodzie to potwierdza.
- Podgląd markdownu: tak, dla **prozy** `explanation` — `MarkdownExplanationEditor` (hint `:65`: „Podgląd jak w sesji nauki”) oraz `QuestionPreview` (`AdminQuestionEditor.tsx:770-774`). **Podglądu zrenderowanych bloków (takeaway / distractors / wariant feedbacku) nie ma** (`AdminStructuredExplanationFields.tsx` = same textarea).

---

## E. RENDERER

### E.1 Biblioteka i pluginy

`features/shared/lib/markdownBlock.tsx:1-49` — `react-markdown` +

```1:7:features/shared/lib/markdownPlugins.ts
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export const remarkPlugins = [remarkGfm, remarkMath] as const;
export const rehypePlugins = [rehypeKatex] as const;
```

KaTeX CSS: `app/globals.css:2` `@import "katex/dist/katex.min.css"`.  
Jedyny custom `components`: `table` → wrapper `overflow-x-auto` (`markdownBlock.tsx:6-18`).  
Landing używa osobnego `DemoMarkdown.tsx` (`remark-gfm`, **bez** KaTeX) — nie ścieżka sesji.

### E.2 Elementy (z kodu, nie z pamięci)

`allowedElements` / `disallowedElements` / `rehype-sanitize`: **brak** w repo (`rg` = 0). React-markdown renderuje domyślny zestaw HTML; to nie jest plaintext.

| element | obsługa |
|---|---|
| bold | tak — `[&_strong]` (`markdownBlock.tsx:30`) |
| kursywa | tak — default `<em>`, bez osobnego CSS |
| lista | tak — `[&_ul]` `:27` |
| lista numerowana | tak — `[&_ol]` `:28` |
| blockquote | GFM zrenderuje `<blockquote>`; **brak** CSS w `markdownBlock` (wygląd przeglądarkowy) |
| tabela | tak — GFM + custom `table` + `[&_th]/[&_td]` `:33-35` |
| nagłówki | CSS tylko `h2`, `h3` (`:31-32`); `h1`/`h4`–`h6` zrenderują się bez brandowych stylów. Regex B.3 nie znalazł nagłówków w prozie |
| kod inline | tak — `[&_code]` `:29` |
| KaTeX inline/blok | tak — `remark-math` + `rehype-katex`; `[&_.katex-display]` `:37` |
| link | tak — `[&_a]` `:25` |

### E.3 Platformy

Jedna: Next.js web. `rg` `expo|react-native|capacitor|@capacitor` w `package.json`: 0 (fałszywy hit: skrypt `learning:export`). Brak `manifest.webmanifest` / service workera (`app/layout.tsx:22-51`, `next.config.ts:27-89`). `rg` `apple-mobile-web-app` w `app/`: 0. Jeden renderer web.

### E.4 Screenshoty 390×844

**Fakty blokujące zrzut z prawdziwego UI:**

1. Aplikacja kursu ma **jeden zestaw tokenów** (`app/globals.css:8-26`, tło `#002A27`). Brak `prefers-color-scheme`, brak `data-theme`, brak trybu jasnego. „Jasny” nie istnieje w produkcie.
2. Wpisanie fixture do admina na dev wymaga logowania admina. W tej sesji **nie logowałem się** i nie startowałem lokalnego admina.
3. `explanation_blocks` na prod = 0, więc FeedbackPanel i tak pada na fallback prozy.

Dlatego E.4 w żywym FeedbackPanel / adminie = **NIEZWERYFIKOWANE**. Żeby w ogóle zobaczyć stack GFM+KaTeX na 390 px, zrobiona jest **aproksymacja** (ten sam zestaw elementów co E.2, tokeny brandu, nie komponent `markdownBlock`).

Pliki:

- `docs/audyt-ufo/e4-ciemny-390.png`
- `docs/audyt-ufo/e4-jasny-390.png` — sztuczna inwersja; **to nie jest UI produktu**

Zrzuty są w repo. Obserwacje z fixture (nie z FeedbackPanel):

- bold, kursywa, ul, ol, h2, h3, kod inline, link — renderują się na 390 px bez ucięcia słów;
- KaTeX inline i blok zrenderowały się (`E=mc^2`, `\lambda_{max}=b/T`); blok wzoru wymaga poziomego scrolla;
- tabela GFM jest pod foldem na 844 px — na telefonie trzeba scrollować, żeby ją zobaczyć;
- pasek blockquote (złoty) jest **dopisany w fixture**; prawdziwy `markdownBlock` nie styluje `blockquote` (E.2);
- canvas zrzutu jest szerszy niż 390 — `Emulation.setDeviceMetricsOverride` zwęził layout karty, nie całe okno narzędzia.

### E.5 FeedbackPanel — warunki elementów

Samoocena **nie jest** w `FeedbackPanel.tsx`. Siedzi obok, w `SessionQuestionContent.tsx:170-209`.

| element | warunek | plik:linia |
|---|---|---|
| werdykt (ikona + „Poprawnie/Błędnie”) | zawsze, gdy panel jest zamontowany | `FeedbackPanel.tsx:70-82` |
| linia „ciebie / poprawna” | zawsze | `:83` |
| karta wyjaśnienia (cały box) | `!hideExplanation` | `:85` |
| ikona żarówki + tytuł „Zapamiętaj” | `variant === "concise"` | `:88-99` |
| ciało karty = takeaway albo correctReason (fallback: `question.explanation`) | concise → takeaway; inaczej correctReason | `:40-41,101-103` |
| accordion „Pokaż pełne wyjaśnienie” | `variant === "concise" && blocks?.correctReason` | `:108-118` |
| box dystraktora | `variant === "remedial" && selectedDistractorReason` | `:121-129` (`distractors[selectedOptionId]`) |
| karta tematu | `variant === "remedial" && question.knowledgeCard` | `:132-147` |
| komunikat transferu | `variant === "remedial" && transferScheduled` | `:149-154` |
| samoocena | `isWaitingForConfidence && !isPrzeglad` — **poza** FeedbackPanel | `SessionQuestionContent.tsx:86,170-209` |

`transferScheduled` liczy rodzic: `variant === "remedial"` i któreś z 3 następnych pytań dzieli `conceptIds` (`SessionStudyView.tsx:336-343`).

---

## F. SILNIK FEEDBACKU I SAMOOCENA

### F.1 `selectFeedbackVariant`

```11:28:features/session/lib/adaptiveFeedback.ts
export function selectFeedbackVariant(
  input: FeedbackVariantInput,
): FeedbackVariant {
  const meta = input.question.antares;
  if (!input.isCorrect || meta?.isLeech) return "remedial";
  const personalFastThreshold =
    meta?.avgTimeSeconds != null
      ? Math.max(10, meta.avgTimeSeconds * 0.85)
      : 25;
  const stable =
    !meta?.isNew &&
    (meta?.retrievability ?? 0) >= 0.8 &&
    (meta?.priorAccuracy ?? 0) >= 0.75;
  return stable && input.timeSpentSeconds <= personalFastThreshold
    ? "concise"
    : "standard";
}
```

Wejścia:

| wejście | skąd | kiedy | plik:linia |
|---|---|---|---|
| `isCorrect` | porównanie `selectedOptionId === correctOptionId` | po kliknięciu opcji | `SessionStudyView.tsx:198-199`; `useSessionStudyFlow.ts:199` |
| `timeSpentSeconds` | stoper pytania `useQuestionStopwatch` | w momencie wyboru opcji (pause) | `SessionStudyView.tsx:193` |
| `antares.isLeech` | `user_question_progress.is_leech` | przy starcie sesji (przed odpowiedzią) | `fetchSessionQuestionMeta.ts:156`; `buildAntaresInteligentnaSession.ts:646` |
| `antares.isNew` | `defaultQuestionMeta` ustawia `isNew: true`; composer nadpisuje | start sesji | `features/session/lib/antares/questionMeta.ts:9`; `buildAntaresInteligentnaSession.ts:655,718,757` |
| `antares.retrievability` | FSRS przed próbą, pole `retrievability` w `buildQuestionMeta` | start sesji | `features/session/lib/antares/questionMeta.ts:17,29` |
| `antares.priorAccuracy` | `timesCorrect / timesAnswered` albo `null` | start sesji | `features/session/lib/antares/questionMeta.ts:26-33` |
| `antares.avgTimeSeconds` | `input.avgTimeSeconds` ← `user_question_progress.avg_time_seconds` | start sesji | `features/session/lib/antares/questionMeta.ts:23,34` |

Stałe `0.8`, `0.75`, `0.85`, `10`, fallback `25` — **w kodzie** `adaptiveFeedback.ts:19-24`. Nie ma wiersza konfiguracji. Zmiana = deploy. Eksperyment `adaptive-feedback-v1` włącza **użycie** funkcji, nie progi.

Gdy eksperyment jest off, wariant jest twardo `"standard"` (`SessionStudyView.tsx:196-202`; `submitAnswer.ts:239-243`).

### F.2 Eksperymenty

Tabele, źródło: prod, 2026-09-05 (`list_tables` + `SELECT * FROM learning_experiment_configs`): `learning_experiment_configs` 3 wiersze, `learning_experiment_assignments` 0, `learning_experiment_rollouts` 0.

| experiment_key | active | rollout_percent | scheduler_version |
|---|---|---:|---|
| adaptive-feedback-v1 | **false** | **0** | not-applicable |
| daily-plan-v1 | false | 0 | not-applicable |
| memory-v2-rollout | false | 0 | memory-v2/ts-fsrs-5.4.1 |

Przypisanie: `experimentBucket(userId, key)` FNV-1a, kubełek 0–9999 (`memoryV2Experiment.ts:8-19`). `resolveLearningExperiment.ts:24-70` liczy wariant z **bieżącego** `rollout_percent` i upsertuje assignment. Przy `active=false` wraca control **zanim** zrobi upsert — stąd 0 wierszy w assignments. Bucket jest trwały (hash); wariant **nie jest** sticky przy zmianie % — przelicza się od nowa.

Włączenie X% bez deployu: RPC `set_learning_experiment_rollout` przez `scripts/set-learning-experiment-rollout.mjs` (`:94-99`). Dozwolone percent: **0, 5, 25, 100** (nie dowolne X). Wymaga `--apply` + dla &gt;0 raportu guardraili. Alternatywa: bezpośredni UPDATE `learning_experiment_configs` (niezwerifikowane, czy RLS/RPC to jedyna legalna droga — skrypt idzie service_role).

Eventy dziś: `learning_events.event_type` w kodzie = `answer` (`finalize_learning_answer`), `leech_hit`, `session_end` (`completeSession.ts:414`). Osobnego eventu „otwarto accordion” / „wariant feedbacku” w `learning_events` nie ma. Wariant ląduje na `session_answers.feedback_variant` (F.1/G.1).

### F.3 Samoocena

**a)** UI: `SessionQuestionContent.tsx:170-209` (oraz nieużywany duplikat `SessionConfidenceBar.tsx` — 0 importerów).  
Zapis: nie osobna akcja — `submitAnswer` (`features/session/api/submitAnswer.ts:27,197-198,267`). Klient: `useSessionStudyFlow.ts:175-228` → `submitAnswerWithRetry`.

**b)** `session_answers.confidence` — `text`, wartości Zoda: `"nie_wiedzialem" | "troche" | "na_pewno" | null` (`submitAnswer.ts:27`). Classic wymusza `null` (`:197-198`).

**c)** Mapowanie FSRS — cytat z kodu, `features/session/lib/memory/scheduler.ts:127-156`:

```127:156:features/session/lib/memory/scheduler.ts
export function confidenceToRating(
  isCorrect: boolean,
  confidence: Confidence,
): Grade {
  if (!isCorrect) return Rating.Again;
  switch (confidence) {
    case "nie_wiedzialem":
      return Rating.Hard;
    case "troche":
      return Rating.Good;
    case "na_pewno":
      return Rating.Easy;
  }
}

export function classifyAttemptRating(
  isCorrect: boolean,
  confidence: Confidence | null,
): AttemptRating {
  if (confidence == null) {
    return {
      grade: isCorrect ? Rating.Good : Rating.Again,
      source: "observed",
    };
  }
  return {
    grade: confidenceToRating(isCorrect, confidence),
    source: "explicit",
  };
}
```

| poprawność × samoocena | rating (z cytatu) |
|---|---|
| błędna × cokolwiek (w tym `"na_pewno"`) | `Rating.Again` (`:131`) |
| poprawna × `"nie_wiedzialem"` | `Rating.Hard` (`:133-134`) |
| poprawna × `"troche"` | `Rating.Good` (`:135-136`) |
| poprawna × `"na_pewno"` | `Rating.Easy` (`:137-138`) |
| poprawna × `null` | `Rating.Good`, `source: "observed"` (`:146-150`) |
| błędna × `null` | `Rating.Again`, `source: "observed"` (`:146-150`) |

Test: `scheduler.spec.ts:11-28`.

**d)** Kolejność w inteligentnej: klik opcji → od razu werdykt + FeedbackPanel (`useSession.ts:29-34,81-82`) → pasek samooceny → dopiero klik pewności woła `submitAnswer` + FSRS (`SessionStudyView.ts:219-236`, `submitAnswer.ts:237,317-330`). FSRS **po** samoocenie, nie przed. Werdykt **przed** samooceną.  
W przeglądzie: submit natychmiast z `confidence=null` (`SessionStudyView.ts:209-213`).

**e)** Bez kliknięcia samooceny: `canNavigateNext` jest false gdy `showConfidenceBar` (`SessionQuestionContent.tsx:89-90`) — **blokada** „Dalej”. „Pomiń ocenę” wysyła `"troche"` (`:201-207`), nie NULL.  
źródło: prod, 30 dni, join `study_sessions`:

| session_kind | odpowiedzi | confidence IS NULL |
|---|---:|---:|
| intelligent | 251596 | **0** |
| classic | 276514 | 189410 |

W inteligentnej NULL nie występuje. W classic 189410/276514 NULL (iloczyn z tabeli powyżej; źródło: prod, 2026-09-05). Skąd 87204 classic z niepustą pewnością — **NIEZWERYFIKOWANE** (obecny kod classic zeruje confidence, `submitAnswer.ts:197-198`).

**f)** Żeby zebrać pewność **przed** werdyktem: odwrócić `selectAndCheck` vs `handleSubmitWithConfidence` w `SessionStudyView.tsx:190-214` i `useSession.ts:29-34` — najpierw zapisać wybór bez `isShowingFeedback`, pokazać pasek z `:170`, a FeedbackPanel montować dopiero po `onConfidencePick`. `submitAnswer` już dostaje pewność razem z odpowiedzią; FSRS zostaje w jednym requeście. Dotyka też skrótów klawiszowych (`useSessionKeyboardShortcuts.ts:65`) i dwell (`feedbackShownAtRef` dziś startuje przy pokazaniu werdyktu, `:204-207`).

### F.4 Leech

Definicja klienta: `features/session/lib/antares/leechDetector.ts:1-31` — próg 3 błędy z rzędu, reset po 2 poprawnych z rzędu; `leech_count` nie maleje.  
To samo w SQL `finalize_learning_answer` (`scripts/2026-08-25-learning-concepts.sql:502-507`): `wrong_streak >= 3` → leech; `correct_streak >= 2` → zdjęcie.  
Liczone przy finalizacji odpowiedzi (server), czytane do `antares.isLeech` przy starcie kolejnej sesji. Zgodne z „3 błędy / reset po 2 poprawnych”.

### F.5 „Wkrótce powtórzymy pokrewne pojęcie”

Pokrewne = inne pytanie z przecięciem `conceptIds` (primary, ewentualnie wszystkie linki — `mapSessionQuestion.ts:72-75`).  
`scheduleConceptTransfer` (`conceptTransfer.ts:24-69`) w trybie inteligentna, po błędzie albo leechu (`useSessionStudyFlow.ts:259-266`): wstawia siostrzane 2 pozycje dalej z ogona albo rezerwy.  
„Zaplanowany transfer” w UI = flaga `transferScheduled` gdy wariant **remedial** i któreś z 3 następnych pytań dzieli koncept (`SessionStudyView.tsx:336-343`).  
Na prod adaptive-feedback jest **wyłączony**, więc wariant jest zawsze `"standard"` → komunikat **się nie pokazuje**. Przestawienie kolejki w inteligentnej **działa bez eksperymentu** (to nie jest zgatowane `adaptiveFeedbackEnabled`). Ile razy realnie wstawia siostrę na prod — **NIEZWERYFIKOWANE** (brak eventu).

---

## G. TELEMETRIA

### G.1 `session_answers`

źródło: prod, 2026-09-05 (`information_schema.columns`)

| kolumna | typ | null | uwagi |
|---|---|---|---|
| `id` | uuid | NO | |
| `session_id` | uuid | YES | |
| `question_id` | text | YES | |
| `selected_option_id` | text | NO | **stabilne id opcji** (`a`–`e`, nie litera po shuffle) |
| `is_correct` | boolean | NO | |
| `confidence` | text | YES | |
| `time_spent_seconds` | integer | YES | tak, czas odpowiedzi |
| `question_order` | integer | YES | |
| `answered_at` | timestamptz | YES | default now() |
| `is_first_exposure` | boolean | YES | |
| `rating_source` | text | YES | |
| `fsrs_applied` | boolean | NO | |
| `scheduler_version` | text | YES | |
| `fsrs_rating` | smallint | YES | |
| `state_before` / `state_after` | text | YES | FSRS |
| `retrievability_before` / `retrievability_after` | real | YES | FSRS |
| `stability_before` / `stability_after` | real | YES | FSRS |
| `difficulty_before` / `difficulty_after` | real | YES | FSRS |
| `fsrs_snapshot_before` / `fsrs_snapshot_after` | jsonb | YES | FSRS |
| `due_before` / `due_after` | timestamptz | YES | FSRS |
| `processing_completed_at` / `processing_result` | … | YES | |
| `memory_fallback` | boolean | NO | |
| `feedback_variant` | text | YES | wariant feedbacku |
| `feedback_dwell_seconds` | real | YES | czas na panelu |

Wariant jest zapisywany. Przy eksperymencie off kod i tak wpisuje `"standard"` (`submitAnswer.ts:241-243`). Dwell tylko w treatment (`:244-246`, `recordFeedbackDwell.ts:42-44`).

### G.2 Klikalność dystraktorów — 30 dni

`selected_option_id` jest zapisane. Rozkład da się policzyć **dziś**.

źródło: prod, 30 dni do 2026-09-05

| question_id | n | %a | %b | %c | %d | %e | %inne |
|---|---:|---:|---:|---:|---:|---:|---:|
| ana-ner-090 | 495 | 29.9 | 12.5 | 5.9 | 46.1 | 5.7 | 0.0 |
| ana-ner-089 | 492 | 16.3 | 43.9 | 16.9 | 13.4 | 9.6 | 0.0 |
| ana-cza-077 | 478 | 7.1 | 14.4 | 19.9 | 53.6 | 5.0 | 0.0 |
| ana-jam-027 | 477 | 11.3 | 13.0 | 10.7 | 14.5 | 50.5 | 0.0 |
| ana-kon-155 | 452 | 14.2 | 10.8 | 6.0 | 9.1 | 60.0 | 0.0 |
| ana-nac-107 | 452 | 60.8 | 4.6 | 9.3 | 18.4 | 6.9 | 0.0 |
| ana-jam-028 | 450 | 10.2 | 1.8 | 4.0 | 26.0 | 58.0 | 0.0 |
| ana-cza-072 | 449 | 65.5 | 11.1 | 8.2 | 10.5 | 4.7 | 0.0 |
| ana-kon-157 | 438 | 6.6 | 19.6 | 7.1 | 9.8 | 56.8 | 0.0 |
| ana-cza-078 | 437 | 63.4 | 8.7 | 12.6 | 12.4 | 3.0 | 0.0 |
| ana-mie-036 | 432 | 64.6 | 5.8 | 1.4 | 4.9 | 23.4 | 0.0 |
| ana-oun-155 | 429 | 14.2 | 12.8 | 51.5 | 12.1 | 9.3 | 0.0 |
| ana-kon-148 | 423 | 3.1 | 13.0 | 68.3 | 11.8 | 3.8 | 0.0 |
| ana-cza-073 | 419 | 3.6 | 2.9 | 11.0 | 79.5 | 3.1 | 0.0 |
| ana-nac-112 | 417 | 59.2 | 7.4 | 8.4 | 13.9 | 11.0 | 0.0 |
| ana-ner-096 | 417 | 8.2 | 30.2 | 2.4 | 8.4 | 50.8 | 0.0 |
| ana-obw-099 | 417 | 10.8 | 13.7 | 8.9 | 55.6 | 11.0 | 0.0 |
| ana-nac-111 | 416 | 64.4 | 2.4 | 4.6 | 8.4 | 20.2 | 0.0 |
| ana-ner-093 | 416 | 4.6 | 5.8 | 25.5 | 11.8 | 52.4 | 0.0 |
| ana-nac-110 | 415 | 5.1 | 9.6 | 59.5 | 17.1 | 8.7 | 0.0 |

Top 20 to anatomia. Litera ekranowa po shuffle **nie** jest zapisana — tylko id.

### G.3 Interakcje z feedbackiem

- otwarcie accordionu: `<details>` w `FeedbackPanel.tsx:109-118` — brak `onToggle` / analytics. `rg` `analytics|track\(` w `features/session`: 0. **nic**
- scroll: **nic** (`rg` scroll+feedback w session: brak loggera)
- czas na panelu: kolumna + RPC `record_feedback_consumption`; zapis tylko w treatment (`recordFeedbackDwell.ts:42-44`). źródło: prod, 2026-09-05, 30 dni: `feedback_dwell_seconds IS NOT NULL` = **0**.

### G.4 Wolumen dzienny (30 dni)

źródło: prod, 2026-09-05, TZ `Europe/Warsaw`, 31 dób

| | |
|---|---:|
| p50 odpowiedzi / dzień | **13644** |
| p50 unikalnych pytań z ≥1 odpowiedzią / dzień | **3360** |
| min / max odpowiedzi | 531 / 46696 |

### G.5 Rozkład per pytanie (90 dni)

źródło: prod, 2026-09-05. Suma = 18 856.

| odpowiedzi na pytanie | liczba pytań |
|---|---:|
| 0 | 9849 |
| 1–10 | 401 |
| 11–100 | 3853 |
| &gt;100 | 4753 |

Kolejka migracji w surowej postaci: najpierw 4753 „żywe”, na końcu 9849 martwych w oknie 90 dni.

---

## H. FABRYKA, EKSPORT, TESTY

### H.1 Parser `WYJAŚNIENIE:`

`batch_parser.py` / `to_sql.py` **nie są w repo**. Żyją w skillu `ldek-eksport`: `/Users/miuoshk/.codex/skills/ldek-eksport/scripts/batch_parser.py`.

```84:88:/Users/miuoshk/.codex/skills/ldek-eksport/scripts/batch_parser.py
        expl = re.search(r"^WYJAŚNIENIE:\s*\n(.*?)(?=\n\s*PROJEKT:|\Z)",
                         block, re.MULTILINE | re.DOTALL)
        if expl:
            item["explanation"] = expl.group(1).strip()
```

Wieloliniowo, DOTALL, do `PROJEKT:` albo końca bloku. Puste linie w środku **przechodzą 1:1** (nie tnie na pierwszej pustej). Ucięcie nastąpi tylko, gdy w środku pojawi się linia `PROJEKT:`.

W repo generatory `scripts/build-*-e2026-1.py` piszą `expl` wprost do SQL, bez tego parsera.

### H.2 Kod znający `explanation_blocks` poza session/admin

`rg` `explanation_blocks|takeaway|correctReason|distractors` poza `features/session` i `features/admin`: **brak** w kodzie aplikacji. Trafienia w `docs/ustrukturyzowany-feedback.md` (nie kod).

### H.3 Testy

| plik | w `npm test`? | co pokrywa | czego nie |
|---|---|---|---|
| `features/session/lib/structuredExplanation.spec.ts` | tak (`package.json:11`) | normalize: trim, lowercase klucza, puste → null | Zod, zapis, FeedbackPanel |
| `features/session/lib/adaptiveFeedback.spec.ts` | tak | concise / standard / remedial+leech | progi brzegowe 0.8/0.75, brak `antares`, fallback 25 s |
| `FeedbackPanel` | **brak pliku testu** | — | cały UI wariantów |
| `adminActions` schemat bloków | **brak** | — | Zod vs normalize |
| `scheduler.spec.ts` | tak | mapowanie pewność → FSRS | — |
| `mapSessionQuestion.spec.ts` | tak | mapowanie wiersza (w tym blocks) | — |
| `conceptTransfer.spec.ts` | tak | wstawianie siostry | — |

CI (`.github/workflows/security.yml`): `npm ci` + `npm run audit:check`. **`npm test` nie jest odpalane na PR.**

### H.4 Staging

Nie. Jeden projekt prod, zero branchy Supabase, brak `supabase/` w repo. Tego środowiska teraz nie ma.

---

## I. OPINIE, RYZYKA, PYTANIA

### I.1 Trzy rzeczy, które pękną pierwsze przy wlaniu bloków do ~17 tys. pytań

1. **Dawkowanie nie włączy się samo.** Bloki są czytane, ale przy `adaptive-feedback-v1` = 0% / `active=false` wariant jest zawsze `standard`, a `standard` pokazuje `correctReason || explanation`. Po wsadzie student zobaczy de facto tę samą ścianę co dziś, tylko z innego pola — dopiero rollout eksperymentu (albo zdjęcie twardego `"standard"`) zacznie dawkować. Ryzyko: „wlaliśmy 17k i nic się nie zmieniło”, plus nikt nie zmierzy accordionu, bo i tak go nie ma poza `concise`.

2. **Katalog, podsumowanie i Word zostaną przy starej prozie.** CatalogView i SummaryAnswerStrip nie znają bloków. Po migracji admin zobaczy bloki, student w sesji (gdy experiment on) zobaczy bloki, a w katalogu / na pasku podsumowania / w DOCX dalej pełną `explanation`. Dwa źródła prawdy w pierwszym tygodniu. Jeśli migrator wypełni bloki i skróci lub zmieni prozę, katalog rozjedzie się z sesją.

3. **Zapis admina potrafi wyzerować bloki, fabryka ich nie broni w drugą stronę.** `updateQuestionFull` zawsze wysyła `explanation_blocks` (także `null`). Pusty formularz = NULL na prod. Re-import z `to_sql.py` bloków nie ruszy (to plus), ale też ich nie uzupełni — 17k zostanie ręcznym/LLM batch-updatem. Zod przyjmie inny kształt niż normalize przy odczycie (wielkie litery kluczy, puste obiekty). Pierwszy dzień masowej edycji w adminie to pierwsze ciche NULL-e.

### I.2 Co wyrzucić, co zostawić

**Zostawić.** Kształt `{takeaway, correctReason, distractors}` — jest już w DB constraint, Zod, normalize i FeedbackPanel. `selected_option_id` + czas + (martwa dziś) `feedback_variant` — telemetria klikalności już jest, nie trzeba jej wymyślać. Leech 3/2 w SQL i w `leechDetector` jest spójny. `question_edits.changes` już loguje `explanation_blocks`. Jeden webowy `markdownBlock` (GFM+KaTeX) — nie mnożyć rendererów.

**Wyrzucić albo nie opierać na tym przebudowy.** Martwy `editQuestion` i `SessionConfidenceBar` (duplikat UI). Fallback `takeaway || explanation` / `correctReason || explanation` — maskuje braki bloków i uniemożliwia odróżnienie „nie zmigrowane” od „celowo krótko”. `supabase-schema.sql` i `docs/SUPABASE.md` (`knowledge_card jsonb`) jako źródło prawdy — kłamią. `explanation_status='reviewed'` na wszystkich, w tym 1363 pustych — pole jest dziś bezużyteczne jako kolejka. Policy tylko na `stoma-angielski` przy jednoczesnym wycieku na podsumowaniu.

### I.3 Pytania, bez których nie da się zaprojektować przebudowy

1. Czy `stoma-angielski` ma **zostać** bez wyjaśnień (i bez bloków), czy to tymczasowa dziura, którą też wypełniamy?
2. „Arkusz CEM na czas” — chodzi o nieistniejący runner całego arkusza, o katalogowy tryb `egzamin`, czy o sesję `przeglad` ze stoperem? Od tego zależy, czy feedback w ogóle ma prawo pojawić się w trakcie.
3. Czy katalog i podsumowanie mają dostać te same bloki / to samo dawkowanie, czy sesja jest jedynym miejscem UFO?
4. 2349 chirurgii w formacie `**✅ Poprawna odpowiedź:**` — idziemy w parser regex, czy i tak przez LLM „dla spójności”?
5. Po wsadzie bloków: `explanation` zostaje kanoniczną prozą (render z bloków nigdzie), czy ma być `render(blocks)` zapisywane z powrotem do `explanation`? Trigger na `questions` dziś tego nie robi — i nic podobnego nie mieszka w bazie.
6. Czy wolno ruszyć `adaptive-feedback-v1` na 5/25% **zanim** bloki są pełne, czy najpierw pokrycie, potem dawkowanie? Dziś silnik dawkowania jest ślepy, bo nie ma bloków **i** jest wyłączony.
7. 9849 pytań bez odpowiedzi przez 90 dni — migrujemy je w tej samej turze, czy świadomie na końcu?
8. Admin przy zapisie pustych bloków ma pisać NULL, `{}`, czy odmawiać — to decyzja produktowa, nie techniczna; obecne zachowanie (NULL) zniszczy wsad przy „popraw tylko literówkę w stemie”, jeśli formularz zresetuje bloki.
9. Bezpieczny batch 50: osobny projekt/branch Supabase z kopią (albo anonimizowanym subsetem) `questions` + `topics` + auth do admina, albo lokalny Supabase od zera. Sam kod Next wystarczy podpiąć `SUPABASE_URL` w `.env.local`. (przeniesione z H.4)

---

*Koniec audytu. Zero zmian w kodzie produkcyjnym.*
