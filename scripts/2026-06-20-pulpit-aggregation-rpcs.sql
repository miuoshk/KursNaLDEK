-- Agregacje pulpitu po stronie bazy
--
-- Loadery pulpitu pobierały surowe wiersze i agregowały w JS — u aktywnych
-- userów dziesiątki tysięcy wierszy na wejście (heatmapa ~27k session_answers,
-- historia ~1500 sesji, mastery setki question_id). Te RPC zwracają gotowy
-- wynik, ścinając transfer i czas renderu pulpitu po sesji (revalidatePath).
--
-- SECURITY INVOKER — RLS dalej obowiązuje (user widzi tylko swoje dane).
-- Kubełkowanie po dniu w strefie 'Europe/Warsaw' = 1:1 z warsawYmd w TS.
-- Zweryfikowane 1:1 na realnych userach (sumy i liczby dni identyczne).

create or replace function public.pulpit_activity_heatmap(p_user_id uuid, p_days int)
returns table(day text, count int)
language sql stable security invoker as $$
  select to_char(sa.answered_at at time zone 'Europe/Warsaw', 'YYYY-MM-DD') as day,
         count(*)::int as count
  from session_answers sa
  join study_sessions ss on ss.id = sa.session_id
  where ss.user_id = p_user_id
    and ss.started_at >= now() - (p_days || ' days')::interval
    and sa.answered_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
$$;

grant execute on function public.pulpit_activity_heatmap(uuid, int) to authenticated;

create or replace function public.pulpit_progress_history(p_user_id uuid, p_days int)
returns table(day text, avg_accuracy int, total_questions int)
language sql stable security invoker as $$
  select to_char(completed_at at time zone 'Europe/Warsaw', 'YYYY-MM-DD') as day,
         coalesce(round(avg(accuracy) filter (where accuracy is not null) * 100), 0)::int as avg_accuracy,
         coalesce(sum(total_questions), 0)::int as total_questions
  from study_sessions
  where user_id = p_user_id
    and is_completed = true
    and completed_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
$$;

grant execute on function public.pulpit_progress_history(uuid, int) to authenticated;

create or replace function public.subject_answered_mastery(p_user_id uuid, p_topic_ids text[], p_track text)
returns table(total_correct int, total_answered int)
language sql stable security invoker as $$
  select coalesce(sum(uqp.times_correct), 0)::int as total_correct,
         coalesce(sum(uqp.times_answered), 0)::int as total_answered
  from user_question_progress uqp
  join questions q on q.id = uqp.question_id
  where uqp.user_id = p_user_id
    and q.topic_id = any(p_topic_ids)
    and q.is_active = true
    and (q.tracks is null or q.tracks @> array[p_track]);
$$;

grant execute on function public.subject_answered_mastery(uuid, text[], text) to authenticated;
