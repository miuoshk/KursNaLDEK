-- UFO KROK 5 — definicja podzbioru seeda (uruchamiać na PROD, read-only).
-- Branching NIE kopiuje danych z prod. Ten plik tylko wybiera ID.
-- Kopiowanie: node scripts/seed-staging-subset.mjs
--
-- Zbiór:
--   * wszystkie topics
--   * questions: ldew-chirurgia-stomatologiczna (całość)
--                + 500 losowych z anatomia (seed deterministyczny)
--                + 200 losowych z ldew-endodoncja
--   * question_concepts dla tych pytań (+ concepts, do których wskazują)
--   * learning_experiment_configs
--   * subjects (wszystkie — FK topics)
-- Bez tabel użytkowników / odpowiedzi / sesji.

CREATE TEMP TABLE staging_seed_question_ids ON COMMIT DROP AS
WITH chirurgia AS (
  SELECT q.id
  FROM public.questions q
  JOIN public.topics t ON t.id = q.topic_id
  WHERE t.subject_id = 'ldew-chirurgia-stomatologiczna'
),
anatomia AS (
  SELECT q.id
  FROM public.questions q
  JOIN public.topics t ON t.id = q.topic_id
  WHERE t.subject_id = 'anatomia'
  ORDER BY md5(q.id || 'ufo-staging-2026')
  LIMIT 500
),
endo AS (
  SELECT q.id
  FROM public.questions q
  JOIN public.topics t ON t.id = q.topic_id
  WHERE t.subject_id = 'ldew-endodoncja'
  ORDER BY md5(q.id || 'ufo-staging-2026')
  LIMIT 200
)
SELECT id FROM chirurgia
UNION
SELECT id FROM anatomia
UNION
SELECT id FROM endo;

SELECT
  (SELECT count(*) FROM public.subjects) AS subjects,
  (SELECT count(*) FROM public.topics) AS topics,
  (SELECT count(*) FROM staging_seed_question_ids) AS questions,
  (SELECT count(*) FROM public.question_concepts qc
    WHERE qc.question_id IN (SELECT id FROM staging_seed_question_ids)
  ) AS question_concepts,
  (SELECT count(*) FROM public.learning_experiment_configs) AS experiment_configs;
