-- OSCE Topic Session: karta wiedzy, typ pytania, kolumny dedykowane (bez JSONB extra)
-- Uruchom w Supabase SQL Editor po wdrożeniu TopicSession.

ALTER TABLE topics ADD COLUMN IF NOT EXISTS knowledge_card TEXT;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'single_choice';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS timer_seconds INTEGER;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_order JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS learning_outcome TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS hotspots JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS drill_questions JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS identify_mode TEXT;

COMMENT ON COLUMN topics.knowledge_card IS 'Markdown: wprowadzenie do tematu przed pytaniami OSCE';
COMMENT ON COLUMN questions.question_type IS 'single_choice | ordering | image_identify | conversion_drill';
COMMENT ON COLUMN questions.timer_seconds IS 'Limit czasu w sekundach (opcjonalnie)';
COMMENT ON COLUMN questions.correct_order IS 'Dla ordering: kolejność poprawna';
COMMENT ON COLUMN questions.learning_outcome IS 'Cel edukacyjny / efekt uczenia się';
COMMENT ON COLUMN questions.hotspots IS 'Dla image_identify: tablica hotspotów na obrazie';
COMMENT ON COLUMN questions.drill_questions IS 'Dla conversion_drill: pytania pomocnicze';
COMMENT ON COLUMN questions.identify_mode IS 'Dla image_identify: identify | label';
