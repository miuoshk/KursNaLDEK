-- Uruchomić przez psql poza blokiem BEGIN/COMMIT. Indeksy dotyczą tabel z
-- milionami rekordów i nie mogą blokować zapisu odpowiedzi podczas wdrożenia.

\set ON_ERROR_STOP on

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_answers_scheduler_version
  ON public.session_answers (scheduler_version, answered_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_answers_delayed_outcome
  ON public.session_answers (question_id, answered_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_answers_answered_at
  ON public.session_answers USING brin (answered_at);
-- Unique (session_id, question_order) NIE tworzonym: produkcja ma 1006 sesji
-- ze zduplikowanym question_order. Unique (session_id, question_id) już jest.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
  session_answers_session_question_unique
  ON public.session_answers (session_id, question_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_events_user_type_created
  ON public.learning_events (user_id, event_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_events_session
  ON public.learning_events (session_id)
  WHERE session_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_events_question
  ON public.learning_events (question_id)
  WHERE question_id IS NOT NULL;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
  idx_learning_events_answer_type_unique
  ON public.learning_events (answer_id, event_type)
  WHERE answer_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_events_subject
  ON public.learning_events (user_id, subject_id, created_at DESC)
  WHERE subject_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_events_topic
  ON public.learning_events (topic_id)
  WHERE topic_id IS NOT NULL;

ALTER TABLE public.learning_events
  VALIDATE CONSTRAINT learning_events_session_fk;
ALTER TABLE public.learning_events
  VALIDATE CONSTRAINT learning_events_question_fk;
ALTER TABLE public.learning_events
  VALIDATE CONSTRAINT learning_events_answer_fk;
ALTER TABLE public.learning_events
  VALIDATE CONSTRAINT learning_events_subject_fk;
ALTER TABLE public.learning_events
  VALIDATE CONSTRAINT learning_events_topic_fk;
