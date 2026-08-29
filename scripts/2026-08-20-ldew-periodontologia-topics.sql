-- ============================================================
-- LDEW — Periodontologia: remapa tematów (PER-01 … PER-16)
-- Usuwa starą mapę 22-tematową (Górska) i wstawia nową (16).
-- Bezpieczne tylko gdy brak pytań na topic_id LIKE 'PER-%'
--   (skrypt i tak blokuje DELETE przy istniejących questions).
-- Przedmiot ldew-periodontologia musi istnieć.
-- ============================================================

DELETE FROM public.topics t
 WHERE t.subject_id = 'ldew-periodontologia'
   AND t.id LIKE 'PER-%'
   AND NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.topic_id = t.id);

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('PER-01', 'ldew-periodontologia', 'Podstawy anatomii i fizjologii przyzębia', 1, 0),
  ('PER-02', 'ldew-periodontologia', 'Etiopatogeneza chorób przyzębia i okołowszczepowych', 2, 0),
  ('PER-03', 'ldew-periodontologia', 'Epidemiologia periodontologiczna', 3, 0),
  ('PER-04', 'ldew-periodontologia', 'Diagnostyka chorób przyzębia i tkanek wokół implantów', 4, 0),
  ('PER-05', 'ldew-periodontologia', 'Kliniczne badanie periodontologiczne', 5, 0),
  ('PER-06', 'ldew-periodontologia', 'Diagnostyka obrazowa w periodontologii', 6, 0),
  ('PER-07', 'ldew-periodontologia', 'Profilaktyka chorób przyzębia', 7, 0),
  ('PER-08', 'ldew-periodontologia', 'Niechirurgiczne leczenie chorób przyzębia', 8, 0),
  ('PER-09', 'ldew-periodontologia', 'Chirurgiczne leczenie chorób przyzębia', 9, 0),
  ('PER-10', 'ldew-periodontologia', 'Terapia śluzówkowo-dziąsłowa', 10, 0),
  ('PER-11', 'ldew-periodontologia', 'Podstawy współczesnej implantologii stomatologicznej', 11, 0),
  ('PER-12', 'ldew-periodontologia', 'Lasery w leczeniu chorób przyzębia i zapalenia tkanek okołowszczepowych', 12, 0),
  ('PER-13', 'ldew-periodontologia', 'Leczenie podtrzymujące', 13, 0),
  ('PER-14', 'ldew-periodontologia', 'Rehabilitacja protetyczna pacjentów obciążonych chorobami przyzębia', 14, 0),
  ('PER-15', 'ldew-periodontologia', 'Leczenie ortodontyczne u pacjentów z zapaleniem przyzębia', 15, 0),
  ('PER-16', 'ldew-periodontologia', 'Związek zapalenia przyzębia z chorobami ogólnymi', 16, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
