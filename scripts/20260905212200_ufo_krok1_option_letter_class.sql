-- UFO KROK 1 follow-up: first apply_migration payload used [źż]
-- instead of the protocol class [źz]. Replaced immediately. No schema
-- change beyond CREATE OR REPLACE of the helper already in
-- 20260905212000_ufo_krok1.sql.

CREATE OR REPLACE FUNCTION public.explanation_blocks_text_allowed(p_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $ufo$
DECLARE
  i integer;
  cp integer;
BEGIN
  IF p_text IS NULL THEN
    RETURN false;
  END IF;

  IF p_text ~ '(odpowied[źz]|opcj[aięe]|wariant)\s*[A-F]\y' THEN
    RETURN false;
  END IF;

  IF p_text ~ ('(^|' || chr(10) || ')#{1,6}\s') THEN
    RETURN false;
  END IF;

  FOR i IN 1..char_length(p_text) LOOP
    cp := ascii(substr(p_text, i, 1));
    IF (cp >= 9728 AND cp <= 10175) OR (cp >= 127744 AND cp <= 129279) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$ufo$;
