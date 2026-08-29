# Audyt batcha biofizyka LEK 2026

**SQL:** `exports/biofizyka-batch-lek-2026-1.sql` · **JSON:** `exports/biofizyka-batch-lek-2026-1.json` · **TXT:** `exports/BIOFIZLEK-e2026-1.txt`

- pytań: **69** (BIOFIZLEK-71 … BIOFIZLEK-139)
- 4 opcje `a`–`d` (format egzaminu SUM; jak reszta biofizyki)
- LaTeX/`$...$` bez zmian — KaTeX w sesji
- `tracks = ['lekarski']` — kafelek 2026 i pytania tylko na lekarskim
- `theme_label = 2026` → kafelek `biofizyka-THEME-2026` (cien `question_count=0`, bez duplikatu wierszy)
- pytania leżą w `BIOF-*` (plus `BIOF-INNE` na TEMAT „Inne”)

## Rozkład tematów

| topic_id | n |
|---|---:|
| `BIOF-C1` | 3 |
| `BIOF-C2` | 9 |
| `BIOF-C3` | 9 |
| `BIOF-C4` | 2 |
| `BIOF-INNE` | 11 |
| `BIOF-S1` | 4 |
| `BIOF-S2` | 7 |
| `BIOF-S3` | 9 |
| `BIOF-W1` | 5 |
| `BIOF-W4` | 3 |
| `BIOF-W5` | 7 |

## Uwagi

- Mapowanie po nazwie TEMAT, nie TEMAT_NR.
- TEMAT „Inne” → nowy dział `BIOF-INNE` (tylko lekarski, display_order 12).
- BIOFIZLEK-74 / 89 / 108 / 110 / 120 / 132 — usunięte odwołania do liter i „Autor klucza” (tasowanie opcji).
- FLAGA: weryfikacja merytoryczna zdjęta z wyjaśnień; treść i klucz bez zmian.
- Nie wykonywać SQL dwa razy: batch_label jest unikatowy, ale INSERT nie ma ON CONFLICT na source_code.
