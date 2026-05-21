-- Powiadomienia o rozpatrzeniu zgłoszeń błędów w pytaniach

ALTER TABLE public.error_reports
  ADD COLUMN IF NOT EXISTS notification_read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_error_reports_user_unread
  ON public.error_reports (user_id, resolved_at DESC)
  WHERE notification_read_at IS NULL
    AND status IN ('resolved', 'rejected', 'reviewed');

DROP POLICY IF EXISTS "Users can mark own reports read" ON public.error_reports;

CREATE POLICY "Users can mark own reports read"
  ON public.error_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
