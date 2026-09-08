-- 5 pytań z największą różnicą pct_of_wrong vs pct_of_wrong_first.
-- Fabryka: powtórki po wyjaśnieniu zawyżają wybieralność; patrz first-attempt.

SELECT
  d.question_id,
  q.source_code,
  d.option_id,
  d.n_selected,
  d.pct_of_wrong,
  d.n_first_attempt,
  d.pct_of_wrong_first,
  ROUND(
    ABS(COALESCE(d.pct_of_wrong, 0) - COALESCE(d.pct_of_wrong_first, 0)),
    2
  ) AS delta_pp
FROM public.distractor_stats_90d d
JOIN public.questions q ON q.id = d.question_id
ORDER BY delta_pp DESC, d.n_selected DESC
LIMIT 5;
