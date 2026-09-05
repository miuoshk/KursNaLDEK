# UFO KROK 5 — dowód apply / rollback na `ufo-staging`

Branch: `slmeaosqkyqehcicwoja` (parent `unfcpipxraiyacyzqanh`).
Batch: `scripts/fixtures/ufo-krok4-sample.jsonl` przez
`apply_explanation_blocks(..., 'parser', false)`.

Wynik RPC: `chs-01-001` applied (832), `chs-01-002` applied (188),
`chs-01-003` rejected (`invalid_blocks`).

Proza na branchu jest zastępcza (`proza chs-01-00x`), nie pełny tekst
z prod — dowód dotyczy statusu bloków i rollbacku, nie treści egzaminu.

## SELECT po `--apply`

```sql
SELECT id, blocks_status, left(explanation, 120), left(explanation_legacy, 60)
FROM public.questions
WHERE id IN ('chs-01-001','chs-01-002','chs-01-003')
ORDER BY id;
```

| id | blocks_status | left(explanation, 120) | left(explanation_legacy, 60) |
| --- | --- | --- | --- |
| chs-01-001 | draft | `**Poprawna odpowiedź:** obecność w tym obszarze anatomicznym narządów zmysłów oraz bliskie sąsiedztwo centralnego układu` | `proza chs-01-001` |
| chs-01-002 | draft | `**Poprawna odpowiedź:** 1, 2 i 3` + `Prawdziwe są wyłącznie trzy pierwsze stwierdzenia z listy podanej w pytaniu.` + `> **Zasa` | `proza chs-01-002` |
| chs-01-003 | none | `proza chs-01-003` | `NULL` |

## SELECT po `rollback-blocks`

`rollback_explanation_blocks(ARRAY['chs-01-001','chs-01-002','chs-01-003'])`
→ restored `chs-01-001`, `chs-01-002`; skipped `chs-01-003` (`no_blocks`).

```sql
SELECT id, blocks_status, left(explanation, 120), left(explanation_legacy, 60)
FROM public.questions
WHERE id IN ('chs-01-001','chs-01-002','chs-01-003')
ORDER BY id;
```

| id | blocks_status | left(explanation, 120) | left(explanation_legacy, 60) |
| --- | --- | --- | --- |
| chs-01-001 | none | `proza chs-01-001` | `proza chs-01-001` |
| chs-01-002 | none | `proza chs-01-002` | `proza chs-01-002` |
| chs-01-003 | none | `proza chs-01-003` | `NULL` |
