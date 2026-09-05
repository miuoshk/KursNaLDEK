# parse-standard-v1 — poprawki numeryczne / elimination / inwariant per sekcja

Źródło: prod, read-only `--from-db`. Wsad: rollback + apply na branchu
`ufo-staging` (`slmeaosqkyqehcicwoja`). **Prod nietknięty.**

Parser: `npx tsx scripts/parse-standard-v1.ts --from-db ldew-chirurgia-stomatologiczna`

CSV dla fabryki: `scripts/out/chs-do-uzupelnienia.csv`
(kopia w PR: `scripts/fixtures/chs-do-uzupelnienia.csv`)

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

- verdict_mismatch: 817
- too_long: 0
- distractor_unmatched: 276 (nadal; drugi przebieg nic nie odzyskał)
- distractor_matched_by_elimination: **0**
- contrast_too_big: 0
- takeaway_too_long: 2
- unparsed_remainder: 0

### elimination (odzyskane)

0 pozycji. Dla 276 unmatched zostawało więcej niż jedna wolna opcja,
albo jedyna wolna była listą numeryczną (reguła 1, bez elimination),
albo similarity do niej było < 0.5.

### odrzucone

- (brak)

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
- chs-02-021 wsad — verdict_mismatch: werdykt="stwierdzenia 2 i 5" klucz="2 i 5" similarity=0.400; distractor_unmatched: 2, 3 i 4
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

## Inwariant per sekcja

Port porównania w `scripts/lib/sectionInvariant.ts` (nie Levenshtein na całości).

| sekcja | różnice |
| --- | ---: |
| a) mechanizm / correctReason | **0** |
| b) dystraktory (multiset minus unmatched) | **0** |
| c) trap | **0** |
| d) takeaway (poza 2× takeaway_too_long) | **0** |
| e) contrast | **0** |

17 tabel GFM siedziało między werdyktem a „Dlaczego nie pozostałe?” i
wcześniej wpadało do `correctReason`. Inwariant to wykrył; parser teraz
zostawia tabelę na `contrast` (np. `chs-02-007`).

## Staging (pkt 4)

`rollback_explanation_blocks` na wszystkich id chirurgii → 2349 `none`.
`apply_explanation_blocks(..., 'parser', false)` w partiach po 50.

```
SELECT q.blocks_status, count(*)
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
WHERE t.subject_id = 'ldew-chirurgia-stomatologiczna'
GROUP BY 1;
```

| blocks_status | count |
| --- | ---: |
| draft | 2349 |

```
SELECT id, blocks_status, blocks_source,
       explanation_blocks->'distractors' AS distractors
FROM public.questions WHERE id = 'chs-04-109';
```

| | |
| --- | --- |
| id | chs-04-109 |
| blocks_status | draft |
| blocks_source | parser |
| distractors.d | „1, 2, 4 i 5” — dokłada przewagę częstości typu drugiego… |
| distractors.e | „1 i 2” — dokłada przewagę częstości typu drugiego nad pierwszym… |
| distractors.b | „3 i 5” — łączy błędne dziedziczenie… |
| distractors.a | (brak — w źródle nie ma linii dla „2, 3 i 4”) |

Opcje: a=`2, 3 i 4` b=`3 i 5` c=`2 i 4` (klucz) d=`1, 2, 4 i 5` e=`1 i 2`.
Bez similarity: `{1,2}` nie wchodzi na `{1,2,4,5}`.

Prod (ten sam SELECT na `unfcpipxraiyacyzqanh`): `with_blocks=0`, `draft=0`.
