# Audyt batcha e_hist_lek_2026/1

**Źródło:** `/Users/miuoshk/Downloads/HISLEK-e2026-1.txt` · **SQL:** `exports/histologia-batch-lek-2026-1.sql` · **TXT fabryki:** `exports/hislek-e2026-1-factory.txt`

- pytań w pliku: **60** (HISLEK-e2026-1-844 … HISLEK-e2026-1-903)
- exact vs baza: 0
- near vs baza: 11
- do wstawienia: **60** (cały egzamin, bez wycinania near-dupów)

## Rozkład tematów

| topic_id | n |
|---|---:|
| `HIST-04` | 1 |
| `HIST-05` | 4 |
| `HIST-06` | 1 |
| `HIST-07` | 3 |
| `HIST-08` | 1 |
| `HIST-09` | 5 |
| `HIST-11` | 2 |
| `HIST-12` | 5 |
| `HIST-13` | 4 |
| `HIST-14` | 6 |
| `HIST-15` | 4 |
| `HIST-16` | 1 |
| `HIST-17` | 1 |
| `HIST-18` | 8 |
| `HIST-19` | 4 |
| `HIST-20` | 4 |
| `HIST-22` | 6 |

## Near-duplikaty (nie wycięte)

- `HISLEK-e2026-1-845` [substring] `HIST-09` ↔ `HIST-09-029` (HISLEK-e2022-1-403, None)
- `HISLEK-e2026-1-856` [substring] `HIST-15` ↔ `HIST-02-014` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-859` [substring] `HIST-15` ↔ `HIST-02-014` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-871` [fuzzy] `HIST-12` ↔ `HIST-12-058` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-872` [substring] `HIST-18` ↔ `HIST-18-035` (HISLEK-e2023-1-287, None)
- `HISLEK-e2026-1-876` [substring] `HIST-15` ↔ `HIST-02-014` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-881` [substring] `HIST-16` ↔ `HIST-02-014` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-883` [substring] `HIST-06` ↔ `HIST-05-031` (HISLEK-e2017-1-810, None)
- `HISLEK-e2026-1-884` [fuzzy] `HIST-14` ↔ `HIST-19-031` (HISLEK-e2023-1-243, None)
- `HISLEK-e2026-1-893` [substring] `HIST-15` ↔ `HIST-02-015` (None, e_hist_stoma_2026/3)
- `HISLEK-e2026-1-894` [substring] `HIST-11` ↔ `HIST-11-044` (None, e_hist_stoma_2026/3)

## Uwagi

- `tracks` NULL = histologia wspólna LEK+STOMA (jak anatomia e2026-1).
- `theme_label = 2026` pod kafelek wirtualny `histologia-THEME-2026`.
- ID: `HIST-NN-NNN` (wielkie litery, jak istniejące pytania histologii).
- Meta-opcje (A, B, C itd.) — frontend sam wyłącza shuffle.
