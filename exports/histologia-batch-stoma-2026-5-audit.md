# Audyt batcha histologia STOMA 2026 (egzamin)

**SQL:** `exports/histologia-batch-stoma-2026-5.sql` · **JSON:** `exports/histologia-batch-stoma-2026-5.json` · **TXT:** `exports/HISSTO-e2026-1.txt`

- pytań: **58** (`HISSTO-e2026-1-222` … `HISSTO-e2026-1-279`)
- 5 opcji `a`–`e`
- `tracks = ['stomatologia']` — tylko stoma; lekarz nie widzi tych pytań ani w działach, ani w kafelku 2026
- `theme_label = 2026` → istniejący kafelek `histologia-THEME-2026` (cień `question_count=0`)
- pytania leżą w `HIST-*` (w tym HIST-21 Rozwój zęba)
- `batch_label = e_hist_stoma_2026/5` (/1–/4 to wcześniejsze wsady stomy bez theme_label)

## Rozkład tematów

| topic_id | n |
|---|---:|
| `HIST-02` | 2 |
| `HIST-04` | 3 |
| `HIST-05` | 4 |
| `HIST-08` | 1 |
| `HIST-09` | 2 |
| `HIST-11` | 4 |
| `HIST-12` | 2 |
| `HIST-13` | 4 |
| `HIST-14` | 3 |
| `HIST-15` | 2 |
| `HIST-18` | 5 |
| `HIST-19` | 1 |
| `HIST-20` | 5 |
| `HIST-21` | 17 |
| `HIST-22` | 3 |

## Uwagi

- Mapowanie po nazwie TEMAT, ze sprawdzeniem TEMAT_NR.
- Kafla 2026 nie przestawiamy na stomę — LEK ma już `e_hist_lek_2026/1` pod tym samym kafelkiem.
- Meta-opcje (A, B, C) w treściach odpowiedzi — frontend wyłącza tasowanie.
