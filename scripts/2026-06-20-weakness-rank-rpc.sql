-- recompute_topic_mastery_weakness_rank
--
-- Zastępuje pętlę N osobnych UPDATE-ów (jeden round-trip Vercel->Supabase na
-- każdy temat w topic_mastery_cache usera) jednym UPDATE z row_number().
-- Pętla blokowała ekran podsumowania sesji na kilka sekund (koszt rósł z
-- liczbą tematów usera, nie z liczbą pytań w sesji).
--
-- SECURITY INVOKER — RLS na topic_mastery_cache dalej obowiązuje (user
-- aktualizuje tylko własne wiersze, tak jak wcześniej przez klienta usera).

create or replace function public.recompute_topic_mastery_weakness_rank(p_user_id uuid)
returns void
language sql
security invoker
as $$
  update topic_mastery_cache t
  set weakness_rank = r.rn
  from (
    select topic_id,
           row_number() over (order by mastery_score asc, topic_id asc)::int as rn
    from topic_mastery_cache
    where user_id = p_user_id
  ) r
  where t.user_id = p_user_id
    and t.topic_id = r.topic_id
    and t.weakness_rank is distinct from r.rn;
$$;

grant execute on function public.recompute_topic_mastery_weakness_rank(uuid) to authenticated;
