-- OSCE Topic Session: karta wiedzy, typ pytania, pole extra (JSONB)
-- Uruchom w Supabase SQL Editor po wdrożeniu TopicSession.

ALTER TABLE topics ADD COLUMN IF NOT EXISTS knowledge_card TEXT;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'single_choice';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS extra JSONB;

COMMENT ON COLUMN topics.knowledge_card IS 'Markdown: wprowadzenie do tematu przed pytaniami OSCE';
COMMENT ON COLUMN questions.question_type IS 'single_choice | ordering | image_identify | conversion_drill';
COMMENT ON COLUMN questions.extra IS 'Dane specyficzne dla typu (np. correct_order, hotspots, drill_questions)';
