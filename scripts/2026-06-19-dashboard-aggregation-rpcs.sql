-- Agregacja danych dashboardu po stronie bazy (Postgres RPC).
--
-- Zastępuje antywzorzec "pobierz wszystkie ID pytań do Node i pętla COUNT po 200"
-- pojedynczymi zapytaniami z JOIN-em. Topiki (scope curriculum) wciąż liczone
-- w TS z cache'owanego katalogu i przekazywane jako p_topic_ids — mapowanie
-- kanonicznych przedmiotów / powłok zostaje w TS (jedno źródło prawdy).
--
-- Filtr widoczności pytań po tracku odwzorowuje questionTracksOrFilter():
--   (tracks IS NULL OR tracks @> array[track])
-- co jest równoważne PostgREST `tracks.is.null,tracks.cs.{track}`.
--
-- Wszystkie funkcje: SECURITY INVOKER (domyślnie) — RLS na user_question_progress
-- nadal obowiązuje, więc user widzi wyłącznie własne wiersze.

-- Liczba pytań z zaplanowaną powtórką (next_review <= teraz) w obrębie scope.
create or replace function public.due_review_count(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text
)
returns integer
language sql
stable
as $$
  select count(*)::int
  from user_question_progress uqp
  join questions q on q.id = uqp.question_id
  where uqp.user_id = p_user_id
    and uqp.next_review is not null
    and uqp.next_review <= now()
    and q.topic_id = any(p_topic_ids)
    and q.is_active = true
    and (q.tracks is null or q.tracks @> array[p_track]);
$$;

grant execute on function public.due_review_count(uuid, text[], text) to authenticated;

-- Statystyki per topic dla usera: due / answered / mastered.
-- answered = pytania z times_answered > 0; mastered = te z state = 'review'.
create or replace function public.topic_progress_stats(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text
)
returns table(topic_id text, due int, answered int, mastered int)
language sql
stable
as $$
  select q.topic_id,
         count(*) filter (where uqp.next_review is not null and uqp.next_review <= now())::int as due,
         count(*) filter (where coalesce(uqp.times_answered,0) > 0)::int as answered,
         count(*) filter (where coalesce(uqp.times_answered,0) > 0 and uqp.state = 'review')::int as mastered
  from user_question_progress uqp
  join questions q on q.id = uqp.question_id
  where uqp.user_id = p_user_id
    and q.topic_id = any(p_topic_ids)
    and q.is_active = true
    and (q.tracks is null or q.tracks @> array[p_track])
  group by q.topic_id;
$$;

grant execute on function public.topic_progress_stats(uuid, text[], text) to authenticated;

-- Liczba aktywnych, widocznych dla tracku pytań per topic (niezależne od usera).
create or replace function public.active_question_count_by_topic(
  p_topic_ids text[],
  p_track text
)
returns table(topic_id text, cnt int)
language sql
stable
as $$
  select q.topic_id, count(*)::int as cnt
  from questions q
  where q.topic_id = any(p_topic_ids)
    and q.is_active = true
    and (q.tracks is null or q.tracks @> array[p_track])
  group by q.topic_id;
$$;

grant execute on function public.active_question_count_by_topic(text[], text) to authenticated;
