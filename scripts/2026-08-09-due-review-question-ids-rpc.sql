-- Due review question IDs for session start (scoped JOIN, same filters as due_review_count).
-- Replaces the antywzorzec "pobierz wszystkie due UQP globalnie i filtruj w Node"
-- (PostgREST default max ~1000 rows → empty subject due pool for heavy users).
--
-- Filtr widoczności: (tracks IS NULL OR tracks @> array[track])
-- SECURITY INVOKER — RLS na user_question_progress nadal obowiązuje.

create or replace function public.due_review_question_ids(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text,
  p_limit int default 50
)
returns table(question_id text)
language sql
stable
as $$
  select uqp.question_id
  from user_question_progress uqp
  join questions q on q.id = uqp.question_id
  where uqp.user_id = p_user_id
    and uqp.next_review is not null
    and uqp.next_review <= now()
    and q.topic_id = any(p_topic_ids)
    and q.is_active = true
    and (q.tracks is null or q.tracks @> array[p_track])
  order by uqp.next_review asc
  limit greatest(coalesce(p_limit, 50), 0);
$$;

grant execute on function public.due_review_question_ids(uuid, text[], text, int) to authenticated;
