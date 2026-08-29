-- ============================================================
-- LDEW — Endodoncja: 24 tematy (END-01 … END-24)
-- Przedmiot ldew-endodoncja musi istnieć (patrz
-- scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql).
-- Bezpieczne do wielokrotnego uruchomienia (ON CONFLICT).
-- ============================================================

INSERT INTO public.topics (id, subject_id, name, display_order, question_count) VALUES
  ('END-01', 'ldew-endodoncja', 'Morfologia oraz funkcja endodontium i okołowierzchołkowych tkanek zęba', 1, 0),
  ('END-02', 'ldew-endodoncja', 'Etiologia oraz profilaktyka chorób endodontium i okołowierzchołkowych tkanek zęba', 2, 0),
  ('END-03', 'ldew-endodoncja', 'Etiogeneza i patomechanizm chorób endodontium i okołowierzchołkowych tkanek zęba', 3, 0),
  ('END-04', 'ldew-endodoncja', 'Symptomatologia chorób endodontium i okołowierzchołkowych tkanek zęba', 4, 0),
  ('END-05', 'ldew-endodoncja', 'Diagnostyka kliniczna chorób endodontium i okołowierzchołkowych tkanek zęba', 5, 0),
  ('END-06', 'ldew-endodoncja', 'Morfologia jam zębowych a leczenie endodontyczne', 6, 0),
  ('END-07', 'ldew-endodoncja', 'Rentgenodiagnostyka w endodoncji', 7, 0),
  ('END-08', 'ldew-endodoncja', 'Zwalczanie bólu w endodoncji', 8, 0),
  ('END-09', 'ldew-endodoncja', 'Urządzenia do powiększania pola zabiegowego w leczeniu endodontycznym', 9, 0),
  ('END-10', 'ldew-endodoncja', 'Instrumentarium endodontyczne', 10, 0),
  ('END-11', 'ldew-endodoncja', 'Koferdam w leczeniu endodontycznym', 11, 0),
  ('END-12', 'ldew-endodoncja', 'Metody określania długości roboczej zęba', 12, 0),
  ('END-13', 'ldew-endodoncja', 'Opracowanie kanałów korzeniowych', 13, 0),
  ('END-14', 'ldew-endodoncja', 'Wypełnianie kanałów korzeniowych', 14, 0),
  ('END-15', 'ldew-endodoncja', 'Pierwsza pomoc w endodoncji - leczenie stanów nagłych', 15, 0),
  ('END-16', 'ldew-endodoncja', 'Leczenie endodontyczne', 16, 0),
  ('END-17', 'ldew-endodoncja', 'Powikłania w leczeniu endodontycznym', 17, 0),
  ('END-18', 'ldew-endodoncja', 'Ponowne leczenie endodontyczne', 18, 0),
  ('END-19', 'ldew-endodoncja', 'Przebarwienie i wybielanie zębów leczonych endodontycznie', 19, 0),
  ('END-20', 'ldew-endodoncja', 'Postępowanie endodontyczne w urazowych uszkodzeniach zębów stałych', 20, 0),
  ('END-21', 'ldew-endodoncja', 'Odbudowa i wzmocnienie struktury zębów leczonych endodontycznie', 21, 0),
  ('END-22', 'ldew-endodoncja', 'Zespół zmian endo-perio', 22, 0),
  ('END-23', 'ldew-endodoncja', 'Patologiczna resorpcja zębów', 23, 0),
  ('END-24', 'ldew-endodoncja', 'Chirurgia endodontyczna', 24, 0)
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order;
