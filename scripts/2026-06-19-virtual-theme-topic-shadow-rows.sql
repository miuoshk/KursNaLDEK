-- Cienie w topics dla wirtualnych kafelków rocznikowych (np. Biofizyka „2025”).
-- study_sessions.topic_id REFERENCES topics(id) — bez tych wierszy insert sesji pada FK.
-- Pytania zostają przy swoim topic_id; rocznik filtruje po questions.theme_label.

INSERT INTO public.topics (id, subject_id, name, display_order, question_count, tracks)
VALUES (
  'biofizyka-THEME-2025',
  'biofizyka',
  '2025',
  100,
  0,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
