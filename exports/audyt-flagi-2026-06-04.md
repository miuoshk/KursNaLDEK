# Audyt flag merytorycznych i pustych przebiegów — 2026-06-04

> **Tryb: WYŁĄCZNIE ODCZYT.** Nie wykonano żadnego `UPDATE`/`INSERT`/`DELETE`. Połączenie przez Supabase MCP (management API, omija RLS — widoczne wszystkie pytania, także `is_active = false`).
> Projekt: `Kurs na LDEK` (`unfcpipxraiyacyzqanh`). Tabela `questions`, `total = 7508`, `is_active=false = 23`.

## Metoda

KROK 1 — inwentaryzacja po `explanation` (warianty `ILIKE`):
- **a) flaga merytoryczna:** `%FLAGA%`, `%weryfikacja merytoryczna%` → **70** trafień
- **b) adnotacje autora/procesu:** `%Autor wskaz%`, `%Autor klucza%`, `%Klucz autora%`, `%Pierwotny klucz%`, `%poprawnie jest%`, `%w pliku źródłowym%`, `%w oryginale%`, `%dorobiono/dorobione%`, `%brak opcji%`, `%niekompletn%`, `%Pytanie z pliku%`, `%interpretuję jako%`, `%nieprecyzyjne%`, `%było niejasne%` → **96** trafień
- **c) puste/szczątkowe:** `explanation IS NULL OR length(trim(explanation)) < 40` → **2** trafienia
- **suma unikalnych (a∪b∪c):** **146** pytań (analizowane poniżej)

KROK 2 — każdemu trafieniu przypisano dokładnie jedną kategorię A/B/C/D/E. Ocena merytoryczna wg podręczników: anatomia (Bochenek, Sobotta, Sokołowska-Pituchowa, Ślusarczyk), histologia (Sawicki/Ostrowski, Malejczyk), zakaźne/mikrobiologia (Dziubek, Cianciara&Juszczyk). Reguła konserwatywna: przy wahaniu B↔E wybrano **E**.

> **Ograniczenie metody:** analizowane są wyłącznie pytania, których *wyjaśnienie* zawiera flagę/adnotację/jest puste. Błędny klucz w pytaniu z „czystym" wyjaśnieniem **nie zostanie wykryty** tym zapytaniem. Do pełnego audytu kluczy potrzebny osobny przebieg porównujący treść opcji z wyjaśnieniem na całej bazie.

---

## PRIORYTET ❶ — [B] BŁĄD KLUCZA (3) — najpilniejsze

| id | topic_id | batch_label | obecny_klucz | sugerowany_klucz | co zrobić | uzasadnienie |
|---|---|---|---|---|---|---|
| ana-ner-029 | ANA-NER | e_anat_2023/1 | **d** (n. twarzowy) | **c** (n. żuchwowy V3) | zmienić klucz na `c` *(już `is_active=false`)* | M. tensor tympani pochodzi z I łuku skrzelowego → unerwienie **V3**. VII unerwia m. stapedius (II łuk) — autor pomylił mięśnie. |
| ana-ner-048 | ANA-NER | e_anat_2022/1 | **e** (V) | **b** (VII) | zmienić klucz na `b` *(już `is_active=false`)* | Zwój skrzydłowo-podniebienny otrzymuje włókna **przedzwojowe przywspółczulne z n. VII** (n. skalisty większy → n. kanału skrzydłowego). V daje tylko gałęzie **czuciowe**, nie autonomiczne. |
| HIST-13-027 | HIST-13 | — | **d** (A,B) | **e** (A,B,C) | zmienić klucz na `e` | CTL: A=CD8 ✓, B=aktywacja/proliferacja przy IL-2 ✓, **C=uwalnianie perforyn i granzymów ✓ (cecha definicyjna)**. Klucz `d` pomija prawdziwą opcję C. Klucz pierwotny D zachowano „dla zgodności z LDEK" — sprzeczne z podręcznikiem. |

---

## PRIORYTET ❷ — [D] PYTANIE ZEPSUTE (2) — kandydaci do `is_active=false`

| id | topic_id | batch_label | obecny_klucz | sugerowany_klucz | co zrobić | uzasadnienie |
|---|---|---|---|---|---|---|
| ana-trz-140 | ANA-TRZ | e_anat_2023/1 | **e** | — | przejrzeć ręcznie / `is_active=false` | „Żołądek:" — wszystkie 5 opcji fałszywe. Klucz `e` (unerwienie przez splot podbrzuszny górny) ewidentnie błędny (żołądek = n. błędne). Sugerowane przez autora `b` też błędne jako zapisane („tworzy **tylną** ścianę torby sieciowej" — żołądek tworzy **przednią**). Brak poprawnej opcji. |
| HIST-13-044 | HIST-13 | — | **e** | — | przejrzeć ręcznie / `is_active=false` | „Która choroba NIE jest autoimmunologiczna?" — **wszystkie A–E są autoimmunologiczne** (Hashimoto, T1DM, SM, RA, Goodpasture/anty-GBM). Brak poprawnej odpowiedzi; `e` to placeholder. |

---

## PRIORYTET ❸ — [C] PUSTE WYJAŚNIENIE (2) — klucz OK, dopisać wyjaśnienie

| id | topic_id | batch_label | obecny_klucz | sugerowany_klucz | co zrobić | uzasadnienie / weryfikacja klucza |
|---|---|---|---|---|---|---|
| HIST-16-042 | HIST-16 | e_hist_stoma_2026/4 | **b** | bez zmian | dopisać wyjaśnienie | „W jakiej warstwie skóry są ciałka Paciniego?" — `b` (warstwa siateczkowata skóry właściwej i tkanka podskórna) **poprawne**. |
| zaksto-baza_zajęcia-343 | ZAKAZ-12 | baza_zajęcia | **a** | bez zmian | dopisać wyjaśnienie | „Wybierz fałszywe o pryszczycy" — `a` („często występuje wśród ludzi") jest zdaniem fałszywym (pryszczyca/FMD rzadka u ludzi) → klucz **poprawny**. |

---

## PRIORYTET ❹ — [A] ADNOTACJA DO WYCIĘCIA (129) — klucz OK, usunąć meta-adnotację

> Dla wszystkich poniżej: **sugerowany_klucz = bez zmian**, **co_zrobić = usunąć z `explanation` adnotację meta/procesową (znaczniki `[FLAGA MERYTORYCZNA]`, `DO WERYFIKACJI`, „Klucz/Autor klucza…", „Flaga walidatorska/źródłowa…", odwołania do batchy/`Q###`, „cytat w PDF", „green/bold"), zachowując treść merytoryczną.** Część to trafienia przypadkowe (np. idiom „czerwona flaga") — wtedy nic nie wycinać.

| id | topic_id | batch_label | obecny_klucz | fragment / adnotacja do wycięcia |
|---|---|---|---|---|
| ana-cza-030 | ANA-CZA | e_anat_2024/2 | c | „Bezpośrednia powtórka z batcha 2 (Q125…)" |
| ana-cza-034 | ANA-CZA | e_anat_2023/1 | d | „Autor wskazał D … jako klucz" + dygresja o nieparzystości |
| ana-kon-064 | ANA-KON | e_anat_2023/1 | e | „Klucz autora E poprawny" |
| ana-nac-031 | ANA-NAC | e_anat_2023/2 | b | „Klucz autora „wyrostek sutkowy" zaznaczony green, ze źródłem…" |
| ana-nac-041 | ANA-NAC | e_anat_2022/1 | c | „Klucz autora C wskazuje… anatomicznie OK ale nie wymienia n. przeponowego" |
| ana-ner-047 | ANA-NER | e_anat_2022/1 | b | „KLUCZ AUTORA „B — Tętnica"" + „pytanie nieprecyzyjne" *(is_active=false)* |
| ana-obw-042 | ANA-OBW | e_anat_2023/1 | c | „(klucz autora C, oznaczony „!" …)" |
| ana-obw-055 | ANA-OBW | e_anat_2023/2 | c | „Komentarz autora „C8-Th1 - TUTAJ PYTALI…"" + „Klucz autora „brak poprawnej odp."" |
| ana-oun-050 | ANA-OUN | e_anat_2023/1 | a | „ale autor wskazał A" (warianty 2-/3-neuronowości wg Bochenka) |
| ana-oun-055 | ANA-OUN | e_anat_2023/1 | b | „Niezgodność nomenklaturowa… batch 4 (ID 328)… w SQL ustalić standard" *(is_active=false)* |
| ana-oun-062 | ANA-OUN | e_anat_2023/2 | a | „Klucz autora „spoidło przednie"" |
| ana-oun-066 | ANA-OUN | e_anat_2023/2 | a | „Klucz autora A „S2-S4"" |
| ana-oun-079 | ANA-OUN | e_anat_2022/1 | a | „klucz A z PDF green" |
| ana-trz-039 | ANA-TRZ | e_anat_2025/2 | a | „autor klucza wskazał… jako najbardziej fundamentalną cechę" |
| ana-trz-049 | ANA-TRZ | e_anat_2025/2 | e | „Klucz autora: prawdziwe są wszystkie trzy" + dygresja „żołądkowo-przeponowe" |
| ana-trz-069 | ANA-TRZ | e_anat_2024/1 | e | „Autor klucza wskazał E… W batchu 2 … odpowiedź B … dla SQL przyjąć jeden standard" *(is_active=false)* |
| ana-trz-127 | (patrz [E]) | — | — | — |
| ana-trz-158 | ANA-TRZ | e_anat_2023/2 | b | „Klucz autora „brodawce cewkowej" zgodny z Bochenkiem (cytat w PDF)" |
| ana-trz-160 | ANA-TRZ | e_anat_2023/2 | a | „Klucz autora „aorta zstępująca"" |
| ana-trz-161 | ANA-TRZ | e_anat_2023/2 | c | „Klucz autora C (gałąź lewa) — zgodne z embriologią" |
| ana-trz-167 | ANA-TRZ | e_anat_2023/2 | d | „Klucz autora D (błona podwłóknista) — wg Bochenka T2 s.488 (cytat autora)" |
| ana-trz-173 | ANA-TRZ | e_anat_2023/2 | e | „Klucz E zaznaczony bold — autor wskazuje pewność" |
| ana-trz-179 | ANA-TRZ | e_anat_2023/2 | c | „Klucz autora „t. żołądkowa prawa"" (opcja c = „prawa i lewa", poprawna) |
| ana-trz-181 | ANA-TRZ | e_anat_2023/2 | e | „Klucz autora „między śródpiersiami" zaznaczony bold" |
| ana-trz-207 | ANA-TRZ | e_anat_2022/1 | d | „Klucz autora D „tt. płatowe"" |
| ana-trz-209 | ANA-TRZ | e_anat_2022/1 | a | „Cytat autora: „Bochenek II, str 202"" |
| ana-tul-044 | ANA-TUL | e_anat_2023/2 | d | „Klucz autora „Kręgosłupem" … cytujący Bochenka i Pituchową" |
| ana-zal-066 | ANA-ZAL | r_anat_2025/2 | e | „klucz wskazuje E" (opcja C niepełna) |
| FARM-12-039 | FARM-12 | e2022-1 | e | „Autor klucza zaznacza E z adnotacją zgodną z podręcznikiem" |
| FARM-15-030 | FARM-15 | e2020-2 | b | „autor klucza wskazał B; opcja D z ryfampicyną … dyskusyjna" |
| HIST-01-010 | HIST-01 | — | b | „[FLAGA MERYTORYCZNA] Klucz B" + „Różni się od Q653…" |
| HIST-02-001 | HIST-02 | — | a | „[FLAGA MERYTORYCZNA] Klucz autora wskazuje A … klucz A przyjęty egzaminacyjnie" |
| HIST-02-003 | HIST-02 | — | a | „Klucz autora A (opcje B–E rekonstruowane…)" |
| HIST-02-004 | HIST-02 | — | a | „Klucz autora A (opcje B–E rekonstruowane)" |
| HIST-02-005 | HIST-02 | — | a | „[FLAGA MERYTORYCZNA] … Klucz A. Flaga: …" |
| HIST-03-001 | HIST-03 | — | e | „Klucz autora E … Przyjmujemy klucz E dla LDEK" |
| HIST-03-012 | HIST-03 | — | a | „[FLAGA MERYTORYCZNA] Klucz A — z uproszczeniem" |
| HIST-03-020 | HIST-03 | — | b | „[FLAGA MERYTORYCZNA] Klucz B" |
| HIST-03-025 | HIST-03 | — | d | „[FLAGA MERYTORYCZNA] … Klucz autora D … Flaga: „błona mitochondrium" nieprecyzyjne" |
| HIST-03-026 | HIST-03 | — | a | „[FLAGA MERYTORYCZNA] … Klucz A poprawnie" |
| HIST-03-027 | HIST-03 | — | b | „Klucz autora B — bardziej klasyczna funkcja" |
| HIST-03-029 | HIST-03 | — | e | „Klucz autora E … klucz E jest zasadny" |
| HIST-03-032 | HIST-03 | — | e | „Klucz autora E (brak poprawnej odpowiedzi)" |
| HIST-03-033 | HIST-03 | — | a | „Klucz autora A (katalaza) — odpowiedź podręcznikowa" |
| HIST-03-036 | HIST-03 | — | e | „Klucz autora E (faza M)" |
| HIST-03-038 | HIST-03 | — | a | „Klucz autora „DO WERYFIKACJI" … Klucz A przyjęty jako „najmniej błędny"" |
| HIST-04-003 | HIST-04 | — | e | „[FLAGA MERYTORYCZNA] Klucz autora E … stąd flaga merytoryczna" |
| HIST-04-008 | HIST-04 | — | a | „Klucz autora A … klucz A przyjęty" |
| HIST-05-022 | HIST-05 | — | d | „[FLAGA MERYTORYCZNA: klucz autora D] Klucz D" |
| HIST-05-026 | HIST-05 | — | a | „[FLAGA MERYTORYCZNA] Klucz A — powtórka Q579 e2020-1" |
| HIST-05-030 | HIST-05 | — | e | „Klucz E: …" (treść merytoryczna OK) |
| HIST-07-014 | HIST-07 | — | e | „Klucz autora E (brak prawidłowej odpowiedzi) … Klucz E poprawny" |
| HIST-08-018 | HIST-08 | — | d | „Klucz autora D (kalcytonina + estrogeny)" |
| HIST-09-014 | HIST-09 | — | e | „Zdanie B nieprecyzyjne…" (treść OK) |
| HIST-09-038 | HIST-09 | — | b | „[FLAGA MERYTORYCZNA] Klucz autora B … Klucz B zachowany" |
| HIST-09-042 | HIST-09 | — | a | „klucz autora „DO WERYFIKACJI" … Klucz przyjęty: A" |
| HIST-09-045 | HIST-09 | — | e | „Klucz autora „DO WERYFIKACJI" … Klucz E przyjęty jako „najmniej błędny"" |
| HIST-10-020 | HIST-10 | — | a | „[FLAGA MERYTORYCZNA] Klucz autora A (B–E rekonstruowane…)" |
| HIST-10-022 | HIST-10 | — | e | „Klucz autora E (A, B, C) — z zastrzeżeniami" |
| HIST-11-026 | HIST-11 | — | e | „[FLAGA MERYTORYCZNA] Klucz E (B+C+D)" |
| HIST-11-029 | HIST-11 | — | c | „[FLAGA MERYTORYCZNA] Klucz C … A FAŁSZ lub dyskusyjne" |
| HIST-11-035 | HIST-11 | — | e | „[FLAGA MERYTORYCZNA] … Klucz autora E. Flaga: …" |
| HIST-11-036 | HIST-11 | — | c | „[FLAGA MERYTORYCZNA] … Klucz C poprawnie" |
| HIST-11-037 | HIST-11 | — | e | „[FLAGA MERYTORYCZNA] … klucz E zachowany" |
| HIST-11-040 | HIST-11 | — | c | „klucz C przyjęty egzaminacyjnie" |
| HIST-12-032 | HIST-12 | — | a | „[FLAGA: formulacja „NAJWIĘKSZE białko osocza" jest niedokładna … klucz A poprawny w tym kontekście]" |
| HIST-12-041 | HIST-12 | — | a | „Klucz A — autor klucza zaznaczył „A, B DO WERYFIKACJI"" |
| HIST-12-044 | HIST-12 | — | d | „[FLAGA MERYTORYCZNA] Klucz D" |
| HIST-12-045 | HIST-12 | — | e | „[FLAGA MERYTORYCZNA] Klucz autora (rekonstrukcja opcji C–E)" |
| HIST-12-046 | HIST-12 | — | a | „[FLAGA MERYTORYCZNA] … Klucz A … Flaga: serotonina … sporna" |
| HIST-12-048 | HIST-12 | — | a | „klucz autora A wskazuje na śledzionę … Klucz: A" |
| HIST-12-050 | HIST-12 | — | a | „Klucz autora A (syderosomy) … Klucz: A" |
| HIST-13-025 | HIST-13 | — | a | „Klucz autora A akcentuje grasicę" |
| HIST-13-047 | HIST-13 | — | c | „[FLAGA MERYTORYCZNA] Klucz C" |
| HIST-13-049 | HIST-13 | — | e | „[FLAGA MERYTORYCZNA] … Klucz autora E (B+C…)" |
| HIST-13-050 | HIST-13 | — | b | „Klucz autora B (opcje C–E rekonstruowane…)" |
| HIST-13-052 | HIST-13 | — | e | „klucz autora wskazuje E … pytanie niejednoznaczne … Klucz: E" |
| HIST-14-055 | HIST-14 | — | d | „D jest fałszywe…" (treść OK) |
| HIST-14-079 | HIST-14 | — | c | „[FLAGA MERYTORYCZNA] Klucz C FAŁSZ" |
| HIST-14-084 | HIST-14 | — | e | „[FLAGA MERYTORYCZNA] … Klucz autora E … stąd flaga" |
| HIST-14-085 | HIST-14 | — | a | „[FLAGA MERYTORYCZNA] … Klucz A … Flaga: „gruczoły wielopokładowe" — nieklasyczne" |
| HIST-15-042 | HIST-15 | — | a | „[FLAGA MERYTORYCZNA] Klucz A … Autor przyjął A jako COPD" |
| HIST-15-045 | HIST-15 | — | b | „[FLAGA MERYTORYCZNA] Klucz B" |
| HIST-15-046 | HIST-15 | — | a | „[FLAGA MERYTORYCZNA] Klucz A" |
| HIST-15-048 | HIST-15 | — | b | „[FLAGA MERYTORYCZNA] … Klucz autora B … klucz B zachowany egzaminacyjnie" |
| HIST-15-049 | HIST-15 | — | d | „[FLAGA MERYTORYCZNA] … Klucz D logiczny. Flaga: pytanie poprawne merytorycznie, flaga ze względu na wysoką flagowalność batcha" |
| HIST-15-050 | HIST-15 | — | b | „[FLAGA MERYTORYCZNA] … Klucz B poprawnie" |
| HIST-15-052 | HIST-15 | — | e | „Klucz autora „DO WERYFIKACJI" … przyjęto E jako najpełniejszą" |
| HIST-16-025 | HIST-16 | — | a | „[FLAGA MERYTORYCZNA] Klucz A" |
| HIST-16-030 | HIST-16 | — | e | „[FLAGA MERYTORYCZNA] Klucz E" |
| HIST-16-032 | HIST-16 | — | a | „Klucz autora wskazuje A" |
| HIST-16-037 | HIST-16 | — | c | „[FLAGA MERYTORYCZNA] … Klucz C … zachowany. Flaga: …" |
| HIST-16-038 | HIST-16 | — | b | „Klucz autora B … Klucz: B" |
| HIST-17-037 | HIST-17 | — | b | „[FLAGA MERYTORYCZNA] Klucz B FAŁSZ" |
| HIST-17-038 | HIST-17 | — | a | „[FLAGA MERYTORYCZNA] Klucz A" |
| HIST-18-077 | HIST-18 | — | a | „[FLAGA MERYTORYCZNA] … Klucz A. Flaga: …" |
| HIST-19-038 | HIST-19 | — | d | „[Uwaga: klucz autora C skorygowano na D …]" |
| HIST-19-040 | HIST-19 | — | d | „[FLAGA MERYTORYCZNA: opcja C … anatomicznie nieprawdziwa …]" (klucz d=A,B nie obejmuje C) |
| HIST-19-047 | HIST-19 | — | e | „kontrast z Q346 e2023-2…" + „dowód krzyżowy…" |
| HIST-19-072 | HIST-19 | — | e | „[FLAGA MERYTORYCZNA] Klucz E — autor zaznaczył DO WERYFIKACJI" (klucz e poprawny) |
| HIST-19-078 | HIST-19 | — | a | „[FLAGA MERYTORYCZNA] Klucz A … co jest uproszczeniem" |
| HIST-19-079 | HIST-19 | — | a | „[FLAGA MERYTORYCZNA] Klucz A" |
| HIST-19-084 | HIST-19 | — | e | „[FLAGA MERYTORYCZNA] Klucz E" |
| HIST-19-085 | HIST-19 | — | d | „[FLAGA MERYTORYCZNA] Klucz autora wskazuje D (A+B) … Klucz D logiczny" |
| HIST-19-086 | HIST-19 | — | c | „[FLAGA MERYTORYCZNA] … Klucz autora C — poprawnie … „inhibina M" nieklasyczny → flaga" |
| HIST-19-089 | HIST-19 | — | c | „Klucz autora C (D–E rekonstruowane…)" |
| HIST-19-091 | HIST-19 | — | b | „[FLAGA MERYTORYCZNA] … Klucz B … Flaga: sformułowanie B trochę niejasne" |
| HIST-20-029 | HIST-20 | — | a | „[FLAGA MERYTORYCZNA] Klucz A … Autor przyjął A" |
| HIST-20-035 | HIST-20 | — | b | „[FLAGA MERYTORYCZNA] Klucz B" |
| HIST-20-038 | HIST-20 | — | a | „[FLAGA MERYTORYCZNA] Klucz A — powtórka Q596 e2019-1" |
| HIST-20-040 | HIST-20 | — | a | „Klucz autora A … Opcja C … byłaby do obrony … klucz A przyjęty" |
| HIST-20-041 | HIST-20 | — | e | „[FLAGA MERYTORYCZNA] … Klucz autora E … Klucz E zachowany" |
| HIST-20-044 | HIST-20 | — | d | „Klucz autora „DO WERYFIKACJI" … Przyjęto klucz D jako „najmniej błędny"" |
| HIST-21-011 | HIST-21 | — | a | „[FLAGA MERYTORYCZNA] Klucz autora A (rekonstrukcja opcji C–E) … Klucz A poprawnie" |
| HIST-22-041 | HIST-22 | — | d | „Klucz D FAŁSZ … (autor: „~6 tydz." nieprecyzyjne)" |
| HIST-22-042 | HIST-22 | — | a | „[FLAGA MERYTORYCZNA] Klucz A FAŁSZ" |
| HIST-22-043 | HIST-22 | — | d | „[FLAGA MERYTORYCZNA: klucz autora D — kontrowersyjny]" |
| mju-zal-142 | MJU-ZAL | e_mju_zal_2019 | c | trafienie na „niekompletne" (opis opcji D) — brak meta do wycięcia |
| mju-zal-184 | MJU-ZAL | e_mju_zal_2025 | c | „Flaga walidatorska: opcja A … dyskusyjna … Idziemy za kluczem 2025" |
| mju-zal-189 | MJU-ZAL | e_mju_zal_2025 | c | „Flaga walidatorska: opcja C ma typo źródłowy … konsultacja z Kasią" |
| mju-zal-199 | MJU-ZAL | e_mju_zal_2025 | b | „Flaga walidatorska: klucz źródłowy pisał „B. anthracis" — to BŁĄD … Poprawione na B. atrophaeus" |
| mju-zal-207 | MJU-ZAL | e_mju_zal_2024 | e | trafienie na „za wąskie/niekompletne" — brak meta istotnej do wycięcia |
| mju-zal-230 | MJU-ZAL | e_mju_zal_2024 | d | „Klucz 2024 = D zgodnie ze źródłem. Flaga walidatorska: …" |
| mju-zal-233 | MJU-ZAL | e_mju_zal_2024 | a | „Flaga walidatorska: opcja A jest dyskusyjna … Idziemy za kluczem 2024" |
| mju-zal-240 | MJU-ZAL | e_mju_zal_2024 | b | „Flaga źródłowa: oryginalny PDF zawiera odpowiedź C „majtów xd" jako żart autora — podmieniono…" |
| mju-zal-241 | MJU-ZAL | e_mju_zal_2024 | a | „Flaga walidatorska: To dyskusyjne …" |
| mju-zal-245 | MJU-ZAL | e_mju_zal_2024 | d | „Flaga źródłowa: PDF zawiera dopisek autora „jakoś tak" — pomijam" |
| zaklek-z2019-1-436 | ZAKAZ-06 | z2019-1 | a | „Uwaga: paciorkowce w oryginale błędnie określono „koagulazo-ujemnymi"" |
| zaklek-z2020-1-406 | ZAKAZ-12 | z2020-1 | a | trafienie na idiom „czerwona flaga" — brak meta do wycięcia |
| zaklek-mediclearn-639 | ZAKAZ-13 | mediclearn | c | trafienie na „nieprecyzyjne" (opis opcji A) — treść OK |

---

## PRIORYTET ❺ — [E] NIEPEWNE (10) — do ręcznej decyzji (bez zgadywania klucza)

| id | topic_id | batch_label | obecny_klucz | sugerowany_klucz | co zrobić | uzasadnienie |
|---|---|---|---|---|---|---|
| ana-kon-070 | ANA-KON | e_anat_2023/2 | b | ? | decyzja ręczna | „W jamie pachowej znajduje się:" — klucz `b` „otwór boczny promieniowy" to **granica**, nie zawartość jamy. Wątpliwy, ale taki jest klucz PDF. |
| ana-obw-065 | ANA-OBW | e_anat_2022/1 | a | ? (precyzyjnie: nn. trzewne miedniczne — brak w opcjach) | decyzja ręczna | Przywspółczulne narządów płciowych = nn. trzewne miedniczne (S2-S4); `a` (n. sromowy) to nerw somatyczny/mieszany — uproszczenie. *(is_active=false)* |
| ana-oun-069 | ANA-OUN | e_anat_2023/2 | a | ? (ew. „ma jedną blaszkę"/`c`) | decyzja ręczna / przeredagować pytanie | „Opona twarda **rdzenia**:" — klucz `a` „ma dwie blaszki" błędny (rdzeniowa = 1 blaszka; 2 ma mózgowa). Brak czystej poprawnej opcji → pułapka semantyczna. *(is_active=false)* |
| ana-trz-127 | ANA-TRZ | e_anat_2023/1 | b | ? (b oraz e poprawne) | decyzja ręczna | „Tętnice krzywizny większej" — poprawne **b i e** (t. żołądkowo-sieciowa lewa ORAZ tt. żołądkowe krótkie). Dwie poprawne opcje. |
| farm-13-004 | FARM-13 | e_farm_2025/1 | d | ? (merytorycznie c: 1,2) | decyzja ręczna | Reakcja disulfiramowa: metronidazol+cefoperazon (1,2) tak; amoksycylina (3) klasycznie **nie**. Klucz `d` (1,2,3) wątpliwy, ale część polskich podręczników ostrzega → niepewne. |
| HIST-04-004 | HIST-04 | — | a | ? (a lub c) | decyzja ręczna | „Który gruczoł heterokrynowy?" — `a` (potowy apokrynowy) i `c` (mlekowy) **oba poprawne**; „potowy" bez doprecyzowania niejednoznaczny. |
| HIST-11-022 | HIST-11 | — | a | ? (prawdopodobnie e) | decyzja ręczna | „Błona środkowa tętnicy NIE zawiera:" — media zawiera SMC okrężne, włókna sprężyste i kolagen → żadna z a/b/c nie jest „nieobecna" → poprawne raczej `e` „brak poprawnej". Klucz `a` wątpliwy. |
| HIST-18-073 | HIST-18 | — | e | ? (e po naprawie opcji C) | naprawić tekst opcji C, potem klucz `e` OK | „Część endokrynowa trzustki" — opcja C ma błąd źródłowy „glikogen" zamiast **glukagon**; przez to `e` „wszystko prawda" jest formalnie fałszywe do czasu poprawy opcji. |
| HIST-19-073 | HIST-19 | — | b | ? (klasycznie a: androgeny) | decyzja ręczna | Komórki śródmiąższowe zrębu jajnika produkują głównie **androgeny** (`a`), nie estrogeny (`b`). Autor zaznaczył „DO WERYFIKACJI". Konserwatywnie — bez zmiany klucza. |
| HIST-20-026 | HIST-20 | — | b | ? (b i c poprawne) | decyzja ręczna | „W skład soczewki NIE wchodzi:" — `b` (kolagen V) ORAZ `c` (fibroblasty) **oba** nieobecne w soczewce. Dwie poprawne odpowiedzi. |

---

## Podsumowanie liczbowe

### Per kategoria
| kategoria | liczba |
|---|---|
| [B] BŁĄD KLUCZA | 3 |
| [D] PYTANIE ZEPSUTE | 2 |
| [C] PUSTE WYJAŚNIENIE | 2 |
| [A] ADNOTACJA DO WYCIĘCIA | 129 |
| [E] NIEPEWNE | 10 |
| **RAZEM** | **146** |

### Per topic_id
| topic_id | razem | A | B | C | D | E |
|---|---|---|---|---|---|---|
| ANA-CZA | 2 | 2 | | | | |
| ANA-KON | 2 | 1 | | | | 1 |
| ANA-NAC | 2 | 2 | | | | |
| ANA-NER | 3 | 1 | 2 | | | |
| ANA-OBW | 3 | 2 | | | | 1 |
| ANA-OUN | 6 | 5 | | | | 1 |
| ANA-TRZ | 14 | 12 | | | 1 | 1 |
| ANA-TUL | 1 | 1 | | | | |
| ANA-ZAL | 1 | 1 | | | | |
| FARM-12 | 1 | 1 | | | | |
| FARM-13 | 1 | | | | | 1 |
| FARM-15 | 1 | 1 | | | | |
| HIST-01 | 1 | 1 | | | | |
| HIST-02 | 4 | 4 | | | | |
| HIST-03 | 11 | 11 | | | | |
| HIST-04 | 3 | 2 | | | | 1 |
| HIST-05 | 3 | 3 | | | | |
| HIST-07 | 1 | 1 | | | | |
| HIST-08 | 1 | 1 | | | | |
| HIST-09 | 4 | 4 | | | | |
| HIST-10 | 2 | 2 | | | | |
| HIST-11 | 7 | 6 | | | | 1 |
| HIST-12 | 7 | 7 | | | | |
| HIST-13 | 7 | 5 | 1 | | 1 | |
| HIST-14 | 4 | 4 | | | | |
| HIST-15 | 7 | 7 | | | | |
| HIST-16 | 6 | 5 | | 1 | | |
| HIST-17 | 2 | 2 | | | | |
| HIST-18 | 2 | 1 | | | | 1 |
| HIST-19 | 12 | 11 | | | | 1 |
| HIST-20 | 7 | 6 | | | | 1 |
| HIST-21 | 1 | 1 | | | | |
| HIST-22 | 3 | 3 | | | | |
| MJU-ZAL | 10 | 10 | | | | |
| ZAKAZ-06 | 1 | 1 | | | | |
| ZAKAZ-12 | 2 | 1 | | 1 | | |
| ZAKAZ-13 | 1 | 1 | | | | |
| **RAZEM** | **146** | **129** | **3** | **2** | **2** | **10** |

---

## Rekomendacja kolejności napraw (po Twojej akceptacji)
1. **[B] 3 pytania** — korekta klucza (ana-ner-029 → c, ana-ner-048 → b, HIST-13-027 → e). Uwaga: 2 anatomiczne są już `is_active=false`.
2. **[D] 2 pytania** — decyzja: deaktywacja vs. przeredagowanie (ana-trz-140, HIST-13-044).
3. **[C] 2 pytania** — dopisać wyjaśnienie (klucze poprawne).
4. **[E] 10 pytań** — ręczny przegląd; w 2 przypadkach (HIST-18-073, ana-oun-069) naprawa dotyczy treści opcji/pytania, nie klucza.
5. **[A] 129 pytań** — masowe wyczyszczenie adnotacji meta w `explanation` (klucze bez zmian). Można zautomatyzować regexem na znacznikach `[FLAGA MERYTORYCZNA]`, `DO WERYFIKACJI`, `Flaga walidatorska/źródłowa`, „Klucz/Autor klucza…", odwołania do `Q###`/batchy — po uprzednim review próbki.

**Nie wykonano żadnych zmian w bazie. Czekam na akceptację listy przed jakąkolwiek naprawą.**
