-- ============================================================
-- Patomorfologia: tematy „(generowane)” — osobne kafelki (8–14)
-- Pytania batch_label = 'gen-2026-1' → topic_id PAT-*-GEN
-- Sesja całego przedmiotu pomija -GEN (questionSelection.ts)
-- ============================================================

-- 1) Nowe tematy — obok oryginałów (display_order co drugi slot)
INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PAT-KRA-GEN',   'stoma-patologia', 'Zaburzenia w krążeniu (generowane)',              2, 0),
  ('PAT-WST-GEN',   'stoma-patologia', 'Zmiany wsteczne (generowane)',                  4, 0),
  ('PAT-POST-GEN',  'stoma-patologia', 'Zmiany postępowe (generowane)',                 6, 0),
  ('PAT-PRZED-GEN', 'stoma-patologia', 'Zmiany i stany przednowotworowe (generowane)', 8, 0),
  ('PAT-NABL-GEN',  'stoma-patologia', 'Nowotwory nabłonkowe (generowane)',            10, 0),
  ('PAT-NIEN-GEN',  'stoma-patologia', 'Nowotwory nienabłonkowe (generowane)',         12, 0),
  ('PAT-ZAP-GEN',   'stoma-patologia', 'Zapalenia (generowane)',                       14, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- 2) Kolejność oryginalnych tematów (1–7), potem generowane (8–14)
UPDATE public.topics
   SET display_order = CASE id
     WHEN 'PAT-KRA'   THEN 1
     WHEN 'PAT-WST'   THEN 2
     WHEN 'PAT-POST'  THEN 3
     WHEN 'PAT-PRZED' THEN 4
     WHEN 'PAT-NABL'  THEN 5
     WHEN 'PAT-NIEN'  THEN 6
     WHEN 'PAT-ZAP'   THEN 7
     WHEN 'PAT-KRA-GEN'   THEN 8
     WHEN 'PAT-WST-GEN'   THEN 9
     WHEN 'PAT-POST-GEN'  THEN 10
     WHEN 'PAT-PRZED-GEN' THEN 11
     WHEN 'PAT-NABL-GEN'  THEN 12
     WHEN 'PAT-NIEN-GEN'  THEN 13
     WHEN 'PAT-ZAP-GEN'   THEN 14
   END
 WHERE subject_id = 'stoma-patologia'
   AND id IN (
     'PAT-KRA', 'PAT-WST', 'PAT-POST', 'PAT-PRZED',
     'PAT-NABL', 'PAT-NIEN', 'PAT-ZAP',
     'PAT-KRA-GEN', 'PAT-WST-GEN', 'PAT-POST-GEN', 'PAT-PRZED-GEN',
     'PAT-NABL-GEN', 'PAT-NIEN-GEN', 'PAT-ZAP-GEN'
   );

-- 3) Przeniesienie pytań wygenerowanych (278 szt., batch gen-2026-1)
UPDATE public.questions q
   SET topic_id = q.topic_id || '-GEN'
 WHERE q.batch_label = 'gen-2026-1'
   AND q.topic_id IN (
     'PAT-KRA', 'PAT-WST', 'PAT-POST', 'PAT-PRZED',
     'PAT-NABL', 'PAT-NIEN', 'PAT-ZAP'
   )
   AND COALESCE(q.is_active, true) = true;

-- 4) Synchronizacja liczników (trigger zwykle zadziała sam; to fallback)
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

-- Weryfikacja (oczekiwane: oryginały bez gen, -GEN z liczbami z pliku):
-- SELECT id, name, question_count, display_order
--   FROM public.topics
--  WHERE subject_id = 'stoma-patologia'
--  ORDER BY display_order;
