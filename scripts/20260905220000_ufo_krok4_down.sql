-- UFO KROK 4 — down. Drops batch apply / rollback RPCs.

DROP FUNCTION IF EXISTS public.apply_explanation_blocks(jsonb, text, boolean);
DROP FUNCTION IF EXISTS public.rollback_explanation_blocks(text[]);
