# UFO handoff — wsad na staging

Cel: Claude / parser wrzuca bloki na **ufo-staging**, nie na produkcję.

## Docelowy staging

| | |
| --- | --- |
| Branch Supabase | `ufo-staging` |
| Project ref | `slmeaosqkyqehcicwoja` |
| API | `https://slmeaosqkyqehcicwoja.supabase.co` |
| Parent (prod, nie ruszać) | `unfcpipxraiyacyzqanh` |

Klucz `service_role` jest w Dashboardze brancha (Settings → API) i w lokalnym `.env.staging`. **Nie wklejaj kluczy do czatu ani do tego pliku.**

Migracja `ufo_statement_set` jest na tym branchu (version `20260909232259`). Status brancha `MIGRATIONS_FAILED` pochodzi z utworzenia preview 2026-09-05 (brak `supabase/migrations` w repo — branching nie wgrał schematu z prod). Schemat UFO jest dołożony ręcznie. **Nie rób rebase/reset** — zniszczy seed. Nie aplikuj `scripts/20260909033000_ufo_statement_set.sql` na prod.

## Kontrakt wsadu

Jedna linia JSON = jedna pozycja. Parser pisze `scripts/out/*.jsonl`. Na bazę idzie to samo przez `apply-blocks.mjs`.

Wspólne pola pozycji **po parserze**:

```json
{
  "id": "question-id",
  "source": "parser",
  "blocks": {},
  "refs": ["opcjonalne źródło"]
}
```

`source` przy apply: `parser` | `converter` | `writer` | `manual`. Max 50 pozycji na RPC.

### SBA — wejście `parse-standard-v1`

Proza Standard 1.0, nie odtwarzaj zestawienia z zdań „— prawda”.

```json
{
  "id": "ufo-sba-ok-20260910",
  "correct_option_id": "a",
  "options": [
    { "id": "a", "text": "raz" },
    { "id": "b", "text": "dwa" }
  ],
  "explanation": "**Poprawna odpowiedź:** raz\n\nTEST SBA. Powód poprawnej odpowiedzi.\n\n**Dlaczego nie pozostałe?**\n\n- *dwa* — TEST. To dystraktor.\n\n> **Zasada:** TEST SBA zasada."
}
```

```bash
npx tsx scripts/parse-standard-v1.ts path/do/sba.jsonl
# → scripts/out/standard-v1.jsonl
```

Sprawdzony wynik na stagingu (`ufo-sba-ok-20260910`, apply `parser`, 2026-09-10):

```json
{
  "id": "ufo-sba-ok-20260910",
  "source": "parser",
  "blocks": {
    "version": 2,
    "correctReason": "TEST SBA. Powód poprawnej odpowiedzi.",
    "takeaway": "TEST SBA zasada.",
    "distractors": { "b": "TEST. To dystraktor." }
  },
  "refs": ["ufo-probe-20260910"]
}
```

Wygenerowane `explanation` (trigger):

```
**Poprawna odpowiedź:** raz

TEST SBA. Powód poprawnej odpowiedzi.

**Dlaczego nie pozostałe?**

- *dwa* — TEST. To dystraktor.

> **Zasada:** TEST SBA zasada.
```

SBA **nie** ma `questionType: "statement_set"`, `statements` ani `optionStatements`. Klucz dystraktora ≠ `correct_option_id`.

### Zestawienie — wejście `parse-statement-set-v1`

Jawne `statements` + `optionStatements`. Parser **nie** zgaduje prawda/fałsz z prozy.

```json
{
  "id": "ufo-ss-ok-20260910",
  "questionType": "statement_set",
  "correct_option_id": "a",
  "options": [
    { "id": "a", "text": "1" },
    { "id": "b", "text": "1 i 2" }
  ],
  "takeaway": "TEST SET zasada.",
  "trap": "TEST. Numer opcji to nie numer stwierdzenia.",
  "statements": [
    {
      "id": "s1",
      "number": 1,
      "text": "Koło ma jedną krawędź",
      "isTrue": true,
      "rationale": "TEST. Jedna krawędź."
    },
    {
      "id": "s2",
      "number": 2,
      "text": "Trójkąt ma cztery boki",
      "isTrue": false,
      "rationale": "TEST. Ma trzy.",
      "correction": "Trójkąt ma trzy boki."
    }
  ],
  "optionStatements": {
    "a": ["s1"],
    "b": ["s1", "s2"]
  }
}
```

`parse-standard-v1.ts` przekieruje taką linię do tego samego parsera, jeśli widzi `questionType: "statement_set"` albo `statements` / `optionStatements`.

```bash
npx tsx scripts/parse-statement-set-v1.ts path/do/zestawienie.jsonl
# → scripts/out/statement-set-v1.jsonl
```

Sprawdzony wynik na stagingu (`ufo-ss-ok-20260910`):

```json
{
  "id": "ufo-ss-ok-20260910",
  "source": "parser",
  "blocks": {
    "version": 2,
    "questionType": "statement_set",
    "takeaway": "TEST SET zasada.",
    "trap": "TEST. Numer opcji to nie numer stwierdzenia.",
    "statements": [
      {
        "id": "s1",
        "number": 1,
        "text": "Koło ma jedną krawędź",
        "isTrue": true,
        "rationale": "TEST. Jedna krawędź."
      },
      {
        "id": "s2",
        "number": 2,
        "text": "Trójkąt ma cztery boki",
        "isTrue": false,
        "rationale": "TEST. Ma trzy.",
        "correction": "Trójkąt ma trzy boki."
      }
    ],
    "optionStatements": {
      "a": ["s1"],
      "b": ["s1", "s2"]
    }
  },
  "refs": ["ufo-probe-20260910"]
}
```

Wygenerowane `explanation`:

```
**Poprawna odpowiedź:** 1

> **Zasada:** TEST SET zasada.

**Stwierdzenia**

1. Koło ma jedną krawędź — Prawda
TEST. Jedna krawędź.

2. Trójkąt ma cztery boki — Fałsz
TEST. Ma trzy.
Trójkąt ma trzy boki.

> **Pułapka:** TEST. Numer opcji to nie numer stwierdzenia.
```

Zestawienie **nie** ma `distractors`. Dokładnie jedna opcja musi być zbiorem stwierdzeń `isTrue: true`; ta opcja musi być `correct_option_id`. Sprzeczny wsad (np. true-set = `b`, a klucz pytania = `a`) wraca `rejected` / `invalid_blocks` i **nie nadpisuje** poprzednich bloków. Sprawdzone: `optionStatements` `{a:[s1,s2], b:[s1]}` przy kluczu `a` → `invalid_blocks`.

## Import na staging

Pytanie musi **już istnieć** w `questions` (id, options, correct_option_id). RPC nie tworzy wiersza.

```bash
set -a && source .env.staging && set +a
node scripts/apply-blocks.mjs scripts/out/statement-set-v1.jsonl \
  --source parser \
  --project-ref slmeaosqkyqehcicwoja
# dry-run, potem to samo z --apply i TAK na stdin
```

Rollback: `node scripts/rollback-blocks.mjs --from-report scripts/out/apply-….md` (też tylko staging).

Sonda testowa (treść TEST UFO, temat `CHS-01`): `ufo-ss-ok-20260910`, `ufo-sba-ok-20260910`. Można nadpisać kolejnym apply. Nie ruszaj prod (`unfcpipxraiyacyzqanh`).
