-- UFO KROK 2 — 6 render fixtures, expected text 1:1, plus zero-emoji check.
-- Run manually after the up migration. Read-only.

WITH opts5 AS (
  SELECT '[
    {"id":"a","text":"Alfa"},
    {"id":"b","text":"Beta"},
    {"id":"c","text":"Gamma"},
    {"id":"d","text":"Delta"},
    {"id":"e","text":"Epsilon"}
  ]'::jsonb AS options
),
opts6 AS (
  SELECT '[
    {"id":"a","text":"Alfa"},
    {"id":"b","text":"Beta"},
    {"id":"c","text":"Gamma"},
    {"id":"d","text":"Delta"},
    {"id":"e","text":"Epsilon"},
    {"id":"f","text":"Zeta"}
  ]'::jsonb AS options
),
fixtures AS (
  SELECT * FROM (
    VALUES
      (
        '01_full',
        'b',
        '{
          "version": 2,
          "correctReason": "Mechanizm poprawnej odpowiedzi.",
          "takeaway": "Jedna zasada.",
          "distractors": {
            "a": "Nie alfa.",
            "c": "Nie gamma."
          },
          "trap": "Łatwo pomylić.",
          "contrast": [
            ["cecha", "X", "Y"],
            ["czas", "krótki", "długi"]
          ]
        }'::jsonb,
        $exp$**Poprawna odpowiedź:** Beta

Mechanizm poprawnej odpowiedzi.

**Dlaczego nie pozostałe?**

- *Alfa* — Nie alfa.
- *Gamma* — Nie gamma.

| cecha | X | Y |
| --- | --- | --- |
| czas | krótki | długi |

> **Pułapka:** Łatwo pomylić.

> **Zasada:** Jedna zasada.$exp$
      ),
      (
        '02_minimal',
        'b',
        '{"version":2,"correctReason":"Tylko mechanizm."}'::jsonb,
        $exp$**Poprawna odpowiedź:** Beta

Tylko mechanizm.$exp$
      ),
      (
        '03_no_distractors',
        'b',
        '{
          "version": 2,
          "correctReason": "Mechanizm bez listy.",
          "takeaway": "Zasada bez dystraktorów.",
          "trap": "Pułapka bez listy."
        }'::jsonb,
        $exp$**Poprawna odpowiedź:** Beta

Mechanizm bez listy.

> **Pułapka:** Pułapka bez listy.

> **Zasada:** Zasada bez dystraktorów.$exp$
      ),
      (
        '04_with_contrast',
        'b',
        '{
          "version": 2,
          "correctReason": "Mechanizm z tabelą.",
          "contrast": [
            ["cecha", "A"],
            ["czas", "B"]
          ]
        }'::jsonb,
        $exp$**Poprawna odpowiedź:** Beta

Mechanizm z tabelą.

| cecha | A |
| --- | --- |
| czas | B |$exp$
      ),
      (
        '05_trap_without_takeaway',
        'b',
        '{
          "version": 2,
          "correctReason": "Mechanizm z pułapką.",
          "trap": "Tylko pułapka."
        }'::jsonb,
        $exp$**Poprawna odpowiedź:** Beta

Mechanizm z pułapką.

> **Pułapka:** Tylko pułapka.$exp$
      ),
      (
        '06_six_options_key_f',
        'f',
        '{
          "version": 2,
          "correctReason": "Klucz to ostatnia opcja.",
          "distractors": {
            "a": "Pierwsza odpada.",
            "e": "Przedostatnia odpada."
          }
        }'::jsonb,
        $exp$**Poprawna odpowiedź:** Zeta

Klucz to ostatnia opcja.

**Dlaczego nie pozostałe?**

- *Alfa* — Pierwsza odpada.
- *Epsilon* — Przedostatnia odpada.$exp$
      )
  ) AS t(name, correct_id, blocks, expected)
)
SELECT
  f.name,
  public.render_explanation_blocks(
    f.blocks,
    CASE WHEN f.name = '06_six_options_key_f' THEN o6.options ELSE o5.options END,
    f.correct_id
  ) AS actual,
  f.expected,
  public.render_explanation_blocks(
    f.blocks,
    CASE WHEN f.name = '06_six_options_key_f' THEN o6.options ELSE o5.options END,
    f.correct_id
  ) = f.expected AS ok,
  public.render_explanation_blocks(
    f.blocks,
    CASE WHEN f.name = '06_six_options_key_f' THEN o6.options ELSE o5.options END,
    f.correct_id
  ) !~ (
    '[' || chr(9728) || '-' || chr(10175) || chr(127744) || '-' || chr(129279) || ']'
  ) AS no_emoji
FROM fixtures f
CROSS JOIN opts5 o5
CROSS JOIN opts6 o6
ORDER BY f.name;
