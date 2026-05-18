-- RPC: percentyl gotowości w kohorcie (track + year)
--
-- Wejście: id użytkownika.
-- Wyjście: rozmiar kohorty, łączna liczba odpowiedzi usera, percentyl (0..100).
-- Percentyl jest NULL gdy kohorta < 5 osób z wystarczającą liczbą odpowiedzi
-- albo użytkownik sam nie spełnia minimum 20 odpowiedzi.
--
-- Bezpieczeństwo: funkcja jest SECURITY DEFINER (musi widzieć wszystkie profile
-- z kohorty, omijając RLS), ale wewnątrz wymusza p_user_id = auth.uid(),
-- więc każdy zalogowany użytkownik może wyliczyć percentyl tylko dla siebie.
-- EXECUTE jest cofnięty z `anon` i `public`, przyznany tylko `authenticated`.

revoke execute on function public.get_readiness_percentile(uuid) from anon;
revoke execute on function public.get_readiness_percentile(uuid) from public;

create or replace function public.get_readiness_percentile(p_user_id uuid)
returns table (
  cohort_size int,
  user_attempts int,
  percentile numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with caller as (
    select case
      when auth.uid() is null then null
      when p_user_id is null or p_user_id <> auth.uid() then null
      else auth.uid()
    end as id
  ),
  me as (
    select p.current_track, p.current_year
    from profiles p, caller c
    where c.id is not null and p.id = c.id
  ),
  cohort as (
    select p.id,
           sum(uqp.times_correct)::numeric
             / nullif(sum(uqp.times_answered), 0) as readiness,
           sum(uqp.times_answered) as attempts
    from profiles p
    join user_question_progress uqp on uqp.user_id = p.id
    join me on p.current_track = me.current_track
           and p.current_year  = me.current_year
    group by p.id
    having sum(uqp.times_answered) >= 20
  ),
  me_row as (
    select c.readiness, c.attempts
    from cohort c
    join caller on c.id = caller.id
  )
  select
    (select count(*) from cohort)::int as cohort_size,
    coalesce((select attempts from me_row), 0)::int as user_attempts,
    case
      when (select count(*) from cohort) < 5 then null
      when not exists (select 1 from me_row) then null
      else round(
        100.0 * (
          select count(*) from cohort
          where readiness < (select readiness from me_row)
        )::numeric
        / nullif((select count(*) from cohort) - 1, 0),
        1
      )
    end as percentile;
$$;

grant execute on function public.get_readiness_percentile(uuid) to authenticated;
