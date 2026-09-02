-- Usuwa nieużywany moduł OSCE: tabele, treści, historię sesji i kolumny stacji.
-- Stare migracje (osce-simulation-schema, 2026-05-17 RLS) zostają w repo jako historia.

BEGIN;

CREATE TEMP TABLE _osce_subjects ON COMMIT DROP AS
SELECT id FROM public.subjects
WHERE product = 'osce' OR id = 'stoma-osce';

CREATE TEMP TABLE _osce_questions ON COMMIT DROP AS
SELECT q.id
FROM public.questions q
JOIN public.topics t ON t.id = q.topic_id
WHERE t.subject_id IN (SELECT id FROM _osce_subjects);

CREATE TEMP TABLE _osce_sessions ON COMMIT DROP AS
SELECT id FROM public.study_sessions
WHERE subject_id IN (SELECT id FROM _osce_subjects)
   OR mode = 'osce_topic'
   OR COALESCE(session_kind, '') = 'osce';

DELETE FROM public.session_answers
WHERE session_id IN (SELECT id FROM _osce_sessions)
   OR question_id IN (SELECT id FROM _osce_questions);

DELETE FROM public.error_reports
WHERE question_id IN (SELECT id FROM _osce_questions);

DELETE FROM public.daily_challenges
WHERE subject_id IN (SELECT id FROM _osce_subjects);

DELETE FROM public.study_sessions
WHERE id IN (SELECT id FROM _osce_sessions);

DROP TABLE IF EXISTS public.osce_station_results;
DROP TABLE IF EXISTS public.osce_simulations;
DROP TABLE IF EXISTS public.opg_structures;
DROP TABLE IF EXISTS public.opg_atlas_images;

DELETE FROM public.questions WHERE id IN (SELECT id FROM _osce_questions);
DELETE FROM public.subjects WHERE id IN (SELECT id FROM _osce_subjects);

ALTER TABLE public.subjects DROP COLUMN IF EXISTS exam_tasks;
ALTER TABLE public.subjects DROP COLUMN IF EXISTS exam_day;
ALTER TABLE public.subjects DROP COLUMN IF EXISTS competencies;
ALTER TABLE public.subjects DROP COLUMN IF EXISTS pass_threshold;
ALTER TABLE public.subjects DROP COLUMN IF EXISTS exam_info;

UPDATE public.study_sessions
SET session_kind = 'intelligent'
WHERE session_kind = 'osce';

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_session_kind_chk;
ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_session_kind_chk
  CHECK (session_kind IN ('intelligent', 'classic', 'exam', 'catalog'));

COMMIT;
