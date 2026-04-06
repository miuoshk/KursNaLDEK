-- Krok 5: UPSERT odpowiedzi w sesji + polityka UPDATE
-- Uruchom w Supabase SQL Editor po wdrożeniu aplikacji.

ALTER TABLE session_answers
  ADD COLUMN IF NOT EXISTS is_first_exposure BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS session_answers_session_question_unique
  ON session_answers (session_id, question_id);

CREATE POLICY "Users own session_answers UPDATE"
  ON session_answers FOR UPDATE USING (
    session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid())
  );
