# Cutover personalizacji — 26 sierpnia 2026, noc

Cel na dziś: schemat + apka na produkcji, rollouty **0%**.
Nie dziś: treatment 5%, replay 2,6 mln, trening wag.

## Zrobione / nie zrobione

- Kod jest lokalny, niecommitowany (~146 plików). Produkcja = `main`.
- Baza nie ma memory v2 / eksperymentów / planu dnia.
- Unique `(session_id, question_id)` już jest.
- Unique `(session_id, question_order)` **nie tworzyć** — 1006 duplikatów.

## Kolejność (nie odwrotnie)

1. Commit **tylko** wycinka personalizacji (sesja, pulpit, ustawienia, statystyki, i18n, skrypty 2026-08-25, package.json). Bez handoverów LDEK i bez mieszania z CEM inbox, jeśli nie musi iść w tym samym pociągu.
2. Push na `main` (to jest produkcja). Vercel buduje.
3. SQL addytywny **zanim** nowa apka dostanie ruch, ale **bez** kasowania polityk INSERT:
   - `2026-08-21-cem-rls.sql`
   - `2026-08-25-personalized-learning-events.sql` bez pętli `DROP POLICY`
   - `2026-08-25-daily-study-plan.sql`
   - `2026-08-25-fsrs-memory-v2.sql`
   - `2026-08-25-learning-concepts.sql`
   - `2026-08-25-memory-v2-experiment.sql`
4. Czekać aż Vercel production = zielony.
5. Smoke: jedna inteligentna sesja, zapis odpowiedzi, brak toastu błędu.
6. Dopiero wtedy pętla `DROP POLICY` + polityki SELECT-only z pliku events.
7. `2026-08-25-learning-indexes-concurrently.sql` przez `psql` (nie w transakcji).
8. Backfill `average_question_seconds` — osobno, może rano.
9. Eksperymenty zostają 0%. Shadow dual-write sam się zbiera.

## Dziura, której nie da się uniknąć w 100%

Między „kolumny są” a „nowa apka jest na 100% instancji” stary klient nadal zapisze (polityki INSERT żyją). Nowa apka bez kolumn nie zapisze — dlatego SQL addytywny **przed** przełączeniem ruchu.
Między „nowa apka żyje” a „DROP POLICY” oba modele zapisu działają. Potem tylko service role.

## Rollback

- Apka: revert deploy na `main`.
- SQL: nie cofamy `ADD COLUMN`. Cofamy tylko DROP POLICY (przywrócić INSERT/UPDATE jak dziś) jeśli nowa apka padnie.
- Treatment nie będzie włączony, więc nie ma rollbacku v2 due.

## Jutro / crunch — nie ruszać

- `learning:replay` / `optimize` / import memory v2
- `set-learning-experiment-rollout` cokolwiek > 0
- Unique na `question_order`
