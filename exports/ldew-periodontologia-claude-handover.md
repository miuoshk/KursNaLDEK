# Handover dla Claude — LDEW · Periodontologia

> **Status:** przedmiot + 22 tematy w Supabase (`scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql`).  
> **Produkt:** `ldew` · **Widoczność:** użytkownicy z `profiles.current_product = 'ldew'`.  
> **Źródło mapy tematów:** Periodontologia Górska (OCR), wykłady 1–22.  
> **Format pytań:** `FormatPisaniaPytan-LDEW.md`.

---

## 1. Przedmiot (`subjects`)

| `subjects.id` | Nazwa | Track | Product | Prefiks pytań |
|---|---|---|---|---|
| `ldew-periodontologia` | Periodontologia | `stomatologia` | `ldew` | `per-` |

---

## 2. Tematy — Periodontologia (`ldew-periodontologia`)

| `topics.id` | `display_order` | Nazwa |
|---|---:|---|
| `PER-01` | 1 | Budowa i czynność tkanki przyzębia |
| `PER-02` | 2 | Etiologia i patogeneza chorób przyzębia |
| `PER-03` | 3 | Rozpoznanie chorób przyzębia |
| `PER-04` | 4 | Współistniejące schorzenia ogólnoustrojowe |
| `PER-05` | 5 | Przewlekłe zapalenie dziąseł |
| `PER-06` | 6 | Przewlekłe zapalenie przyzębia |
| `PER-07` | 7 | Agresywne zapalenie przyzębia |
| `PER-08` | 8 | ZAP choroba w okresie okołoporodowym |
| `PER-09` | 9 | Zapalenie przyzębia jako powikłanie leczenia endodontycznego |
| `PER-10` | 10 | Nekrotyzujące zapalenie dziąseł |
| `PER-11` | 11 | Nekrotyzujące zapalenie przyzębia |
| `PER-12` | 12 | Przyzębie zębów mlecznych |
| `PER-13` | 13 | Wrodzone wady przyzębia |
| `PER-14` | 14 | Przyzębie wokół zębów utrwalonych |
| `PER-15` | 15 | Przyzębie wokół koron protetycznych |
| `PER-16` | 16 | Przyzębie wokół implantów |
| `PER-17` | 17 | Choroby tkanek miękkich jamy ustnej |
| `PER-18` | 18 | Choroby tkanek twardych jamy ustnej |
| `PER-19` | 19 | Metody leczenia chorób przyzębia — ogólne zasady |
| `PER-20` | 20 | Leczenie zachowawcze |
| `PER-21` | 21 | Leczenie chirurgiczne |
| `PER-22` | 22 | Leczenie wspomagające |

---

## 3. Konwencja ID pytań

```
{prefiks}-{nr_tematu}-{NNN}
```

| Przykład `questions.id` | `topic_id` |
|---|---|
| `per-01-001` | `PER-01` |
| `per-07-014` | `PER-07` |
| `per-22-010` | `PER-22` |

- `question_type`: `single_choice`
- `options`: 5 opcji `a`–`e`
- `batch_label`: np. `e_per_2026/1`

---

## 4. Pozostałe przedmioty LDEW (kafelki bez tematów — na później)

| `subjects.id` | Nazwa |
|---|---|
| `ldew-stomatologia-zachowawcza` | Stomatologia zachowawcza |
| `ldew-endodoncja` | Endodoncja |
| `ldew-choroby-sluzowki` | Choroby błony śluzowej jamy ustnej |
| `ldew-stomatologia-dziecieca` | Stomatologia dziecięca |
| `ldew-protetyka` | Protetyka stomatologiczna |
| `ldew-chirurgia-stomatologiczna` | Chirurgia stomatologiczna |
| `ldew-chirurgia-szczekowo-twarzowa` | Chirurgia szczękowo-twarzowa |
| `ldew-radiologia` | Radiologia stomatologiczna |
| `ldew-zdrowie-publiczne` | Zdrowie publiczne |
| `ldew-orzecznictwo` | Orzecznictwo |

Prefiksy tematów/pytań dla nowych przedmiotów: patrz `FormatPisaniaPytan-LDEW.md` §1.

---

## 5. Prompt startowy (kopiuj-wklej)

```
Przygotowujesz pytania MCQ do Supabase dla Kurs na LDEW (nostryfikacja).

Przedmiot: ldew-periodontologia (prefiks: per-, tematy PER-01…PER-22)
Mapa: exports/ldew-periodontologia-claude-handover.md
Format: FormatPisaniaPytan-LDEW.md

Output: SQL INSERT + UPDATE question_count.

Zacznij od tematu [PER-01 / …] — wygeneruj [N] pytań.
```
