-- UFO KROK 2 — down. Drops renderer, triggers, and preview RPC.

DROP TRIGGER IF EXISTS questions_render_explanation_blocks ON public.questions;
DROP TRIGGER IF EXISTS questions_rerender_explanation_on_options ON public.questions;

DROP FUNCTION IF EXISTS public.trg_questions_render_explanation_blocks();
DROP FUNCTION IF EXISTS public.trg_questions_rerender_explanation_on_options();
DROP FUNCTION IF EXISTS public.preview_explanation_blocks(jsonb, text);
DROP FUNCTION IF EXISTS public.render_explanation_blocks(jsonb, jsonb, text);
