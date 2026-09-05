# Protokół przebudowy warstwy wyjaśnień (UFO) — prompty do Cursora

**Wejście:** `docs/AUDYT-UFO.md` (audyt z 2026-09-05, stan prod).
**Cel:** każde pytanie w aplikacji ma `explanation_blocks`, `explanation` jest
projekcją z bloków renderowaną w jednym miejscu, feedback po odpowiedzi jest
dawkowany zależnie od wyniku i pewności, a pipeline produkcji treści ma
bezpieczną drogę do bazy z rollbackiem.

Numeracja odwołań: `A.5`, `D.1`, `F.3f` itd. = sekcje audytu.

---

## Decyzje podjęte (nie do dyskusji w PR-ach)

| # | Decyzja | Skąd |
|---|---|---|
| D1 | Bloki są kanoniczne. `explanation` = `render(blocks)` liczone **w bazie** (trigger), używane wszędzie: sesja, katalog, podsumowanie, Word, schowek. | I.3.5, I.3.3 |
| D2 | Stara proza idzie do `explanation_legacy` przy pierwszym zapisie bloków. Rollback = jeden UPDATE. | A.2 |
| D3 | Schema v2 bloków: `correctReason` (zostaje), `takeaway` → etykieta „Zasada", nowe `trap` i `contrast`, pole `version: 2`. Limity długości egzekwowane w bazie, nie tylko w UI. | A.5 |
| D4 | Zero emoji w treści i w renderze. Semantykę niosą etykiety bold, wygląd robi CSS. | — |
| D5 | Admin wysyła bloki tylko, gdy je edytował. Wyzerowanie bloków to osobna, potwierdzana akcja. | I.1.3, I.3.8 |
| D6 | Samoocena pewności przed werdyktem w trybie inteligentna. Przegląd bez zmian (bez samooceny). | F.3f |
| D7 | Wariant feedbacku dostaje pewność jako wejście. Przegląd (52% ruchu, bez pewności) używa dzisiejszych proxy. | F.1, G.4 |
| D8 | Chirurgia (2349, format Standard 1.0) → parser regex, nie LLM. | B.4 |
| D9 | Kolejka migracji: 4753 „żywe" (>100 odp./90 dni) → 3853 → 401 → 9849 martwe na końcu. | G.5 |
| D10 | Rollout `adaptive-feedback-v1` na 5% **od razu po wsadzie chirurgii** (bramka po KROKU 6). Treatment działa tylko na pytaniach z blokami — reszta dostaje `standard` z prozą jak dziś. Pokrycie rośnie w trakcie eksperymentu. | I.3.6 |
| D11 | Staging = Supabase Branching na tym projekcie. Każdy batch najpierw na branchu. | H.4, I.3.9 |
| D12 | `stoma-angielski` poza zakresem (policy zostaje, bloków nie piszemy). | I.3.1 |
| D13 | `npm test` wchodzi do CI na PR. | H.3 |
| D14 | Pytania 6-opcjowe (`micro-exam-322/323`): klucze dystraktorów dopuszczają `a`–`f`. | B.5 |

Zasady jak zawsze: jeden krok = jeden PR, dowody zamiast opisów, kroki
**[BRAMKA]** czekają na moją decyzję. Kolejność:
0 → 1 → 2 → 3 → 4 → 5 → 7 → 10.2 (guardrail) → 6 **[BRAMKA + rollout 5%]**
→ 8 → 9 → 10 (reszta) **[BRAMKA 25%]**.
KROK 7 i guardrail idą przed wsadem chirurgii, bo eksperyment startuje razem
z wsadem. Kroki 8–9 równolegle z produkcją treści.

---

## Kontrakt bloków v2 (jedyne źródło prawdy kształtu)

```ts
type ExplanationBlocksV2 = {
  version: 2;
  correctReason: string;              // OBOWIĄZKOWE, 1–900 znaków
  takeaway?: string;                  // ≤ 200 znaków; etykieta UI „Zasada"
  distractors?: Record<string, string>; // klucz = options[].id (a–f),
                                        // ≠ correct_option_id, wartość ≤ 350
  trap?: string;                      // ≤ 350 znaków; etykieta „Pułapka"
  contrast?: string[][];              // tabela: 1 nagłówek + ≤ 4 wiersze,
                                      // ≤ 3 kolumny, komórka ≤ 80 znaków
};
```

Limity sprawdzone na prod na 2349 pytaniach chirurgii (Standard 1.0):
mechanizm p50 439 / p95 535 / max 758 znaków (0 ponad 900), Pułapka p95 165
(0 ponad 350), Haczyk p50 115 / p95 152 / max 201 (2 ponad 200). Limity nie
są wzięte z sufitu — mieszczą istniejącą, dobrą treść z zapasem.

Reguły treści egzekwowane mechanicznie (walidator + constraint):

- zero liter opcji w tekstach: `(odpowied[źz]|opcj[aięe]|wariant)\s*[A-F]\b` = FAIL,
- zero nagłówków `#`, zero emoji (dowolny znak z U+1F300–U+1FAFF, U+2600–U+27BF),
- każdy tekst po `trim` niepusty, jeśli klucz obecny,
- klucze `distractors` ⊆ id opcji tego pytania i ≠ `correct_option_id`.

Kolumny towarzyszące (nowe): `explanation_legacy text`, `blocks_status text
NOT NULL DEFAULT 'none' CHECK IN ('none','draft','reviewed')`, `blocks_source
text CHECK IN ('parser','converter','writer','manual')`, `blocks_updated_at
timestamptz`.

Render (jeden, w bazie, bez emoji) — dokładny szablon:

```
**Poprawna odpowiedź:** {tekst opcji correct_option_id}

{correctReason}

**Dlaczego nie pozostałe?**

- *{tekst opcji id}* — {distractors[id]}        ← kolejność wg options[]

{contrast jako tabela GFM, jeśli jest}

> **Pułapka:** {trap}

> **Zasada:** {takeaway}
```

Sekcje bez treści są pomijane razem z etykietą. Puste linie między sekcjami
obowiązkowe (CommonMark). Zasada zawsze ostatnia (efekt świeżości).

Kontrakt JSONL dla batchy z fabryki (wejście do RPC z KROKU 4):

```json
{"id":"chs-12-010","source":"parser","blocks":{"version":2,"correctReason":"…","takeaway":"…","distractors":{"a":"…","c":"…"},"trap":"…"},"refs":["Standard 1.0 / legacy"]}
```

---

## KROK 0 — otwarcie (wklej raz)

```
Przebudowujemy warstwę wyjaśnień w Kurs na LDEK. Wejście: docs/AUDYT-UFO.md
(Twój audyt) i docs/PROTOKOL-UFO.md (ten plik — wrzuć go do repo i
zacommituj zanim zaczniesz). Przeczytaj oba w całości.

Zasady na całą tę robotę, obowiązują w każdym kroku:

1. Jeden krok = jeden PR. Nie robisz nic poza zakresem kroku. Rzeczy do
   poprawy obok wypisujesz na końcu PR-a, nie poprawiasz.
2. Nie refaktoryzujesz „przy okazji". Nie ruszasz formatowania plików,
   których krok nie dotyczy.
3. Nigdy nie zmieniasz questions.id ani correct_option_id ani options
   istniejących pytań. Nigdy nie zmieniasz definicji FSRS, mastery,
   readiness, leech (3/2), mapowania pewność → rating
   (scheduler.ts:127-156).
4. Każda migracja SQL ma parę up/down i idzie przez apply_migration,
   nie przez execute_sql. Nazwa: YYYYMMDDHHMMSS_ufo_<krok>.
5. Zanim napiszesz kod dotykający tabeli, czytasz jej definicję z prod
   (information_schema), nie z supabase-schema.sql — audyt A.1 pokazał,
   że ten plik kłamie. W KROKU 1 go naprawisz.
6. Kontrakt bloków v2 z protokołu jest jedynym źródłem kształtu. Nie
   dodajesz pól, nie zmieniasz limitów. Jeśli coś w nim nie działa —
   piszesz mi, nie obchodzisz.
7. Żaden krok nie dotyka danych na prod poza migracjami schemy. Wsady
   treści idą wyłącznie przez RPC z KROKU 4, na branchu, po bramce.
8. Jak czegoś nie wiesz — pytasz. Nie zgadujesz.

Potwierdź jednym akapitem, co zrozumiałeś, i czekaj na KROK 1.
```

---

## KROK 1 — schema v2

```
Zadanie: migracja schemy pod bloki v2. Zero zmian w kodzie aplikacji
(poza plikami dokumentującymi schemę).

1. Migracja up:
   a) ALTER TABLE questions ADD COLUMN explanation_legacy text;
      ADD COLUMN blocks_status text NOT NULL DEFAULT 'none';
      ADD COLUMN blocks_source text; ADD COLUMN blocks_updated_at timestamptz;
      CHECK blocks_status IN ('none','draft','reviewed');
      CHECK blocks_source IS NULL OR blocks_source IN
        ('parser','converter','writer','manual').
   b) Funkcja IMMUTABLE public.explanation_blocks_valid(blocks jsonb,
      options jsonb, correct_option_id text) RETURNS boolean, która
      implementuje CAŁY kontrakt v2 z protokołu: version = 2; typy pól;
      limity długości (char_length na ->>); correctReason obowiązkowe
      i niepuste po btrim; klucze distractors ⊆ (SELECT jsonb_array_elements
      (options)->>'id') i ≠ correct_option_id; contrast: tablica tablic,
      ≤ 5 wierszy (1 nagłówek + 4), każdy ≤ 3 komórek, komórka ≤ 80;
      brak nieznanych kluczy (dozwolone: version, correctReason, takeaway,
      distractors, trap, contrast); regex-y treści z protokołu (litery
      opcji, nagłówki, emoji) na KAŻDYM stringu w blokach — użyj
      jsonb_path_query albo rekurencji; emoji sprawdzaj przez
      regexp z zakresem w postaci [\u{...}] NIE działa w PG — użyj
      chr()/range przez `~ '[' || chr(...) || '-' || chr(...) || ']'`
      albo porównania code pointów; udowodnij testem w SQL, że
      '💡' i '✅' dają false, a 'ó', 'ż', '→', '≥' dają true.
   c) DROP CONSTRAINT questions_explanation_blocks_chk;
      ADD CONSTRAINT questions_explanation_blocks_chk CHECK
        (explanation_blocks IS NULL OR
         explanation_blocks_valid(explanation_blocks, options,
                                  correct_option_id)).
      Na prod explanation_blocks = 0 wierszy (B.1), więc constraint
      wchodzi bez konfliktu — potwierdź SELECT-em przed ALTER.
   d) Indeks częściowy: CREATE INDEX questions_blocks_status_idx ON
      questions (blocks_status) WHERE blocks_status <> 'none'.
2. Migracja down: odwrotność, przywraca stary constraint z A.1.
3. Zaktualizuj supabase-schema.sql do stanu prod PO migracji (wszystkie
   kolumny z A.3 + nowe) i popraw docs/SUPABASE.md:116 (knowledge_card
   jest text, nie jsonb — A.4).
4. Testy SQL (plik scripts/tests/explanation_blocks_valid.sql, odpalany
   ręcznie na branchu): 12 przypadków — poprawny pełny, poprawny
   minimalny (sam correctReason), brak version, version 1, correctReason
   pusty, takeaway 201 znaków, klucz dystraktora = klucz poprawny, klucz
   spoza options, „opcja B" w treści, nagłówek #, emoji, contrast
   4 kolumny. Wynik oczekiwany przy każdym.

W PR: diff migracji, wynik 12 testów, potwierdzenie, że constraint
wszedł na prod (SELECT conname, pg_get_constraintdef).
```

---

## KROK 2 — render w bazie i trigger

```
Zadanie: jeden renderer, w Postgresie. Zero zmian w UI poza CSS
blockquote.

1. Funkcja IMMUTABLE public.render_explanation_blocks(blocks jsonb,
   options jsonb, correct_option_id text) RETURNS text — produkuje
   DOKŁADNIE szablon z protokołu (sekcja „Render"). Zasady:
   - tekst opcji bierzesz z options[] po id; jeśli id nie istnieje
     (nie powinno po KROKU 1) — pomijasz pozycję;
   - kolejność dystraktorów = kolejność w options[];
   - contrast → tabela GFM: pierwszy wiersz nagłówek, linia |---|;
   - sekcje puste pomijane z etykietą; między sekcjami dokładnie jedna
     pusta linia; bez trailing whitespace; koniec bez \n;
   - ZERO emoji w wyniku (test: regexp na wynik).
2. Trigger BEFORE INSERT OR UPDATE OF explanation_blocks ON questions:
   - gdy NEW.explanation_blocks IS NOT NULL:
       jeśli OLD.explanation_blocks IS NULL (albo INSERT) i
       NEW.explanation_legacy IS NULL → NEW.explanation_legacy :=
       COALESCE(OLD.explanation, '');
       NEW.explanation := render_explanation_blocks(...);
       NEW.blocks_updated_at := now();
       jeśli NEW.blocks_status = 'none' → 'draft';
   - gdy NEW.explanation_blocks IS NULL i OLD nie był NULL:
       NEW.explanation := COALESCE(NEW.explanation_legacy, OLD.explanation);
       NEW.blocks_status := 'none'; NEW.blocks_source := NULL.
   Trigger NIE odpala się przy UPDATE innych kolumn (OF explanation_blocks)
   — poprawka literówki w text nie renderuje ponownie. Ale: UPDATE
   options przy istniejących blokach zmienia teksty dystraktorów w
   renderze — dodaj trigger na UPDATE OF options, który re-renderuje,
   gdy explanation_blocks IS NOT NULL.
3. RPC public.preview_explanation_blocks(blocks jsonb, question_id text)
   RETURNS text — SECURITY INVOKER, dla admina: bierze options i klucz
   z pytania, waliduje explanation_blocks_valid (przy false zwraca
   komunikat błędu jako tekst z prefiksem 'BŁĄD: '), zwraca render.
   RLS: tylko role admina (sprawdź, jak dziś jest gatowany admin —
   adminActions.ts).
4. CSS: markdownBlock.tsx nie styluje blockquote (E.2). Dodaj styl
   [&_blockquote] spójny z tokenami brandu (lewa krawędź, tło lekko
   jaśniejsze, bez kursywy) — to jedyna zmiana w UI w tym kroku.
5. Testy SQL (scripts/tests/render_explanation_blocks.sql): 6 fixture'ów
   z oczekiwanym tekstem 1:1 (pełny, minimalny, bez dystraktorów,
   z contrast, z trap bez takeaway, 6-opcjowy z kluczem f).
6. Inwariant do zapisania w PR: parse(render(b)) == b dla chirurgii —
   zrealizowany w KROKU 6, tu tylko przypomnienie, żeby render był
   deterministyczny.

W PR: definicje funkcji i triggerów, wynik 6 testów, screenshot
blockquote w FeedbackPanel na dev (390 px).
```

---

## KROK 3 — jeden kontrakt TS i admin

```
Zadanie: kod aplikacji przechodzi na kontrakt v2. Jeden schemat Zod,
z niego wszystko.

1. Nowy plik features/shared/lib/explanationBlocks.ts:
   - explanationBlocksSchema (Zod) = kontrakt v2 z protokołu, limity
     identyczne jak w explanation_blocks_valid (KROK 1). Jedna stała
     EXPLANATION_BLOCKS_LIMITS eksportowana, używana wszędzie.
   - normalizeExplanationBlocks(value: unknown): ExplanationBlocksV2 | null
     — trim, lowercase kluczy, usuwanie pustych, potem schema.safeParse;
     przy błędzie → null + console.warn z question id (nie wyjątek —
     sesja nie może paść na złym bloku).
   - typ ExplanationBlocksV2 = z.infer.
2. Usuń features/session/lib/structuredExplanation.ts i
   structuredExplanationSchema z adminActions.ts:162-175. Wszystkie
   importy (mapSessionQuestion.ts:65-66, FeedbackPanel.tsx,
   loadAdminQuestionDetail.ts, AdminQuestionEditor.tsx,
   AdminStructuredExplanationFields.tsx) na nowy moduł. Przenieś i
   rozszerz structuredExplanation.spec.ts.
3. Admin — AdminStructuredExplanationFields.tsx:
   - pola: Zasada (takeaway), Mechanizm (correctReason, obowiązkowe gdy
     bloki w ogóle istnieją), Dlaczego nie pozostałe (per opcja ≠ klucz,
     etykieta = pełny tekst opcji, NIE litera), Pułapka (trap), Kontrast
     (edytor 3×5 komórek albo textarea z tabelą GFM parsowaną do
     string[][] — wybierz prostsze, uzasadnij w PR);
   - liczniki znaków przy każdym polu z limitem z EXPLANATION_BLOCKS_LIMITS;
   - podgląd renderu przez RPC preview_explanation_blocks (debounce
     500 ms), pokazany w tym samym markdownBlock co w sesji;
   - przycisk „Wyczyść bloki" z confirm — jedyna droga do NULL.
4. Admin — zapis (D5): updateQuestionFull (adminActions.ts:324-345)
   przyjmuje explanationBlocks jako pole OPCJONALNE. Klient
   (AdminQuestionEditor.tsx:242-264) wysyła je tylko, gdy formularz
   bloków jest dirty albo użyto „Wyczyść bloki" (wtedy jawnie null).
   Brak pola w payloadzie = kolumna nietknięta. Przy obecności bloków
   pole explanation (MarkdownExplanationEditor) staje się read-only
   z podpisem „generowane z bloków" — edycja prozy tylko przy braku
   bloków. Usuń martwy editQuestion (adminActions.ts:129-154, A.2) i
   nieużywany SessionConfidenceBar.tsx (F.3a).
5. question_edits: wpis changes ma zawierać explanation_blocks przed/po
   (A.2 mówi, że już loguje — potwierdź i pokaż przykład).
6. Testy: explanationBlocks.spec.ts (parity z 12 przypadkami SQL z
   KROKU 1 — te same fixture'y, te same werdykty), adminActions test na
   partial update (payload bez explanationBlocks nie zmienia kolumny).

W PR: diff, wynik testów, gif z admina: edycja bloków → podgląd →
zapis → explanation w bazie równe podglądowi.
```

---

## KROK 4 — droga wsadowa i rollback

```
Zadanie: bezpieczna droga dla batchy z fabryki. To jedyna droga zapisu
bloków poza adminem.

1. RPC public.apply_explanation_blocks(batch jsonb, p_source text,
   p_dry_run boolean DEFAULT true) RETURNS jsonb — SECURITY DEFINER,
   wykonywalna tylko przez service_role (REVOKE od authenticated/anon).
   Wejście: tablica obiektów z kontraktu JSONL protokołu (id, source,
   blocks, refs). Zachowanie:
   - limit 50 pozycji na wywołanie (więcej → błąd, nic nie zapisane);
   - dla każdej pozycji: pytanie istnieje? blocks przechodzi
     explanation_blocks_valid? jeśli nie → pozycja w results z
     status 'rejected' i powodem; NIE przerywa reszty;
   - p_dry_run = true: nic nie zapisuje, zwraca results + render
     każdej pozycji (do podglądu);
   - p_dry_run = false: jedna transakcja, UPDATE questions SET
     explanation_blocks = blocks, blocks_source = p_source,
     blocks_status = 'draft'; trigger z KROKU 2 robi legacy i render;
     zwraca results ze status 'applied' i skrótem md5(explanation);
   - refs zapisuje do question_edits.changes (editor_role = 'batch',
     editor_id = NULL albo dedykowany, sprawdź constraint tabeli).
2. RPC public.rollback_explanation_blocks(ids text[]) RETURNS jsonb —
   service_role: SET explanation_blocks = NULL (trigger przywraca
   explanation z legacy), blocks_status='none'. Zwraca listę
   przywróconych i tych bez legacy (błąd, nie ruszane).
3. Skrypt scripts/apply-blocks.mjs <plik.jsonl> [--apply] [--source X]
   [--project-ref REF]: czyta JSONL, tnie na 50, woła RPC, pisze raport
   scripts/out/apply-<timestamp>.md (per id: status, powód, długość
   renderu). Domyślnie dry-run. --apply wymaga potwierdzenia „TAK"
   w stdin. Zmienna środowiskowa z service_role, nigdy w repo.
   Sprawdź, jak set-learning-experiment-rollout.mjs (F.2) łączy się
   z bazą i zrób tak samo.
4. Skrypt scripts/rollback-blocks.mjs <ids.txt|--from-report plik.md>
   [--apply].
5. Testy: na branchu (KROK 5) — tu tylko unit na podział batcha i
   parsowanie raportu.

W PR: definicje RPC, REVOKE/GRANT, skrypty, przykładowy raport dry-run
na 3 ręcznie napisanych pozycjach (w tym 1 celowo odrzucona).
```

---

## KROK 5 — staging: branch Supabase

```
Zadanie: środowisko do testowania batchy przed prod.

1. Włącz Supabase Branching na projekcie unfcpipxraiyacyzqanh (jeśli
   wymaga zmiany planu — STOP, napisz koszt, czekaj na moją decyzję).
   Utwórz branch „ufo-staging" (create_branch).
2. Seed branchu: skrypt scripts/seed-staging-subset.sql, który kopiuje
   z prod (przez pg_dump --data-only albo COPY przez RPC — wybierz
   wykonalne, opisz): topics (wszystkie), questions dla subject
   ldew-chirurgia-stomatologiczna + 500 losowych z anatomii + 200 z
   ldew-endodoncja, question_concepts dla nich, learning_experiment_configs.
   Bez danych użytkowników. Jeśli seed musi iść inaczej (branching
   seeduje z migracji, nie z prod) — opisz procedurę, jaka realnie
   działa, i wykonaj ją.
3. .env.staging dla Next z URL/kluczami branchu + instrukcja w
   docs/STAGING.md: jak odpalić lokalnie apkę na branchu, jak zalogować
   admina (utwórz jedno konto admina na branchu).
4. Dowód: na branchu odpal migracje z KROKÓW 1–2 i 4, potem
   apply-blocks.mjs na 3 pozycjach z KROKU 4 z --apply. Pokaż
   SELECT id, blocks_status, left(explanation, 120), left(
   explanation_legacy, 60) dla nich. Potem rollback-blocks.mjs i ten
   sam SELECT.

W PR: docs/STAGING.md, skrypt seeda, oba SELECT-y.
```

---

## KROK 6 — parser chirurgii = pierwszy batch [BRAMKA]

```
Zadanie: 2349 pytań ldew-chirurgia-stomatologiczna w formacie
Standard 1.0 (B.4) → bloki v2 przez parser, bez LLM.

1. scripts/parse-standard-v1.ts <in.jsonl|--from-db subject> → out.jsonl
   w kontrakcie JSONL protokołu. Reguły mapowania (format wg
   docs/STANDARD-WYJASNIEN.md sekcja 1, cytowany w audycie B.4):
   - linia `**✅ Poprawna odpowiedź:** X` → pomijana (render odtwarza
     z klucza); ale zapisz X do refs, żeby sprawdzić zgodność z opcją
     klucza (normalizacja: lowercase, bez interpunkcji, trim) —
     niezgodność → pozycja 'flag: verdict_mismatch';
   - akapit(y) między werdyktem a `**Dlaczego nie pozostałe?**` →
     correctReason (jeśli > 900 znaków → 'flag: too_long', pozycja
     nie idzie do wsadu);
   - każda pozycja `- *tekst* — zdanie` → distractors[id]: id znajdź
     przez dopasowanie *tekst* do options[].text (normalizacja jw.,
     potem similarity ≥ 0.85 — użyj prostego trigram/levenshtein w
     TS, bez zależności od bazy); brak dopasowania → 'flag:
     distractor_unmatched', pozycja trafia do wsadu BEZ tego
     dystraktora, flaga w raporcie;
   - tabela GFM (max 3 kol × 4 wiersze) → contrast; większa → pomijana
     + 'flag: contrast_too_big';
   - `> ⚠️ **Pułapka:** …` → trap (bez emoji, bez etykiety);
   - `> 💡 **Haczyk:** …` → takeaway (bez emoji, bez etykiety); jeśli
     > 200 znaków → obetnij? NIE — 'flag: takeaway_too_long', pole
     pomijane, pozycja idzie bez takeaway;
   - wszystko inne w tekście (zdania poza szablonem) → 'flag:
     unparsed_remainder' z treścią, pozycja NIE idzie do wsadu.
   Wynik: out.jsonl (do wsadu) + report.md (per id: flagi; zbiorczo:
   ile pozycji pełnych, ile bez takeaway/trap, ile odrzuconych i
   dlaczego).
2. Inwariant: dla każdej pozycji z out.jsonl policz
   render(blocks) (użyj RPC preview na branchu albo port renderera w
   TS TYLKO w teście) i porównaj z oryginalnym explanation po
   normalizacji (usuń emoji, ujednolić białe znaki, zamień „Haczyk"
   na „Zasada"). Różnice > 5% znaków → lista w raporcie. To jest test,
   czy parser niczego nie gubi.
3. Odpal na branchu ufo-staging: apply-blocks.mjs --apply w partiach
   po 50. Obejrzyj w apce na branchu 10 losowych pytań w sesji i w
   katalogu (screenshoty 390 px: 3 w sesji z FeedbackPanel, 3 w
   katalogu, 1 z contrast, 1 bez takeaway).
4. NIE odpalaj na prod. Wklej: report.md (zbiorczo + pierwsze 30
   flag), 8 screenshotów, wynik inwariantu.
```

> **[BRAMKA]** Oglądam raport i screenshoty. Decyduję: (a) wsad chirurgii
> na prod, (b) poprawki parsera, (c) które flagi idą do kolejki
> DO-UZUPEŁNIENIA dla fabryki. Po (a) — pierwsze 2349 pytań UFO na prod,
> `explanation` identyczne treściowo z dotychczasowym minus emoji,
> i **od razu** `adaptive-feedback-v1` na 5% (D10) — pod warunkiem, że
> guardrail hasBlocks z KROKU 10.2 i FeedbackPanel v2 z KROKU 7 są już
> na prod. Praktycznie: KROK 7 i 10.2 robimy PRZED wsadem, a nie po.
> Równolegle uruchamiam konwerter i pisarza (moja strona, nie Cursora).

---

## KROK 7 — FeedbackPanel v2 i czytelnicy

```
Zadanie: UI feedbacku pod bloki v2 i pewność jako wejście. Bez zmiany
kolejności samooceny (to KROK 8) — tu tylko logika i wygląd.

1. selectFeedbackVariant (adaptiveFeedback.ts) dostaje nowe wejście
   confidence: 'na_pewno' | 'troche' | 'nie_wiedzialem' | null oraz
   hasTakeaway: boolean. Nowa matryca (progi liczbowe bez zmian):
   - remedial: !isCorrect || isLeech (jak dziś);
   - concise: isCorrect && !isLeech && hasTakeaway &&
       (confidence === 'na_pewno' ||
        (confidence === null && stable && fast));   // przegląd: proxy
   - standard: reszta.
   Dodatkowo wynik ma flagę hypercorrection = !isCorrect &&
   confidence === 'na_pewno' (na razie tylko do telemetrii i etykiety).
   Zaktualizuj adaptiveFeedback.spec.ts: przypadki brzegowe 0.8/0.75,
   brak antares, fallback 25 s, każdy wariant × pewność.
2. FeedbackPanel.tsx — usuń maskujące fallbacki `takeaway || explanation`
   i `correctReason || explanation` (I.2). Nowa logika:
   - brak bloków → karta „Wyjaśnienie" z question.explanation
     (legacy), koniec; hasBlocks=false do telemetrii;
   - concise → „Zasada" (takeaway) + trap inline pod spodem, jeśli
     jest + <details> „Pełne wyjaśnienie" z correctReason i listą
     dystraktorów;
   - standard → correctReason + trap (blockquote) + <details>
     „Dlaczego nie pozostałe?" ze WSZYSTKIMI distractors (etykieta =
     tekst opcji, kursywa) — otwarte domyślnie, gdy confidence ∈
     {troche, nie_wiedzialem}, zamknięte przy na_pewno/null;
   - remedial → correctReason + box wybranego dystraktora na
     wierzchu (jak dziś, :121-129) + <details> z pozostałymi
     dystraktorami (zamknięte) + trap + contrast (jeśli jest) + karta
     tematu (jeśli jest) + transfer (jak dziś). Gdy
     hypercorrection → etykieta pod werdyktem: „Byłeś pewny — to
     pytanie wróci szybciej" (i18n messages/pl.json);
   - contrast renderuj przez markdownBlock jako tabelę GFM (jedna
     funkcja pomocnicza contrastToMarkdown w explanationBlocks.ts).
   Stałe pozycje: werdykt → (Zasada) → Mechanizm → box wybranego →
   Dlaczego nie pozostałe → Kontrast → Pułapka → karta tematu →
   transfer. Ta kolejność jest gramatyką wizualną — nie zmieniaj jej
   między wariantami, tylko pomijaj elementy.
3. Czytelnicy: po KROKU 2 CatalogView, SummaryAnswerStrip, Word i
   schowek dostają wyrenderowaną prozę automatycznie (D1). Tu tylko:
   - SummaryAnswerStrip.tsx:111-117 ma respektować
     isExplanationHiddenForSubject (C.3 — wyciek);
   - sessionSummaryBuilder.ts:118,133,211 — nie wysyłaj explanation
     dla ukrytych przedmiotów w payloadzie;
   - CatalogView: dodaj pod prozą etykietę źródła tylko dla admina?
     NIE — nic nie dodawaj; katalog pokazuje prozę, kropka.
4. Test: FeedbackPanel.spec.tsx (nowy) — snapshot per wariant ×
   {bloki pełne, bloki bez takeaway, brak bloków} = 9 przypadków +
   remedial z hypercorrection.

W PR: diff, testy, 4 screenshoty 390 px (concise, standard z otwartą
listą, remedial, brak bloków) z branchu ufo-staging na pytaniach
chirurgii.
```

---

## KROK 8 — samoocena przed werdyktem

```
Zadanie: w trybie inteligentna kolejność: klik opcji → pasek pewności →
werdykt + FeedbackPanel. Przegląd bez zmian. Zgodnie z F.3f.

1. SessionStudyView.tsx:190-214 i useSession.ts:29-34: selectAndCheck
   dzieli się na selectOption (zapis wyboru, opcje zablokowane, BEZ
   isShowingFeedback, BEZ kolorowania klucza) i revealFeedback
   (po onConfidencePick). Pasek pewności (SessionQuestionContent.tsx:
   170-209) pokazuje się po selectOption z pytaniem „Jak pewny jesteś
   tej odpowiedzi?" (i18n; dziś „Jak dobrze znałeś odpowiedź?").
   Wariant liczony w revealFeedback z pewnością (KROK 7).
2. submitAnswer (submitAnswer.ts) — sygnatura bez zmian: już przyjmuje
   confidence razem z odpowiedzią. Wołany w revealFeedback (jeden
   request, FSRS jak dziś). Mapowanie pewność → rating BEZ ZMIAN.
3. „Pomiń ocenę" (SessionQuestionContent.tsx:201-207) — zostaje,
   wysyła 'troche' jak dziś (nie zmieniamy definicji).
4. Skróty klawiszowe (useSessionKeyboardShortcuts.ts:65): 1/2/3 na
   pewność, potem Enter/spacja dalej — zaktualizuj i opisz w PR.
5. feedbackShownAtRef (SessionStudyView.tsx:204-207) startuje w
   revealFeedback, nie przy wyborze opcji — dwell mierzy czas na
   feedbacku, nie na pasku pewności. Osobno zapisz czas na pasku
   pewności do nowej kolumny session_answers.confidence_latency_ms
   (migracja up/down w tym PR).
6. Przegląd (isPrzeglad): ścieżka jak dziś — klik → werdykt,
   confidence=null.
7. Testy: useSessionStudyFlow — sekwencja stanów; scheduler.spec.ts
   przechodzi bez zmian (dowód, że FSRS nietknięty).

W PR: gif 390 px pełnej sekwencji w inteligentnej i w przeglądzie,
wynik testów, potwierdzenie SELECT-em na branchu, że session_answers
dostaje confidence i confidence_latency_ms.
```

---

## KROK 9 — telemetria i statystyka dystraktorów

```
Zadanie: mierzyć to, co przebudowaliśmy, i dać fabryce dane o
klikalności.

1. learning_events — nowe event_type: 'feedback_shown' {variant,
   hasBlocks, hypercorrection, elements: [...]}, 'feedback_expand'
   {section: 'full'|'distractors'} (onToggle na <details>,
   FeedbackPanel.tsx:109-118). Zapis przez istniejącą ścieżkę
   eventów (completeSession.ts:414 — sprawdź, jak dziś lecą
   leech_hit, zrób tak samo, batchowane, nie 1 request na klik).
2. feedback_dwell_seconds: zapisuj dla WSZYSTKICH, nie tylko treatment
   (recordFeedbackDwell.ts:42-44). To jest baseline, bez niego
   eksperyment nie ma z czym porównać.
3. Widok public.distractor_stats_90d (materialized, odświeżany raz
   dziennie przez pg_cron albo skrypt): question_id, option_id,
   n_selected, pct_of_answers, pct_of_wrong, n_total. Z session_answers
   po selected_option_id (G.1, G.2). Skrypt
   scripts/export-distractor-stats.mjs [--subject X] → CSV dla fabryki
   z progami: ≥15% błędnych = 'pisz', 3–15% = 'opcjonalnie', <3% =
   'martwy dystraktor'.
4. Widok public.ufo_coverage: per subject_id: total, blocks_status
   none/draft/reviewed, żywe (>100 odp./90 dni) bez bloków. To jest
   licznik postępu migracji.
5. Zapytania metryk eksperymentu (docs/UFO-METRYKI.sql, nic nie
   wdrażasz, tylko SQL do odpalenia ręcznie): dla treatment vs control:
   (a) trafność przy NASTĘPNEJ powtórce tego samego pytania,
   (b) delta stability_after - stability_before,
   (c) odsetek ponownego wyboru tego samego dystraktora przy
   następnej próbie, (d) feedback_expand rate per wariant,
   (e) mediana dwell per wariant. Każde z podziałem na wariant i
   hasBlocks.

W PR: migracje, widoki, skrypt, przykładowy CSV dla chirurgii (10
wierszy), wynik ufo_coverage.
```

---

## KROK 10 — CI i rollout [BRAMKA]

```
Zadanie: domknięcie.

1. CI: .github/workflows — npm test na każdym PR (H.3: dziś tylko
   audit:check). Jeśli testy trwają > 5 min, podziel na unit/spec.
2. Guardrail rolloutu (docs/UFO-ROLLOUT.md): warunek w miejscu użycia
   selectFeedbackVariant (SessionStudyView.tsx:196-202,
   submitAnswer.ts:239-243) — treatment aktywny tylko, gdy
   question.hasBlocks; pytania bez bloków zawsze standard z prozą,
   niezależnie od kubełka. Ten warunek MUSI być zmergowany przed
   KROKIEM 6 (bramka), bo eksperyment idzie na 5%
   (set-learning-experiment-rollout.mjs, F.2) od razu po wsadzie
   chirurgii na prod, gdy pokrycie to ~2,3k z 18,8k pytań.
   feedback_variant w session_answers + hasBlocks w feedback_shown
   pozwalają odfiltrować pytania bez bloków w metrykach.
3. Tydzień po 5%: odpal docs/UFO-METRYKI.sql, wklej wyniki. Progi
   przejścia na 25%: (a) nie gorsze niż control o więcej niż 2 p.p.,
   (c) lepsze lub równe, brak wzrostu zgłoszeń błędów w wyjaśnieniach.
4. Legenda dla użytkownika (STANDARD-WYJASNIEN.md sekcja 5,
   przepisana bez emoji na etykiety Zasada/Pułapka) jako dymek „?"
   przy pierwszym FeedbackPanel z blokami — jednorazowo per user
   (localStorage wystarczy).
```

> **[BRAMKA]** Decyzja o 25% i 100% po metrykach. Równolegle kolejka
> migracji (D9) leci batchami przez KROK 4 z raportami.

---

## Krok kontrolny (wklej po KAŻDYM kroku)

```
Zadanie kontrolne. Wyniki, nie opisy.

1. git diff --stat: lista plików. Każdy plik poza zakresem kroku —
   uzasadnij albo cofnij.
2. npm test: pełny wynik. Zero pominiętych.
3. Jeśli krok miał migrację: pokaż list_migrations z nową pozycją i
   SELECT potwierdzający stan (constraint / kolumna / funkcja).
4. scheduler.spec.ts, conceptTransfer.spec.ts, mapSessionQuestion.spec.ts
   przechodzą bez zmian w ich treści (dowód: git diff na tych plikach
   pusty albo tylko importy).
5. Dla kroków 2–8: na branchu ufo-staging otwórz pytanie chs-12-010
   w sesji i w katalogu — screenshot obu. explanation w katalogu ==
   render z bloków (porównaj md5 z SELECT).
```

## Prompt awaryjny — „inaczej, ale działa"

```
Stop. Porównaj: definicje FSRS/mastery/readiness/leech i
confidenceToRating przed i po Twojej zmianie — jakakolwiek różnica =
cofnij. Sprawdź, czy explanation dla pytań BEZ bloków jest bajt w bajt
identyczne z tym sprzed PR (SELECT md5(explanation) na 20 losowych id
z blocks_status='none', przed/po). Różnica = coś renderuje, czego nie
powinno. Wypisz i cofnij.
```

---

## Co dzieje się po mojej stronie równolegle (nie dla Cursora)

- Konwerter: prompt „zero nowych faktów" dla 13,4k pytań `own` +
  4,6k `uczelnia` z prozą poza Standardem → JSONL v2 + raport
  DO-UZUPEŁNIENIA per pole. Kolejność D9.
- Pisarz: 1363 puste minus stoma-angielski = 2 pytania (!) — czyli
  pisarz od zera to dziś margines; jego prawdziwa robota to
  DO-UZUPEŁNIENIA z konwertera (brakujące dystraktory, trap) z książką
  jako bazą wiedzy i klikalnością z KROKU 9 jako priorytetem.
- Walidator JSONL po stronie fabryki = ten sam kontrakt co
  explanation_blocks_valid (port w Pythonie, te same 12 fixture'ów).
