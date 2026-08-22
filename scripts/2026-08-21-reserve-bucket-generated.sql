BEGIN;

-- Kolumna GENEROWANA zamiast jednorazowego UPDATE.
-- hashtext() jest IMMUTABLE (sprawdzone: pg_proc.provolatile = 'i'),
-- wiec Postgres pozwala jej uzyc w wyrazeniu generujacym.
-- Od teraz zaden insert nie moze wstawic zlej wartosci: probe nadpisania
-- baza odrzuca bledem "can only be updated to DEFAULT".
ALTER TABLE public.questions DROP COLUMN reserve_bucket;

ALTER TABLE public.questions
  ADD COLUMN reserve_bucket smallint
  GENERATED ALWAYS AS ((abs(hashtext(id)::bigint) % 100)::smallint) STORED;

COMMENT ON COLUMN public.questions.reserve_bucket IS
  'Deterministyczny kubelek 0-99 z hasha id. Kolumna generowana - nie wstawiaj jej i nie aktualizuj recznie. Rezerwa puli referencyjnej to bucket >= 70.';

COMMIT;
