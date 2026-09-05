-- UFO KROK 1 — 12 validator fixtures + character proofs.
-- Run manually after the up migration (branch or prod). Read-only.

WITH opts AS (
  SELECT '[
    {"id":"a","text":"alfa"},
    {"id":"b","text":"beta"},
    {"id":"c","text":"gamma"},
    {"id":"d","text":"delta"},
    {"id":"e","text":"epsilon"}
  ]'::jsonb AS options
),
fixtures AS (
  SELECT * FROM (
    VALUES
      (
        '01_full_valid',
        true,
        '{
          "version": 2,
          "correctReason": "Mechanizm poprawnej odpowiedzi w jednym akapicie.",
          "takeaway": "Jedna zasada do odtworzenia.",
          "distractors": {
            "a": "Inny mechanizm, nie ten.",
            "c": "Mylone z sąsiednim pojęciem."
          },
          "trap": "Łatwo pomylić z sąsiednim rozpoznaniem.",
          "contrast": [
            ["cecha", "ostre", "przewlekłe"],
            ["czas", "dni", "miesiące"]
          ]
        }'::jsonb
      ),
      (
        '02_minimal_correctReason_only',
        true,
        '{"version":2,"correctReason":"Tylko mechanizm."}'::jsonb
      ),
      (
        '03_missing_version',
        false,
        '{"correctReason":"Mechanizm bez wersji."}'::jsonb
      ),
      (
        '04_version_1',
        false,
        '{"version":1,"correctReason":"Stary kształt bloków."}'::jsonb
      ),
      (
        '05_empty_correctReason',
        false,
        '{"version":2,"correctReason":""}'::jsonb
      ),
      (
        '06_takeaway_201',
        false,
        jsonb_build_object(
          'version', 2,
          'correctReason', 'Mechanizm.',
          'takeaway', repeat('x', 201)
        )
      ),
      (
        '07_distractor_is_correct_key',
        false,
        '{
          "version": 2,
          "correctReason": "Mechanizm.",
          "distractors": {"b": "To jest klucz, nie dystraktor."}
        }'::jsonb
      ),
      (
        '08_distractor_outside_options',
        false,
        '{
          "version": 2,
          "correctReason": "Mechanizm.",
          "distractors": {"z": "Nie ma takiej opcji."}
        }'::jsonb
      ),
      (
        '09_option_letter_in_text',
        false,
        '{"version":2,"correctReason":"To jest opcja B i dlatego odpada."}'::jsonb
      ),
      (
        '10_markdown_heading',
        false,
        jsonb_build_object(
          'version', 2,
          'correctReason', '# Nagłówek' || chr(10) || 'dalej mechanizm.'
        )
      ),
      (
        '11_emoji',
        false,
        '{"version":2,"correctReason":"Tu jest 💡 i to ma spaść."}'::jsonb
      ),
      (
        '12_contrast_four_columns',
        false,
        '{
          "version": 2,
          "correctReason": "Mechanizm.",
          "contrast": [["a", "b", "c", "d"]]
        }'::jsonb
      )
  ) AS t(name, expected, blocks)
)
SELECT
  f.name,
  f.expected,
  public.explanation_blocks_valid(f.blocks, o.options, 'b') AS actual,
  public.explanation_blocks_valid(f.blocks, o.options, 'b') = f.expected AS ok
FROM fixtures f
CROSS JOIN opts o
ORDER BY f.name;

-- Character proofs for explanation_blocks_text_allowed
SELECT
  ch,
  expected_allowed,
  public.explanation_blocks_text_allowed(ch) AS actual,
  public.explanation_blocks_text_allowed(ch) = expected_allowed AS ok
FROM (
  VALUES
    ('💡', false),
    ('✅', false),
    ('ó', true),
    ('ż', true),
    ('→', true),
    ('≥', true)
) AS t(ch, expected_allowed);
