-- Przeniesienie błędnie przypisanych pytań wątrobowych z HIST-21 (Rozwój zęba)
-- do HIST-14 (Układ pokarmowy). Zębowe zostają w HIST-21.
--
-- HIST-21-008 = duplikat HIST-21-006 (identyczna treść) → dezaktywacja zamiast przeniesienia.
-- Liczniki topics.question_count odświeża trigger questions_refresh_topic_count.

BEGIN;

UPDATE public.questions
   SET topic_id = 'HIST-14'
 WHERE id IN (
   'HIST-21-002',
   'HIST-21-003',
   'HIST-21-004',
   'HIST-21-005',
   'HIST-21-006',
   'HIST-21-007',
   'HIST-21-009',
   'HIST-21-010',
   'HIST-21-011'
 )
   AND topic_id = 'HIST-21';

UPDATE public.questions
   SET is_active = false
 WHERE id = 'HIST-21-008'
   AND topic_id = 'HIST-21';

COMMIT;

-- Weryfikacja (opcjonalnie po COMMIT):
-- SELECT id, topic_id, is_active, LEFT(text, 80) FROM questions WHERE id LIKE 'HIST-21-00%' OR id = 'HIST-21-010' OR id = 'HIST-21-011' ORDER BY id;
-- SELECT id, question_count FROM topics WHERE id IN ('HIST-21', 'HIST-14');
