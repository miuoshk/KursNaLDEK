-- ============================================================
-- Cofnięcie splitu PAT-*-GEN → jeden kafelek na dział
-- Pytania gen-2026-1 wracają do tematów rodzica (PAT-KRA itd.).
-- Postęp użytkowników liczy się po question_id — po merge
-- automatycznie widać go na właściwym temacie.
-- Bezpieczne do wielokrotnego uruchomienia.
-- ============================================================

-- 1) Przenieś pytania wygenerowane z powrotem do tematów źródłowych
UPDATE public.questions q
   SET topic_id = REPLACE(q.topic_id, '-GEN', '')
 WHERE q.topic_id LIKE 'PAT-%-GEN'
   AND q.batch_label = 'gen-2026-1';

-- 2) Usuń cache mastery dla tematów generowanych
DELETE FROM public.topic_mastery_cache
 WHERE topic_id LIKE 'PAT-%-GEN';

-- 3) Usuń kafelki (generowane)
DELETE FROM public.topics
 WHERE subject_id = 'stoma-patologia'
   AND id LIKE 'PAT-%-GEN';

-- 4) Kolejność oryginalnych tematów
UPDATE public.topics
   SET display_order = CASE id
     WHEN 'PAT-KRA'   THEN 1
     WHEN 'PAT-WST'   THEN 2
     WHEN 'PAT-POST'  THEN 3
     WHEN 'PAT-PRZED' THEN 4
     WHEN 'PAT-NABL'  THEN 5
     WHEN 'PAT-NIEN'  THEN 6
     WHEN 'PAT-ZAP'   THEN 7
   END
 WHERE subject_id = 'stoma-patologia'
   AND id IN (
     'PAT-KRA', 'PAT-WST', 'PAT-POST', 'PAT-PRZED',
     'PAT-NABL', 'PAT-NIEN', 'PAT-ZAP'
   );

-- 5) Synchronizacja liczników
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE COALESCE(is_active, true) = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id
   AND t.subject_id = 'stoma-patologia';

UPDATE public.topics t
   SET question_count = 0
 WHERE t.subject_id = 'stoma-patologia'
   AND NOT EXISTS (
     SELECT 1
       FROM public.questions q
      WHERE q.topic_id = t.id
        AND COALESCE(q.is_active, true) = true
   );

-- 6) Przywróć brakujący postęp mk_ z historii sesji (tylko pat-kra-*)
INSERT INTO public.user_question_progress (
  user_id,
  question_id,
  times_answered,
  times_correct,
  last_answered_at,
  state,
  reps
)
SELECT
  ss.user_id,
  sa.question_id,
  COUNT(*)::int,
  SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::int,
  MAX(sa.answered_at),
  'review',
  COUNT(*)::int
FROM public.session_answers sa
JOIN public.study_sessions ss ON ss.id = sa.session_id
JOIN public.profiles p ON p.id = ss.user_id
JOIN public.questions q ON q.id = sa.question_id
WHERE p.nick = 'mk_'
  AND q.id LIKE 'pat-kra-%'
  AND NOT EXISTS (
    SELECT 1
      FROM public.user_question_progress uqp
     WHERE uqp.user_id = ss.user_id
       AND uqp.question_id = sa.question_id
  )
GROUP BY ss.user_id, sa.question_id
ON CONFLICT (user_id, question_id) DO NOTHING;

-- Weryfikacja:
-- SELECT id, name, question_count FROM public.topics
--  WHERE subject_id = 'stoma-patologia' ORDER BY display_order;
