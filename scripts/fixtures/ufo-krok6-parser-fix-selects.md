# UFO parser-fix — SELECT-y na `ufo-staging`

Branch: `slmeaosqkyqehcicwoja`. Data: 2026-09-06.
Te same RPC co `rollback-blocks.mjs` / `apply-blocks.mjs`
(`rollback_explanation_blocks`, `apply_explanation_blocks(..., 'parser', false)`
w partiach po 50). REST skryptów nie poszedł: na branchu brak
`service_role` w `.env.staging`; wywołanie jako `postgres` przez MCP.

Prod `unfcpipxraiyacyzqanh` nietknięty.

## 1. Rollback

```sql
SELECT rollback_explanation_blocks(ARRAY(
  SELECT q.id
  FROM public.questions q
  JOIN public.topics t ON t.id = q.topic_id
  WHERE t.subject_id = 'ldew-chirurgia-stomatologiczna'
  ORDER BY q.id
));
```

| ok | restored | skipped |
| --- | ---: | ---: |
| true | 2349 | 0 |

Po rollbacku: `blocks_status = none` × 2349.

## 2. Apply

47 chunków × max 50. Wynik: **2349 applied, 0 rejected**.

## 3. `blocks_status` po apply

```sql
SELECT q.blocks_status, count(*)
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
WHERE t.subject_id = 'ldew-chirurgia-stomatologiczna'
GROUP BY 1;
```

| blocks_status | count |
| --- | ---: |
| draft | 2349 |

## 4. `chs-04-109`

```sql
SELECT id, correct_option_id, options, explanation_blocks
FROM public.questions
WHERE id = 'chs-04-109';
```

| pole | wartość |
| --- | --- |
| id | chs-04-109 |
| correct_option_id | c (`2 i 4`) |
| blocks_status | draft |
| blocks_source | parser |
| options.a | `2, 3 i 4` |
| options.b | `3 i 5` |
| options.c | `2 i 4` |
| options.d | `1, 2, 4 i 5` |
| options.e | `1 i 2` |
| distractors.d | dokłada przewagę częstości typu drugiego oraz trwałe działanie desmopresyny, choć obie te cechy są odwrócone. |
| distractors.e | dokłada przewagę częstości typu drugiego nad pierwszym, choć proporcja przebiega odwrotnie. |
| distractors.b | łączy błędne dziedziczenie sprzężone z płcią z błędnym opisem czasu działania desmopresyny. |
| distractors.a | (brak — w źródle nie ma linii dla „2, 3 i 4”) |

`{1,2}` ≠ `{1,2,4,5}` — bez similarity.

## 5. Prod (kontrolny)

```sql
SELECT q.blocks_status, count(*)
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
WHERE t.subject_id = 'ldew-chirurgia-stomatologiczna'
GROUP BY 1;
```

| blocks_status | count |
| --- | ---: |
| none | 2349 |
