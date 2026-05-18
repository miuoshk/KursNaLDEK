-- Audit trail dla edycji pytań z panelu admina.
-- Każda modyfikacja przez admina/moderatora generuje wpis w question_edits.

CREATE TABLE IF NOT EXISTS public.question_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  editor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  editor_role text NOT NULL,
  report_id uuid REFERENCES public.error_reports(id) ON DELETE SET NULL,
  changes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS question_edits_question_id_idx
  ON public.question_edits(question_id);
CREATE INDEX IF NOT EXISTS question_edits_editor_id_idx
  ON public.question_edits(editor_id);
CREATE INDEX IF NOT EXISTS question_edits_created_at_idx
  ON public.question_edits(created_at DESC);

ALTER TABLE public.question_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin or moderator read question_edits" ON public.question_edits;
DROP POLICY IF EXISTS "Admin or moderator insert own question_edits" ON public.question_edits;

CREATE POLICY "Admin or moderator read question_edits"
  ON public.question_edits FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

CREATE POLICY "Admin or moderator insert own question_edits"
  ON public.question_edits FOR INSERT
  WITH CHECK (
    editor_id = auth.uid()
    AND public.is_admin_or_moderator(auth.uid())
  );

-- Brak polityk UPDATE / DELETE — log jest immutable z poziomu aplikacji.
-- Service role w razie potrzeby może nadal modyfikować (ominięcie RLS).
