# parse-standard-v1 — ldew-chirurgia-stomatologiczna

Źródło: prod, read-only `--from-db`. Wsad: branch `ufo-staging`
(`slmeaosqkyqehcicwoja`). **Nie ruszane prod.**

Parser: `npx tsx scripts/parse-standard-v1.ts --from-db ldew-chirurgia-stomatologiczna`

## Zbiorczo

| | |
| --- | ---: |
| total | 2349 |
| accepted (do wsadu) | 2349 |
| rejected | 0 |
| full (takeaway+trap) | 484 |
| without takeaway | 568 |
| without trap | 1304 |

### flagi

- verdict_mismatch: 817 (głównie „stwierdzenia 1, 2 i 3” vs opcja „1, 2 i 3”; też odmiana: nacięcie/nacięciu)
- too_long: 0
- distractor_unmatched: 276 (brak ≥0.85 albo duplikat tej samej opcji)
- contrast_too_big: 0 (60 tabel GFM weszło, wszystkie ≤ 3×4)
- takeaway_too_long: 2 (zgodnie z audytem: 2 haczyki > 200)
- unparsed_remainder: 0

### odrzucone (dlaczego)

- (brak) — każda pozycja poszła do JSONL

## pierwsze 30 flag (z 926 pozycji z flagą)

- chs-01-002 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2 i 3" klucz="1, 2 i 3" similarity=0.483
- chs-01-009 wsad — verdict_mismatch: werdykt="stwierdzenia 2, 3, 4 i 5" klucz="2, 3, 4 i 5" similarity=0.545
- chs-01-010 wsad — verdict_mismatch: werdykt="stwierdzenia 4 i 5" klucz="4 i 5" similarity=0.400
- chs-02-003 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2 i 3" klucz="1, 2 i 3" similarity=0.483
- chs-02-010 wsad — verdict_mismatch: werdykt="stwierdzenia 3 i 4" klucz="3 i 4" similarity=0.400
- chs-02-013 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 4 i 5" klucz="1, 4 i 5" similarity=0.483
- chs-02-014 wsad — verdict_mismatch: werdykt="stwierdzenia 2 i 4" klucz="2 i 4" similarity=0.400
- chs-02-016 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2, 3 i 5" klucz="1, 2, 3 i 5" similarity=0.545
- chs-02-020 wsad — verdict_mismatch: werdykt="stwierdzenia 3, 4 i 5" klucz="3, 4 i 5" similarity=0.483
- chs-02-021 wsad — verdict_mismatch: werdykt="stwierdzenia 2 i 5" klucz="2 i 5" similarity=0.400; distractor_unmatched: 2, 3 i 4 (duplikat a)
- chs-02-026 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2, 4 i 5" klucz="1, 2, 4 i 5" similarity=0.545
- chs-02-028 wsad — verdict_mismatch: werdykt="stwierdzenia 3 i 5" klucz="3 i 5" similarity=0.400
- chs-02-030 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2 i 4" klucz="1, 2 i 4" similarity=0.483
- chs-02-032 wsad — distractor_unmatched: zajęcie dolnych dróg oddechowych następuje przy lepszej odporności chorego
- chs-02-033 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2 i 5" klucz="1, 2 i 5" similarity=0.483
- chs-02-036 wsad — verdict_mismatch: werdykt="stwierdzenia 4 i 5" klucz="4 i 5" similarity=0.400
- chs-02-037 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2, 3 i 4" klucz="1, 2, 3 i 4" similarity=0.545
- chs-02-038 wsad — distractor_unmatched: maseczka FFP2…; rękawice jednorazowe…; fartuch jednorazowy…
- chs-02-039 wsad — distractor_unmatched: wirus wchłania się przez nieuszkodzoną skórę rąk
- chs-02-040 wsad — verdict_mismatch: werdykt="nacięcie ropnia…" klucz="nacięciu ropnia…"
- chs-02-041 wsad — verdict_mismatch: werdykt="stwierdzenia 1 i 3" klucz="1 i 3" similarity=0.400
- chs-02-042 wsad — verdict_mismatch: werdykt="odsunięcie jej od pracy…" klucz="odsunięciu jej od pracy…"; distractor_unmatched: skierowaniu jej na 30-dniową kwarantannę
- chs-03-002 wsad — verdict_mismatch: werdykt="stwierdzenia 1 i 2" klucz="1 i 2" similarity=0.400
- chs-03-004 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2, 3 i 4" klucz="1, 2, 3 i 4" similarity=0.545
- chs-03-006 wsad — verdict_mismatch: werdykt="stwierdzenia 2, 3 i 5" klucz="2, 3 i 5" similarity=0.483
- chs-03-008 wsad — verdict_mismatch: werdykt="stwierdzenia 1 i 3" klucz="1 i 3" similarity=0.400
- chs-03-015 wsad — verdict_mismatch: werdykt="stwierdzenia 2, 3, 4 i 5" klucz="2, 3, 4 i 5" similarity=0.545
- chs-04-003 wsad — verdict_mismatch: werdykt="stwierdzenia 1 i 3" klucz="1 i 3" similarity=0.400
- chs-04-004 wsad — verdict_mismatch: werdykt="stwierdzenia 1, 2, 3 i 5" klucz="1, 2, 3 i 5" similarity=0.545
- chs-04-009 wsad — verdict_mismatch: werdykt="stwierdzenia 2 i 4" klucz="2 i 4" similarity=0.400

## Inwariant render vs oryginał

Port `render_explanation_blocks` w TS **tylko w teście**
(`scripts/lib/renderExplanationBlocks.ts`). Normalizacja: zdejmij emoji,
Haczyk→Zasada, ujednolić białe znaki i separatory GFM.

**1007 / 2349 (42.9%) powyżej 5% znaków.**

To nie jest zgubiony akapit (`unparsed_remainder = 0`, `correctReason`
kopiowane 1:1). Różnice biorą się z kontraktu renderu:

1. Werdykt z `options[correct_option_id].text`, nie z linii `**✅ Poprawna odpowiedź:** X` (817 parafraz „stwierdzenia …”).
2. Kolejność dystraktorów wg `options[]`, nie wg kolejności w prozie.
3. Oryginał często pomija 1–2 złe opcje — render też, ale w innej kolejności linie się rozjeżdżają (Levenshtein).
4. GFM: `|---|` vs `| --- |`.

Parser nie gubi sekcji szablonu. 1007 to test sztywnego porównania znaków, nie utraty treści.

## Apply na ufo-staging

Ta sama RPC `apply_explanation_blocks(..., 'parser', false)` co
`apply-blocks.mjs --apply`, w partiach po 50 (47 chunków + 39 uzupełnionych
po poprawce paginacji `.order('id')`).

`SELECT blocks_status, count(*) … chirurgia` → **2349 draft**. Prod nietknięty.

## Screenshoty 390 px (branch ufo-staging, 2026-09-05)

Sesja `przeglad` ×10, FeedbackPanel (dziś: `correctReason`; KROK 7 jeszcze nie rusza panelu):

1. `scripts/fixtures/ufo-krok6-screenshots/ufo-krok6-04-session-q1-feedback.png` — Q1 poprawna
2. `scripts/fixtures/ufo-krok6-screenshots/ufo-krok6-05-session-q2-feedback.png` — Q2 błędna
3. `scripts/fixtures/ufo-krok6-screenshots/ufo-krok6-06-session-q3-feedback.png` — Q3 błędna (leukoplakia)

Katalog (`mode=katalog`, Nauka, pełne `explanation`):

4. `…/ufo-krok6-01-catalog-chs-01-001.png` — chs-01-001
5. `…/ufo-krok6-02-catalog-chs-03-002.png` — chs-03-002
6. `…/ufo-krok6-03-catalog-chs-12-010.png` — chs-12-010
7. `…/ufo-krok6-07-catalog-contrast-chs-04-008.png` — tabela GFM 3×3 + Zasada
8. `…/ufo-krok6-08-catalog-no-takeaway-chs-01-008.png` — Pułapka, bez takeaway
