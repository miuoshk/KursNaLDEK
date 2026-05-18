-- Zwiększenie limitu długości avatar_emoji do 32 znaków Unicode (char_length)
-- oraz spójność z triggerem rejestracji — długie sekwencje ZWJ / flagi subregionów.

alter table public.profiles
  drop constraint if exists avatar_emoji_length_chk;

alter table public.profiles
  add constraint avatar_emoji_length_chk
  check (avatar_emoji is null or char_length(avatar_emoji) between 1 and 32);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  full_name_value text;
  nick_value text;
  email_local_part text;
  year_value int;
  track_value text;
  emoji_value text;
begin
  email_local_part := split_part(coalesce(new.email, ''), '@', 1);
  full_name_value := nullif(
    trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', '')),
    ''
  );
  if full_name_value is null then
    full_name_value := email_local_part;
  end if;

  nick_value := nullif(
    trim(coalesce(new.raw_user_meta_data->>'nick', new.raw_user_meta_data->>'display_name', email_local_part)),
    ''
  );
  if nick_value is null then
    nick_value := concat('user_', left(new.id::text, 8));
  end if;

  if (new.raw_user_meta_data->>'current_year') ~ '^[1-3]$' then
    year_value := (new.raw_user_meta_data->>'current_year')::int;
  else
    year_value := 1;
  end if;
  track_value := case
    when new.raw_user_meta_data->>'current_track' in ('stomatologia', 'lekarski')
      then new.raw_user_meta_data->>'current_track'
    else 'stomatologia'
  end;

  emoji_value := nullif(trim(coalesce(new.raw_user_meta_data->>'avatar_emoji', '')), '');
  if emoji_value is not null and char_length(emoji_value) > 32 then
    emoji_value := null;
  end if;

  insert into public.profiles (
    id, full_name, nick, display_name, avatar_initials, avatar_emoji,
    current_track, current_year
  )
  values (
    new.id,
    full_name_value,
    nick_value,
    nick_value,
    upper(left(full_name_value, 1) ||
          left(split_part(full_name_value, ' ', 2), 1)),
    emoji_value,
    track_value,
    year_value
  );
  return new;
end;
$function$;
