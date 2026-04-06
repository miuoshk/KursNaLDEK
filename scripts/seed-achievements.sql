-- Osiągnięcia — uruchom w Supabase SQL Editor (idempotentnie)
INSERT INTO achievements (id, name, description, icon_name, category, target_value, xp_reward) VALUES
  ('pierwsza-sesja', 'Pierwsza sesja', 'Ukończ swoją pierwszą sesję nauki', 'Rocket', 'milestones', 1, 25),
  ('setka', 'Setka', 'Odpowiedz na 100 pytań', 'Hash', 'milestones', 100, 50),
  ('tysiac', 'Tysiąc pytań', 'Odpowiedz na 1000 pytań', 'Trophy', 'milestones', 1000, 200),
  ('maraton', 'Maraton', 'Odpowiedz na 100 pytań w jednym dniu', 'Zap', 'milestones', 100, 100),
  ('perfekcyjna-sesja', 'Perfekcyjna sesja', 'Zdobądź 100% w sesji z minimum 25 pytań', 'Star', 'accuracy', 1, 100),
  ('snajper', 'Snajper', 'Utrzymaj 90%+ trafność przez 7 kolejnych dni', 'Target', 'accuracy', 7, 150),
  ('tygodniowy-rytm', 'Tygodniowy rytm', 'Utrzymaj streak przez 7 dni', 'Calendar', 'consistency', 7, 50),
  ('miesieczna-dyscyplina', 'Miesięczna dyscyplina', 'Utrzymaj streak przez 30 dni', 'CalendarCheck', 'consistency', 30, 200),
  ('kwartalna-konsekwencja', 'Kwartalna konsekwencja', 'Utrzymaj streak przez 90 dni', 'Award', 'consistency', 90, 500),
  ('wszechstronny', 'Wszechstronny', 'Osiągnij 50% opanowania we wszystkich przedmiotach', 'Globe', 'mastery', 1, 300),
  ('nocny-maratonczyk', 'Nocny maratończyk', 'Odpowiedz na 50 pytań po godzinie 22:00', 'Moon', 'special', 50, 75),
  ('wczesny-ptak', 'Wczesny ptak', 'Ucz się przed godziną 6:00', 'Sunrise', 'special', 1, 50)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  category = EXCLUDED.category,
  target_value = EXCLUDED.target_value,
  xp_reward = EXCLUDED.xp_reward;
