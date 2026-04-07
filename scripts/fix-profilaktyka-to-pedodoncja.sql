-- Ręczna korekta: temat "Profilaktyka" powinien być przypisany
-- do stacji/przedmiotu OSCE Pedodoncja, nie do osobnej stacji.
-- Dostosuj topic_id i subject_id do faktycznych wartości w Twojej bazie.

-- Przykład:
-- UPDATE topics SET subject_id = 'stoma-osce' WHERE id = '<id-profilaktyki>';
-- Lub jeśli to kwestia nazwy stacji OSCE:
-- UPDATE subjects SET name = 'Pedodoncja' WHERE id = '<id-stacji-profilaktyka>';

-- WAŻNE: sprawdź faktyczne ID w bazie przed uruchomieniem!
-- SELECT id, name, subject_id FROM topics WHERE name ILIKE '%profilaktyka%';
-- SELECT id, name FROM subjects WHERE name ILIKE '%profilaktyka%';
