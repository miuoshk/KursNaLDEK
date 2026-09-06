# UFO staging

Środowisko do testowania batchy `explanation_blocks` zanim cokolwiek
wpadnie na prod. **Nie ma tu danych użytkowników.**

## Branch

| | |
| --- | --- |
| Nazwa | `ufo-staging` |
| Parent | `unfcpipxraiyacyzqanh` (Kurs na LDEK, eu-central-1) |
| Project ref | `slmeaosqkyqehcicwoja` |
| API | `https://slmeaosqkyqehcicwoja.supabase.co` |
| Plan org | Pro — Branching nie wymagało zmiany planu |
| Koszt brancha | $0.01344 / h (~$10 / mies. przy 24/7) |
| Persistent | nie (preview; po bezczynności może się uśpić) |

## Jak Branching naprawdę zadziałał

`create_branch` **nie kopiuje danych z prod** (`with_data: false`).
Nie skopiował też pełnego schematu. W repozytorium nie ma
`supabase/migrations`, więc branch wstał z prawie pustą bazą
(tylko dwa stare wpisy w `schema_migrations`:
`reset_subject_progress`).

`pg_dump` / `COPY` wymaga hasła bazy; MCP i skrypt idą przez API
(service_role). Treści pytań nie wrzucamy do gita.

Procedura, która działa:

1. `scripts/bootstrap-staging-schema.sql` — tabele potrzebne do UFO
   (subjects, topics, questions z kolumnami v2, concepts,
   question_concepts, question_edits, learning_experiment_configs,
   profiles) plus walidator z KROKU 1.
2. Na branchu: migracje KROK 2 (`render` + triggery) i KROK 4
   (`apply_explanation_blocks` / `rollback_explanation_blocks`).
3. Seed katalogu + podzbioru pytań z prod:
   `scripts/seed-staging-subset.sql` (read-only wybór ID na prod)
   i `scripts/seed-staging-subset.mjs` (kopia przez API).

Migracje już na branchu (`slmeaosqkyqehcicwoja`):

| version | name |
| --- | --- |
| 20260905193724 | `ufo_krok5_staging_schema` |
| 20260905193733 | `ufo_krok5_staging_validator` |
| 20260905193751 | `ufo_krok2` |
| 20260905193814 | `ufo_krok4` |

## Seed

Zbiór: wszystkie `subjects` i `topics`; pytania
`ldew-chirurgia-stomatologiczna` + 500 z `anatomia` + 200 z
`ldew-endodoncja` (kolejność `md5(id || 'ufo-staging-2026')`);
`question_concepts` tych pytań i wskazane `concepts`;
`learning_experiment_configs`. Bez `profiles` studentów, odpowiedzi,
sesji.

Dry-run na prod (2026-09-05):

```json
{
  "subjects": 41,
  "topics": 323,
  "questions": 3049,
  "chirurgia": 2349,
  "anatomia": 500,
  "endodoncja": 200,
  "question_concepts": 1200,
  "concepts": 397,
  "experiment_configs": 3
}
```

```bash
# read-only, pokazuje liczniki (wymaga SUPABASE_SERVICE_ROLE_KEY z prod)
node scripts/seed-staging-subset.mjs

# kopia na branch (wymaga STAGING_SUPABASE_SERVICE_ROLE_KEY z Dashboardu)
set -a && source .env.local && source .env.staging && set +a
node scripts/seed-staging-subset.mjs --apply
```

MCP nie oddaje `service_role` brancha. Pełne 3049 pytań idzie więc
przez skrypt po wklejeniu klucza z Dashboard → Settings → API.

Na branchu jest już to, co wystarcza do bramki apply/rollback:

- 41 `subjects`, 3 `learning_experiment_configs`
- topic `CHS-01` + trzy pytania dowodowe `chs-01-001`…`003`
  (proza zastępcza, nie pełny tekst z prod — treść pytań nie idzie do gita)
- jedno konto admina (Auth + `profiles.role = admin`)

## Lokalna apka na branchu

1. Dashboard brancha → Settings → API: skopiuj **service_role**
   (anon jest w `.env.staging.example`).
2. `cp .env.staging.example .env.staging` i uzupełnij klucze oraz
   `STAGING_ADMIN_PASSWORD`.
3. Odpal Next na pliku staging, nie na `.env.local`:

```bash
set -a && source .env.staging && set +a
npm run dev
```

Albo: `cp .env.staging .env.local` na czas testu (nie commituj).

## Admin na branchu

Auth na preview jest pusty poza jednym kontem:

- e-mail: `ufo-staging-admin@kursnaldek.local`
- hasło: `STAGING_ADMIN_PASSWORD` w lokalnym `.env.staging` (nie w gitcie)
- `profiles.role = admin`, nick `ufo-admin`
- `email_confirmed_at` ustawione — logowanie bez maila

Logowanie: ta sama strona `/logowanie` co na prod, przy
`NEXT_PUBLIC_SUPABASE_URL` wskazującym na branch.

## Batch na staging

```bash
set -a && source .env.staging && set +a
node scripts/apply-blocks.mjs scripts/fixtures/ufo-krok4-sample.jsonl --source parser
# potem --apply i TAK na stdin
node scripts/rollback-blocks.mjs --from-report scripts/out/apply-….md
```

`--apply` na **prodzie** nadal jest zakazane w tym kroku.

Dowód z 2026-09-05 (RPC na branchu, te same funkcje co skrypty;
`p_source = parser`, trzy pozycje z `ufo-krok4-sample.jsonl`):
`chs-01-001` i `chs-01-002` → `applied` (render 832 / 188),
`chs-01-003` → `rejected` (`invalid_blocks`). Rollback przywrócił
001/002; 003 pominięte (`no_blocks`). Oba SELECT-y:
`scripts/fixtures/ufo-krok5-proof.md`.
