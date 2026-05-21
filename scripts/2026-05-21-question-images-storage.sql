-- Obrazy pytań: publiczny bucket + upload tylko dla admin/moderator

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete question images" ON storage.objects;

CREATE POLICY "Public read question images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');

CREATE POLICY "Admin upload question images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'question-images'
    AND public.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin update question images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'question-images'
    AND public.is_admin_or_moderator((SELECT auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'question-images'
    AND public.is_admin_or_moderator((SELECT auth.uid()))
  );

CREATE POLICY "Admin delete question images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'question-images'
    AND public.is_admin_or_moderator((SELECT auth.uid()))
  );
