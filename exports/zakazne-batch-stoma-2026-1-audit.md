# Audyt batcha z2026-1

**Źródło:** `/Users/miuoshk/Downloads/ZAKSTO-e2026-1.txt` · **SQL:** `exports/zakazne-batch-stoma-2026-1.sql` · **TXT fabryki:** `exports/zaksto-e2026-1-factory.txt`

- pytań w pliku: **41** (ZAKSTO-843 … ZAKSTO-883)
- exact vs baza: 1
- near vs baza: 1
- do wstawienia: **41** (cały egzamin, bez wycinania near-dupów)

## Rozkład tematów

| topic_id | n |
|---|---:|
| `ZAKAZ-03` | 1 |
| `ZAKAZ-04` | 2 |
| `ZAKAZ-05` | 1 |
| `ZAKAZ-06` | 2 |
| `ZAKAZ-08` | 5 |
| `ZAKAZ-10` | 2 |
| `ZAKAZ-11` | 2 |
| `ZAKAZ-12` | 14 |
| `ZAKAZ-13` | 9 |
| `ZAKAZ-22` | 3 |

## Near-duplikaty (nie wycięte)

- `ZAKSTO-843` [exact] `ZAKAZ-11` ↔ `zaksto-z2023-1-75` (z2023-1)
- `ZAKSTO-853` [fuzzy] `ZAKAZ-04` ↔ `zaksto-z2020-1-123` (z2020-1)

## Uwagi

- `topic_id` = `ZAKAZ-NN` (produkcja; puste `CHZ-*` usunięte).
- `id` = `zaksto-z2026-1-{NR}` jak batch z2025-1; `source_code` = `ZAKSTO-843`…
- `tracks` NULL — przedmiot `stoma-zakazne` jest już tylko STOMA.
- `theme_label = 2026` pod kafelek `stoma-zakazne-THEME-2026`.
- ZAKSTO-846, 857, 883 — usunięte notatki warsztatowe (oryginał / Autor klucza); FLAGA: wycięta.
