-- ============================================================
-- Usunięcie przedmiotów Zarządzanie + Przedsiębiorczość (STOMA r.2 KNNP)
-- Uruchom w Supabase SQL Editor. Kasuje tematy ZAR-*, PRZ-* i 165 pytań.
-- ============================================================

-- 1. Odwiązanie sesji
UPDATE public.study_sessions
   SET subject_id = NULL,
       topic_id = NULL
 WHERE subject_id IN ('stoma-zarzadzanie', 'stoma-przedsiebiorczosc')
    OR topic_id LIKE 'ZAR-%'
    OR topic_id LIKE 'PRZ-%';

-- 2. Odpowiedzi i postęp użytkowników
DELETE FROM public.session_answers sa
 USING public.questions q
 WHERE sa.question_id = q.id
   AND (q.id LIKE 'zar-%' OR q.id LIKE 'prz-%');

DELETE FROM public.user_question_progress uqp
 USING public.questions q
 WHERE uqp.question_id = q.id
   AND (q.id LIKE 'zar-%' OR q.id LIKE 'prz-%');

DELETE FROM public.saved_questions sq
 USING public.questions q
 WHERE sq.question_id = q.id
   AND (q.id LIKE 'zar-%' OR q.id LIKE 'prz-%');

DELETE FROM public.question_discussions qd
 USING public.questions q
 WHERE qd.question_id = q.id
   AND (q.id LIKE 'zar-%' OR q.id LIKE 'prz-%');

DELETE FROM public.topic_mastery_cache
 WHERE topic_id LIKE 'ZAR-%'
    OR topic_id LIKE 'PRZ-%';

-- 3. Przedmioty (CASCADE → topics → questions)
DELETE FROM public.subjects
 WHERE id IN ('stoma-zarzadzanie', 'stoma-przedsiebiorczosc');
