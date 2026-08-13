# Audyt batcha e_anat_2026/1

**Źródło:** `/Users/miuoshk/Downloads/ANATLEK-e2026-1.txt` · **SQL:** `exports/anatomia-batch-lek-2026-1.sql` · **TXT fabryki:** `exports/anatlek-e2026-1-factory.txt`

- pytań w pliku: **100** (ANATLEK-706 … ANATLEK-805)
- exact vs baza: 4
- near vs baza: 11
- do wstawienia: **100** (cały egzamin, bez wycinania near-dupów)

## Rozkład tematów

| topic_id | n |
|---|---:|
| `ANA-CZA` | 9 |
| `ANA-JAM` | 4 |
| `ANA-KON` | 12 |
| `ANA-MIE` | 1 |
| `ANA-NAC` | 7 |
| `ANA-NER` | 6 |
| `ANA-OBW` | 7 |
| `ANA-OUN` | 15 |
| `ANA-TRZ` | 31 |
| `ANA-TUL` | 8 |

## Near-duplikaty (nie wycięte)

- `ANATLEK-717` [exact] `ANA-CZA` ↔ `ana-jam-013` (ANATSTO-565, e_anat_sto_2024/1)
- `ANATLEK-743` [exact] `ANA-TRZ` ↔ `ana-trz-005` (ANAT-e2025-1-012, e_anat_2025/1)
- `ANATLEK-776` [exact] `ANA-NAC` ↔ `ana-nac-009` (ANAT-e2025-2-141, e_anat_2025/2)
- `ANATLEK-777` [exact] `ANA-TRZ` ↔ `ana-trz-105` (ANAT-e2024-2-347, e_anat_2024/2)
- `ANATLEK-727` [substring] `ANA-OBW` ↔ `ana-obw-009` (ANAT-e2025-2-102, e_anat_2025/2)
- `ANATLEK-728` [substring] `ANA-OBW` ↔ `ana-nac-026` (ANAT-e2023-1-458, e_anat_2023/1)
- `ANATLEK-739` [fuzzy] `ANA-KON` ↔ `ana-kon-011` (ANAT-e2025-1-088, e_anat_2025/1)
- `ANATLEK-744` [substring] `ANA-TRZ` ↔ `ana-tul-075` (ANATLEK-349, e_anat_2019/1)
- `ANATLEK-746` [substring] `ANA-NAC` ↔ `ana-nac-082` (ANATLEK-327, e_anat_2019/1)
- `ANATLEK-749` [substring] `ANA-TUL` ↔ `ana-tul-008` (ANAT-e2025-2-116, e_anat_2025/2)
- `ANATLEK-765` [fuzzy] `ANA-TRZ` ↔ `ana-trz-252` (ANATLEK-299, e_anat_2019/1)
- `ANATLEK-779` [substring] `ANA-OUN` ↔ `ana-oun-073` (ANAT-e2022-1-581, e_anat_2022/1)
- `ANATLEK-783` [fuzzy] `ANA-KON` ↔ `ana-kon-032` (ANAT-e2024-1-229, e_anat_2024/1)
- `ANATLEK-799` [substring] `ANA-KON` ↔ `ana-kon-022` (ANAT-e2025-2-156, e_anat_2025/2)
- `ANATLEK-801` [substring] `ANA-KON` ↔ `ana-kon-104` (ANATSTO-688, e_anat_sto_2023/2)

## Naprawy liter w wyjaśnieniach

- ANATLEK-715, 728, 737, 741, 747, 750, 752, 758 — litery / meta recenzenckie w wyjaśnieniach.
- Usunięte linie `FLAGA: weryfikacja merytoryczna` (nie dla studenta).

## Uwagi

- ANATLEK-715 i ANATLEK-745 mają ten sam krótki trzon („Tętnica wieńcowa lewa:”), ale inne opcje — oba zostają.
- Exact/near vs baza to te same krótkie stemy z **innym** zestawem opcji — nie wycinane.
- Meta-opcje (Prawidłowe A i B itd.) — frontend sam wyłącza shuffle.
- `tracks` NULL = anatomia wspólna LEK+STOMA.
