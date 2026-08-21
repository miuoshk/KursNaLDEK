BEGIN;

DELETE FROM public.cem_question_occurrences;

UPDATE public.questions
SET source = 'own',
    first_seen_session = NULL,
    repeat_count = 0
WHERE source IN ('cem', 'uczelnia');

DELETE FROM public.cem_sessions
WHERE id ~ '^(ldek|ldew|lek)-[0-9]{4}-s[0-9]+$';

COMMIT;
