-- Usuwa puste duplikaty CHZ-* po imporcie pytań pod ZAKAZ-* (ten sam display_order / nazwa).
-- Bezpieczne: tylko topiki bez żadnego wiersza w questions.

DELETE FROM public.topics
WHERE subject_id = 'stoma-zakazne'
  AND id LIKE 'CHZ-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.questions q WHERE q.topic_id = topics.id
  );
