# Format pytań — Socjologia medycyny (1 rok stomatologii)

> Companion do `FormatPisaniaPytan.md`. Sekcje 1, 2 (struktura `questions`), 4 (template SQL), 5 (checklista), 6 (zasady merytoryczne / opcje kombinatoryczne) z głównego docu obowiązują **bez zmian**. Ten plik definiuje wyłącznie tematy/etykiety specyficzne dla `stoma-socjologia` oraz konwencje batchowania.

---

## 1. SUBJECT

| Pole              | Wartość                                                   |
|-------------------|-----------------------------------------------------------|
| `subjects.id`     | `stoma-socjologia`                                        |
| `name`            | Socjologia medycyny                                       |
| `short_name`      | Socjologia                                                |
| `icon_name`       | `users`                                                   |
| `year`            | `1`                                                       |
| `track`           | `stomatologia`                                            |
| `product`         | `knnp`                                                    |
| `display_order`   | `7`                                                       |

Rekord wstawiony migracją `scripts/2026-05-17-add-socjologia-medycyny-stoma-y1.sql`.

---

## 2. TOPIKI (istnieją w bazie, `question_count = 0`)

| `topic_id` | Nazwa                                                                       | `display_order` |
|------------|-----------------------------------------------------------------------------|-----------------|
| `SOC-WPR`  | Wprowadzenie do socjologii medycyny                                         | 1               |
| `SOC-ZDR`  | Zdrowie i choroba jako kategorie społeczne                                  | 2               |
| `SOC-ROL`  | Role społeczne lekarza i pacjenta                                           | 3               |
| `SOC-KOM`  | Komunikacja lekarz–pacjent                                                  | 4               |
| `SOC-ZAW`  | Profesja lekarska i instytucje opieki zdrowotnej                            | 5               |
| `SOC-DET`  | Społeczne determinanty zdrowia                                              | 6               |
| `SOC-NIE`  | Nierówności w zdrowiu i dostęp do opieki                                    | 7               |
| `SOC-ETK`  | Etyka, bioetyka i prawa pacjenta                                            | 8               |
| `SOC-PRZ`  | Choroba przewlekła, niepełnosprawność, stygmatyzacja                        | 9               |
| `SOC-UMI`  | Umieranie, śmierć i opieka paliatywna                                       | 10              |
| `SOC-STM`  | Stomatologia społeczna (lęk, dostęp, komunikacja w gabinecie)               | 11              |

### Konwencja `id` pytania

`soc-{topic-suffix}-{NNN}`, np. `soc-wpr-001`, `soc-kom-014`. Małe litery, numeracja trzycyfrowa z zerami wiodącymi (jak Anatomia).

---

## 3. `theme_label` — kontrolowana lista dla `stoma-socjologia`

Wpisuj **dokładnie** taki ciąg jak na liście (case-sensitive, polskie znaki). Jeden `theme_label` na pytanie. Jeśli treść jest na granicy lub nie pasuje do żadnej etykiety → `NULL`.

```
1.  Pojęcia podstawowe socjologii medycyny
2.  Zdrowie i choroba jako konstrukty społeczne
3.  Role społeczne w medycynie
4.  Komunikacja i relacja terapeutyczna
5.  Profesja i instytucje medyczne
6.  Społeczne determinanty zdrowia
7.  Nierówności w zdrowiu
8.  Etyka, bioetyka, prawa pacjenta
9.  Niepełnosprawność i stygmatyzacja
10. Choroba przewlekła i opieka długoterminowa
11. Umieranie, śmierć i żałoba
12. Stomatologia społeczna
```

### Mapowanie pomocnicze (topic → najczęstszy `theme_label`)

| `topic_id` | Domyślnie idzie do `theme_label`                                                                                                            |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `SOC-WPR`  | `Pojęcia podstawowe socjologii medycyny`                                                                                                    |
| `SOC-ZDR`  | `Zdrowie i choroba jako konstrukty społeczne`                                                                                               |
| `SOC-ROL`  | `Role społeczne w medycynie`                                                                                                                |
| `SOC-KOM`  | `Komunikacja i relacja terapeutyczna`                                                                                                       |
| `SOC-ZAW`  | `Profesja i instytucje medyczne`                                                                                                            |
| `SOC-DET`  | `Społeczne determinanty zdrowia`                                                                                                            |
| `SOC-NIE`  | `Nierówności w zdrowiu`                                                                                                                     |
| `SOC-ETK`  | `Etyka, bioetyka, prawa pacjenta`                                                                                                           |
| `SOC-PRZ`  | `Niepełnosprawność i stygmatyzacja` lub `Choroba przewlekła i opieka długoterminowa` (zależnie od tego, na czym ogniskuje się pytanie)      |
| `SOC-UMI`  | `Umieranie, śmierć i żałoba`                                                                                                                |
| `SOC-STM`  | `Stomatologia społeczna`                                                                                                                    |

> Reguła rozstrzygająca: jeśli pytanie testuje **definicję / pojęcie** → wybierz etykietę najściślej pasującą do pojęcia. Jeśli testuje **kontekst praktyczny w gabinecie stomatologicznym** → `Stomatologia społeczna`.

---

## 4. `subtheme_label` — wąski podtemat (wolny tekst)

Krótka fraza rzeczownikowa (1–4 słowa), zaczynająca się z **wielkiej litery**. **Węższa** niż `topic_id`. Jeśli już użyłeś frazy w batchu, trzymaj się jej dalej (case-sensitive).

### Przykłady

| `topic_id` | `subtheme_label`                                                                                                            |
|------------|-----------------------------------------------------------------------------------------------------------------------------|
| `SOC-WPR`  | `Definicja przedmiotu`, `Metody badawcze`, `Socjologia ogólna a medyczna`, `Paradygmaty teoretyczne`                        |
| `SOC-ZDR`  | `Definicja WHO`, `Model biomedyczny`, `Model biopsychospołeczny`, `Choroba a chorowanie`, `Salutogeneza`                    |
| `SOC-ROL`  | `Rola chorego (Parsons)`, `Rola lekarza`, `Paternalizm`, `Model partnerski`, `Compliance i adherence`                       |
| `SOC-KOM`  | `Wywiad lekarski`, `Komunikacja niewerbalna`, `Przekazywanie złych wiadomości`, `Świadoma zgoda`, `Model SPIKES`            |
| `SOC-ZAW`  | `Profesjonalizacja`, `Kodeks etyki lekarskiej`, `NFZ i prywatna opieka`, `Hierarchia w szpitalu`, `Korporacjonizm`          |
| `SOC-DET`  | `Status socjoekonomiczny`, `Wykształcenie a zdrowie`, `Środowisko pracy`, `Sieci wsparcia`, `Determinanty kulturowe`        |
| `SOC-NIE`  | `Gradient społeczny zdrowia`, `Black Report`, `Marmot`, `Dostęp do opieki`, `Bariery finansowe`                             |
| `SOC-ETK`  | `Autonomia pacjenta`, `Świadoma zgoda`, `Tajemnica lekarska`, `Komitet bioetyczny`, `Konflikt interesów`                    |
| `SOC-PRZ`  | `Stygma Goffmana`, `Tożsamość zepsuta`, `Wykluczenie społeczne`, `Modele niepełnosprawności`                                |
| `SOC-UMI`  | `Etapy umierania (Kübler-Ross)`, `Hospicjum`, `Opieka paliatywna`, `Eutanazja`, `DNR`, `Żałoba`                              |
| `SOC-STM`  | `Lęk dentystyczny`, `Skala Corah`, `Komunikacja z dzieckiem`, `Wstyd o uzębienie`, `Bariera kosztowa stomatologii`          |

---

## 5. `batch_label` — etykieta zestawu

Format: `e_smed_<rok>/<termin>`, np. `e_smed_2025/1`, `e_smed_2024/2`, `e_smed_kol1`, `NULL`.

Małe litery, podkreślnik, slash przed numerem terminu. Cały batch importu wpisuje **jedną** wartość `batch_label`. Brak (`NULL`) = pytanie autorskie, w UI „Wszystkie".

---

## 6. `learning_outcome` (opcjonalne)

Dla socjologii w polskim curriculum najczęściej kody z grupy `F` (np. `F.W1`, `F.W12`, `F.U3` — wiedza / umiejętności społeczne). Wpisuj jeśli jest znany; w przeciwnym razie `NULL`.

---

## 7. SZABLON SQL — BATCH PYTAŃ (kopiuj-wklej do Supabase SQL Editor)

```sql
-- ============================================================
-- BATCH: e_smed_2025/1  ·  stoma-socjologia
-- Author: <bot>            Date: 2026-05-17
-- Topic:  SOC-KOM (Komunikacja lekarz–pacjent)
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   theme_label, subtheme_label, batch_label)
VALUES

('soc-kom-001', 'SOC-KOM',
 'Model komunikacji SPIKES służy przede wszystkim do:',
 '[
   {"id":"a","text":"Diagnostyki różnicowej bólu w klatce piersiowej"},
   {"id":"b","text":"Przekazywania pacjentowi złych wiadomości w sposób uporządkowany"},
   {"id":"c","text":"Oceny ryzyka samobójczego u pacjenta z depresją"},
   {"id":"d","text":"Wywiadu zawodowego u kandydatów do pracy"},
   {"id":"e","text":"Strukturyzacji konsultacji telefonicznych w POZ"}
 ]'::jsonb,
 'b',
 'Akronim SPIKES (Setting, Perception, Invitation, Knowledge, Emotions, Strategy/Summary) został zaproponowany przez Buckmana i Baile''a jako sześcioetapowy model przekazywania pacjentowi złych wiadomości (np. rozpoznania choroby nowotworowej). Krok S to przygotowanie warunków rozmowy, P — ustalenie co pacjent już wie, I — sprawdzenie ile chce wiedzieć, K — komunikat główny, E — reakcja na emocje, S — plan dalszego postępowania.',
 'Komunikacja i relacja terapeutyczna',
 'Model SPIKES',
 'e_smed_2025/1'),

('soc-kom-002', 'SOC-KOM',
 'Świadoma zgoda pacjenta na zabieg stomatologiczny wymaga, aby pacjent:',
 '[
   {"id":"a","text":"Podpisał formularz przed konsultacją"},
   {"id":"b","text":"Otrzymał informację o naturze zabiegu, ryzyku, alternatywach i prognozie, oraz wyraził zgodę dobrowolnie i kompetentnie"},
   {"id":"c","text":"Wykazał się rozumieniem łacińskich nazw procedur"},
   {"id":"d","text":"Zgodził się ustnie w obecności asystentki"},
   {"id":"e","text":"Prawidłowe A i D"}
 ]'::jsonb,
 'b',
 'Świadoma zgoda (informed consent) opiera się na czterech warunkach: (1) dobrowolność (brak przymusu), (2) kompetencja decyzyjna pacjenta (rozumienie sytuacji), (3) ujawnienie istotnych informacji przez lekarza (rodzaj zabiegu, ryzyko, alternatywy, prognoza bez interwencji), (4) wyraźne wyrażenie zgody. Sama podpisana karta nie wystarcza, jeśli pacjent nie rozumiał lub był pod przymusem.',
 'Komunikacja i relacja terapeutyczna',
 'Świadoma zgoda',
 'e_smed_2025/1');

-- ============================================================
-- PO WSZYSTKICH INSERTACH — przelicz licznik na topiku
-- ============================================================

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'SOC-KOM'
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

> **KRYTYCZNE:** ostatni `INSERT` w sekcji `VALUES` ma **kropkę i średnik na końcu**, a NIE przecinek.

---

## 8. CHECKLISTA PRZED `RUN` (przypomnienie)

- [ ] Każde `id` pytania jest unikalne i pasuje do `soc-{topic}-{NNN}`.
- [ ] `topic_id` istnieje (SOC-WPR / SOC-ZDR / SOC-ROL / SOC-KOM / SOC-ZAW / SOC-DET / SOC-NIE / SOC-ETK / SOC-PRZ / SOC-UMI / SOC-STM).
- [ ] `options` to JSONB w kolejności `a → b → c → d → e` (zob. § 6.1 głównego docu).
- [ ] `correct_option_id` matchuje jedno z `id` w `options`.
- [ ] Apostrofy w `text`/`explanation` są **podwojone** (`it''s`, nie `it's`).
- [ ] `theme_label` (jeśli wpisany) jest **dokładnie** z listy § 3.
- [ ] `subtheme_label` jest węższy niż `topic_id`.
- [ ] `batch_label` w formacie `e_smed_<rok>/<termin>` albo `NULL`.
- [ ] Ostatni rekord w `VALUES` zakończony `);`.
- [ ] UPDATE na `topics.question_count` po batchu — bez tego karta przedmiotu pokaże zły licznik.

---

## 9. STAN OBECNY W BAZIE

`stoma-socjologia` jest aktywny (`topic_count = 11`), ale `question_count = 0` w każdym topiku — karta na `/przedmioty` renderuje się jako aktywna z `0%` Mistrzostwa, a próba uruchomienia sesji bez pytań zwróci „Brak pytań dla tego przedmiotu". Po pierwszym batchu pytań + UPDATE liczników wszystko zaskoczy bez deploya.
