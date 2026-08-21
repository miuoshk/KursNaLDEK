BEGIN;

-- 1. sesje CEM z etykiet source_exam
INSERT INTO public.cem_sessions (id, product, short_code, label, is_published)
SELECT DISTINCT
  lower((regexp_match(q.source_exam,'^(LDEK|LDEW|LEK)'))[1]) || '-' ||
    (regexp_match(q.source_exam,'([0-9]{4})'))[1] || '-s' ||
    (regexp_match(q.source_exam,'sesja ([0-9]+)'))[1],
  lower((regexp_match(q.source_exam,'^(LDEK|LDEW|LEK)'))[1]),
  CASE (regexp_match(q.source_exam,'^(LDEK|LDEW|LEK)'))[1]
       WHEN 'LDEK' THEN 'd' WHEN 'LDEW' THEN 'w' ELSE 'l' END ||
    right((regexp_match(q.source_exam,'([0-9]{4})'))[1],2) || 's' ||
    (regexp_match(q.source_exam,'sesja ([0-9]+)'))[1],
  q.source_exam,
  false
FROM public.questions q
WHERE q.source_exam ~ '^(LDEK|LDEW|LEK) [0-9]{4} sesja [0-9]+$'
ON CONFLICT (id) DO NOTHING;

-- 2. oznacz pytania CEM
UPDATE public.questions q
SET source = 'cem',
    first_seen_session = s.id
FROM public.cem_sessions s
WHERE q.source_exam = s.label
  AND q.source_exam ~ '^(LDEK|LDEW|LEK) [0-9]{4} sesja [0-9]+$';

-- 3. oznacz pytania uczelniane
UPDATE public.questions
SET source = 'uczelnia'
WHERE source_exam IS NOT NULL
  AND source_exam !~ '^(LDEK|LDEW|LEK) [0-9]{4} sesja [0-9]+$';

-- 4. wystąpienia — BEZ question_number, bo source_code go nie zawiera wiarygodnie
INSERT INTO public.cem_question_occurrences (cem_session_id, question_id, question_number)
SELECT q.first_seen_session, q.id, NULL
FROM public.questions q
WHERE q.source = 'cem' AND q.first_seen_session IS NOT NULL
ON CONFLICT DO NOTHING;

SELECT public.refresh_cem_repeat_counts();

COMMIT;
