-- Usuwanie konta: komentarze i zgłoszenia zostają, autor = anonimowy (user_id NULL).
-- Uruchom w Supabase SQL Editor przed używaniem „Usuń konto” w adminie.

ALTER TABLE public.question_discussions
  DROP CONSTRAINT IF EXISTS question_discussions_user_id_fkey;

ALTER TABLE public.question_discussions
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.question_discussions
  ADD CONSTRAINT question_discussions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.error_reports
  DROP CONSTRAINT IF EXISTS error_reports_user_id_fkey;

ALTER TABLE public.error_reports
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.error_reports
  ADD CONSTRAINT error_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
