# Deduplikacja — batch `e_anat_sto_2025/1` (ANATSTO-357…408)

**Wygenerowano:** 2026-05-28 (Supabase live)  
**Batch:** 52 pytania · egzamin STOMA SUM 2025 · `source_code` = `ANATSTO-NNN`  
**Status importu:** **NIE wgrany** — zero wierszy z `ANATSTO-*` / `e_anat_sto_2025/1` w bazie.

---

## Werdykt (krótko)

| Obszar | Wynik |
|--------|--------|
| `source_code` ANATSTO | ✅ Brak kolizji — można bezpiecznie importować pod tym kodem |
| Duplikaty **wewnątrz batcha** | 🔴 **10 wierszy** to powtórki (52 → **~42 unikalne** tematy) |
| Duplikaty **vs istniejąca anatomia** | 🔴 **~28–32 wiersze** mają ten sam lub prawie ten sam stem co już aktywne `ana-*` |
| Sensowny import „na ślepo” | ❌ Dodałbyś **drugą kopię** wielu pytań z egzaminów 2022–2025 |
| Rekomendacja | Import tylko **unikalnych** (lista §4) albo `INSERT` z pominięciem stemów już w bazie |

---

## 1. Duplikaty wewnątrz batcha (ten sam `text`)

Egzamin STOMA zawiera **powtórzone pytania** — w SQL wylądą jako osobne `id` (`ana-*-*`), ale merytorycznie to duplikat.

| `source_code` A | `source_code` B | (C) | Stem |
|-----------------|-----------------|-----|------|
| ANATSTO-357 | ANATSTO-379 | | Początkowy przyczep krezki znajduje się: |
| ANATSTO-358 | ANATSTO-380 | | Tętnica łącząca tylna jest gałęzią: |
| ANATSTO-372 | ANATSTO-403 | | Droga korowo-rdzeniowa boczna zawiera: |
| ANATSTO-371 | ANATSTO-381 | ANATSTO-399 | Zatoki żylne mózgowia leżą między: |
| ANATSTO-375 | ANATSTO-405 | | Sierp mózgu: |
| ANATSTO-373 | ANATSTO-404 | | Guz popielaty jest elementem / jest częścią: (ten sam temat, inna formułka) |
| ANATSTO-385 | ANATSTO-408 | | Otwór / kanał sieciowy — od tyłu ogranicza ż. główną dolną (warianty jednego pytania) |

**Do importu z batcha (po dedup wewnętrznym):** z każdej grupy zostaw **1×** (np. niższy numer ANATSTO).

---

## 2. Już w bazie — identyczny stem (`text` = 1:1)

Poniżej: batch **vs** istniejące aktywne pytania. Kolumna **batch key** = `correct_option_id` z Twojego SQL.

| ANATSTO | Batch topic | Stem (skrót) | batch key | Już w bazie (`id`) | DB key | Uwagi |
|---------|-------------|--------------|-----------|-------------------|--------|--------|
| 358, 380 | NAC | Tętnica łącząca tylna jest gałęzią: | e | `ana-oun-006`, `ana-oun-024` | e, e | W batchu **NAC**, w bazie **OUN** (2× duplikat w bazie!) |
| 372, 403 | OUN | Droga korowo-rdzeniowa boczna zawiera: | a | `ana-oun-001` | a | |
| 371, 381, 399 | OUN | Zatoki żylne mózgowia leżą między: | e | `ana-oun-004`, `ana-oun-025` | e, e | |
| 407 | TRZ | Więzadło wątrobowo-dwunastnicze zawiera: | a | `ana-trz-008`, `ana-trz-063` | a, a | |
| 364 | KON | Mięsień trójgłowy ramienia działa… | e | `ana-kon-030` | e | |
| 393 | KON | Staw biodrowy to staw: | **e** | `ana-kon-011` | **d** | ⚠️ **Ten sam stem, inny klucz** |
| 359 | TRZ | We wnęce nerki w kolejności… | b | `ana-trz-013`, `ana-trz-067` | b, b | |
| 361 | TRZ | Najądrze znajduje się w: | e | `ana-trz-016` | (sprawdź) | |
| 362 | TRZ | Ciało gąbczaste otacza: | a | `ana-trz-017` | (sprawdź) | |
| 369 | NAC | Kąt żylny powstaje z połączenia: | c | `ana-nac-002`, `ana-nac-016` | c, c | |
| 363 | TRZ | Kolejne odcinki jajowodu… | d | `ana-trz-018`, `ana-trz-072` | d, d | |
| 368 | KON | Łuk dłoniowy głęboki powstaje z połączenia: | a | `ana-kon-003`, `ana-kon-038` | a, a | |
| 383 | OBW | Układ przywspółczulny składa się z części: | b | `ana-obw-007`, `ana-obw-026` | b, b | |
| 401 | OBW | Opadanie stopy… | d | `ana-obw-008`, `ana-obw-025` | d, d | |
| 366 | NAC | Tętnica podstawna powstaje z połączenia: | a | `ana-oun-037` | a | W batchu NAC, w bazie OUN |
| 387 | TUL | Węzeł przedsionkowo-komorowy leży w: | b | `ana-trz-065` (stem: „leży:”) | b | W batchu TUL, w bazie TRZ |
| 406 | OUN | Wzgórki górne blaszki pokrywy to: | a | `ana-oun-008`, `ana-oun-031` | a, a | |

**Szacunek:** **~19 stemów** z batcha ma już co najmniej jedną aktywną kopię w bazie (często 2+).

---

## 3. Już w bazie — bardzo podobne (inna formułka, ten sam temat)

| ANATSTO | Batch | Podobne w bazie | Uwaga |
|---------|-------|-----------------|-------|
| 373, 404 | Guz popielaty jest elementem / częścią | `ana-oun-002` — „Guz popielaty (tuber cinereum) **to element:**” | Prawie to samo |
| 375, 405 | Sierp mózgu: | `ana-oun-005` — „Sierp mózgu (falx cerebri) **tworzy:**” | Inne opcje / sformułowanie |
| 397 | Hipokamp należy do: | `ana-oun-003` — „Hipokamp:” | Ten sam temat |
| 376 | Jądra uzdeczki to elementy: | `ana-oun-032` — „Jądra uzdeczki **to elementy:**” | |
| 365 | Uszkodzenie nerwu → przywodzenie biodro | `ana-obw-001` — „Upośledzenie ruchu przywodzenia…” | |
| 382 | Nerw pachowy odchodzi **od** | `ana-obw-003`, `021` — odchodzi **z** | |
| 388 | Przez otwór okrągły przechodzi: | `ana-cza-021`, `025`, `036`, `ana-ner-009` | 4× w bazie |
| 389 | W dole zażuchwowym t. szyjna zewnętrzna… | `ana-nac-006` | |
| 390 | Przyczep końcowy m. skrzydłowego przyśrodkowego | `ana-mie-004` (inna końcówka stemu) | |
| 398 | Płaty boczne tarczycy przykryte są przez: | `ana-nac-003` — „…pokryte są przez:” | |
| 371–399 | Zatoki żylne… | + duplikaty w batchu | |
| 385, 408 | Otwór / kanał sieciowy | `ana-trz-009`, `ana-trz-064` (dłuższy stem z Winslowa) | |
| 386 | Ściana przyśrodkowa oczodołu… | `ana-oun-007`, `ana-oun-026` — rogu przedniego komory bocznej | |
| 395 | Zwój przedsionkowy leży w: | `ana-ner-003`, `ana-ner-020` | |
| 402 | Tętnica poprzeczna szyi odchodzi od: | `ana-nac-004`, `015` (inna formułka) | |
| 400 | Mięśnie prostujące… nerw promieniowy | (brak identycznego stemu) | Prawdopodobnie OK |
| 370 | Gdzie odpływa żyła odłokciowa | `ana-kon-001` — „Żyła odłokciowa uchodzi do:” | Inna formułka |

---

## 4. Prawdopodobnie NOWE (brak sensownego matcha w bazie)

Te **nie** znalazły się jako identyczny / oczywisty duplikat — warto importować **po** wycięciu §1 i §2:

| ANATSTO | topic | Stem (skrót) |
|---------|-------|--------------|
| 357, 379 | TRZ | Początkowy przyczep krezki… (**zostaw 1×**) |
| 360 | TRZ | Wnęka nerki leży na wysokości: (w bazie są podobne z **innym** zestawem opcji — `ana-trz-023`, `083`; **porównaj opcje**) |
| 367 | TUL | Łuk aorty rozpoczyna się: |
| 374 | OUN | Konar środkowy móżdżku łączy móżdżek z: |
| 384 | JAM | Ściana szyjno-żylna to: |
| 391, 392 | NAC | Trójkąt tętnicy językowej (Pirogowa) |
| 394 | KON | Wykonywanie jakich ruchów… staw łokciowy |
| 396 | NER | Nerw językowo-gardłowy opuszcza mózgowie w: |
| 377 | KON | Szczyt trójkąta udowego znajduje się w: (w bazie inne pytania *o* trójkącie, nie ten stem) |
| 378 | KON | Mięsień dłoniowy długi należy do: (w bazie: „należy do **grupy**”) |

**Realnie unikalnych po pełnym dedup:** rząd wielkości **15–22** z 52 (reszta = duplikat batcha lub bazy).

---

## 5. Konflikty klucza (stem jak w bazie, inna odpowiedź)

| Batch | DB | Problem |
|-------|-----|---------|
| ANATSTO-393 `Staw biodrowy` → **e** (kulisty panewkowy) | `ana-kon-011` → **d** (płaski) | Ten sam tytuł pytania, **różny klucz** — nie importuj drugiego bez decyzji redakcyjnej |

---

## 6. Błędy mapowania `topic_id` w batchu (nie duplikat, ale uwaga)

| Pytanie | Batch `topic_id` | Gdzie już leży podobna treść |
|---------|------------------|------------------------------|
| Tętnica łącząca tylna | **ANA-NAC** | **ANA-OUN** (`ana-oun-006`, `024`) |
| Tętnica podstawna | **ANA-NAC** | **ANA-OUN** (`ana-oun-037`) |
| Węzeł przedsionkowo-komorowy | **ANA-TUL** | **ANA-TRZ** (`ana-trz-065`) |

Kanon `anatomia` ma wspólne topiki — UI i tak zadziała, ale **katalog działów** będzie niespójny względem wcześniejszych importów.

---

## 7. Co zrobić przed `INSERT`

1. **Wycinij z SQL** wiersze z §1 (duplikaty wewnątrz batcha) — zostaw po 1 z pary/trójki.
2. **Wycinaj / pomiń** wiersze z §2 (stem już w bazie), chyba że chcesz **zastąpić** treść (wtedy `UPDATE`, nie drugi `INSERT`).
3. **Nie dodawaj** ANATSTO-393 bez rozstrzygnięcia z `ana-kon-011`.
4. Po imporcie uruchom sync liczników (Twój `UPDATE topics` jest OK).
5. Opcjonalnie: `source_code` zostaw `ANATSTO-*` — nie koliduje z `ANAT-e2025-*`.

### Szablon guard przed insertem (jeden stem)

```sql
-- Przykład: nie wstawiaj, jeśli stem już istnieje
SELECT id FROM questions
WHERE topic_id LIKE 'ANA-%' AND is_active
  AND text = 'Tętnica łącząca tylna jest gałęzią:';
-- jeśli zwróci wiersz → SKIP ten rekord z batcha
```

---

## 8. Powiązane

- `exports/anatomia-audyt-stan-2026.md` — pełny stan anatomii
- `AnatomiaAudyt-2026-05-18.md` — ~200+ duplikatów tematycznych już **w** obecnym banku (osobny problem od tego batcha)
