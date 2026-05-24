-- Ręczny zakaz shuffle opcji w sesji KNNP (fallback gdy heurystyka nie złapie meta-opcji).
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS disable_option_shuffle BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.questions.disable_option_shuffle IS
  'Gdy true — opcje odpowiedzi w sesji KNNP nie są tasowane (stała kolejność a→e).';
