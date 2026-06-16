# Anatomia — audyt stanu bazy (STOMA + LEK)

**Wygenerowano:** 2026-05-28 (odczyt live z Supabase)  
**Cel:** jeden plik „gdzie stoimy” — struktura, topiki, ID, batche, migracja, backlog jakości.

**Powiązane pliki w repo:**

| Plik | Rola |
|------|------|
| `FormatPisaniaPytan.md` | Format `id`, `source_code`, `batch_label`, `theme_label` |
| `ClaudePrompt-TXT-na-SQL.md` | TXT → SQL (shared subjects) |
| `docs/KodyPrzedmiotow.md` | Kody przedmiotów — **nieaktualne: tylko 5 topików ANA** |
| `scripts/seed-content.sql` | Seed — **tylko 5 topików ANA** |
| `exports/anatomia-migration-audit.md` | Audyt przed migracją LEK→kanon (2026-05-28) |
| `exports/anatomia-migration-apply-log.json` | Log apply migracji |
| `AnatomiaAudyt-2026-05-18.md` | Audyt merytoryczny ~766 pytań (przed merge) |
| `scripts/migrate-anatomia-apply.mjs` | Migracja danych |
| `scripts/audit-anatomia-migration.mjs` | Ponowny audyt migracji |

---

## 1. Podsumowanie (TL;DR)

| Metryka | Wartość |
|---------|---------|
| Przedmiot kanoniczny | `anatomia` (`track=shared`, rok 1) |
| Powłoki UI | `stoma-anatomia`, `lek-anatomia` |
| Topików `ANA-*` | **10** |
| Pytania aktywne | **659** |
| Pytania nieaktywne | **12** |
| Razem rekordów `ana-*` | **671** |
| `lek-ana-*` / `LEK-ANA-*` po migracji | **0** |
| `questions.tracks` / `topics.tracks` | **NULL** (oba kierunki) |
| Ostatni batch | **`e_anat_2025/2`** |
| Ostatni `source_code` | **`ANAT-e2025-2-195`** (`ana-obw-020`) |
| Kolejny batch (propozycja) | `e_anat_2026/1`, `source_code` od `ANAT-e2026-1-001` |

**Werdykt:** treść wgrana do końca egzaminów **2025/2**; struktura kanoniczna **zrobiona**; dokumentacja seed/KodyPrzedmiotów **nie odzwierciedla 10 działów**; deduplikacja i poprawki z audytu merytorycznego **otwarte**.

---

## 2. Architektura w bazie

```
subjects (UI)          subjects (kanon)        topics              questions
─────────────────      ────────────────        ──────────          ─────────────
stoma-anatomia  ──┐
                  ├──►  anatomia (shared)  ──►  ANA-CZA … ANA-TRZ  ──►  ana-cza-001 …
lek-anatomia    ──┘
```

- **INSERT** nowych pytań: `subject_id` w topiku = **`anatomia`** (nie `stoma-anatomia`).
- **Sesja / katalog:** `expandTopicSubjectIdsForCatalog` dociąga `anatomia` z powłoki `stoma-anatomia` / `lek-anatomia`.
- **Widoczność:** brak `tracks` na pytaniach i topikach → STOMA i LEK widzą ten sam bank (w przeciwieństwie do histologii STOMA-only).

**Osobny przedmiot (nie ten audyt):** `stoma-narzad-zucia` (rok 2) — „Anatomia i Fizjologia Narządu Żucia”, bez prefiksu `ANA-*`.

---

## 3. Migracja LEK → kanon (2026-05-28)

Źródło: `exports/anatomia-migration-apply-log.json` (`mode: apply`).

| Krok | Wynik |
|------|--------|
| Pary `ana-*` ↔ `lek-ana-*` przed merge | 95 |
| Usunięte pytania `lek-ana-*` | 95 |
| Usunięte topiki `LEK-ANA-*` | 10 |
| Pytania na topikach `ANA-*` po merge | 671 |
| `lek-ana-*` pozostałe (stan dziś) | **0** |

**Stan dziś (weryfikacja SQL):**

```sql
SELECT COUNT(*) FROM topics WHERE id LIKE 'LEK-ANA-%';      -- 0
SELECT COUNT(*) FROM questions WHERE id LIKE 'lek-ana-%';   -- 0
```

---

## 4. Topiki — pełna tabela

| `topic_id` | Nazwa | `display_order` | Aktywne | Nieakt. | `cached_cnt` | Max seq `id` | Nast. wolne `id` | Ostatni batch | Zakres `source_code` (aktywne) |
|------------|-------|----------------:|--------:|--------:|-------------:|-------------:|------------------|---------------|-------------------------------|
| `ANA-CZA` | Czaszka i kości twarzoczaszki | 1 | 41 | 1 | 41 | 42 | `ana-cza-043` | `e_anat_2025/2` | e2022-1-601 … e2025-2-189 |
| `ANA-MIE` | Mięśnie żucia i mimiczne | 2 | 21 | 0 | 21 | 21 | `ana-mie-022` | `e_anat_2025/2` | e2022-1-580 … e2025-2-173 |
| `ANA-NAC` | Naczynia głowy i szyi | 3 | 41 | 1 | 41 | 42 | `ana-nac-043` | `e_anat_2025/2` | e2022-1-627 … e2025-2-190 |
| `ANA-NER` | Nerwy czaszkowe | 4 | 45 | 3 | 45 | 48 | `ana-ner-049` | `e_anat_2025/2` | e2022-1-602 … e2025-2-192 |
| `ANA-JAM` | Jama ustna i jej struktury | 5 | 11 | 0 | 11 | 11 | `ana-jam-012` | `e_anat_2025/1` | e2022-1-630 … e2025-1-009 |
| `ANA-OUN` | Ośrodkowy układ nerwowy | 6 | 83 | 2 | 83 | 85 | `ana-oun-086` | `e_anat_2025/2` | e2022-1-576 … e2025-2-182 |
| `ANA-OBW` | Nerwy obwodowe i sploty | 7 | 65 | 2 | 65 | 67 | `ana-obw-068` | `e_anat_2025/2` | e2022-1-577 … **e2025-2-195** |
| `ANA-KON` | Anatomia kończyn | 8 | 90 | 0 | 90 | 90 | `ana-kon-091` | `e_anat_2025/2` | e2022-1-575 … e2025-2-194 |
| `ANA-TUL` | Anatomia tułowia | 9 | 50 | 0 | 50 | 50 | `ana-tul-051` | `e_anat_2025/2` | e2022-1-573 … e2025-2-191 |
| `ANA-TRZ` | Trzewia (serce, płuca, jelita, UP) | 10 | 212 | 3 | 212 | 215 | `ana-trz-216` | `e_anat_2025/2` | e2022-1-574 … e2025-2-193 |
| **Σ** | | | **659** | **12** | **659** | | | | |

Uwagi:

- **Luki w numeracji `id`** (np. NER ma seq do 48, aktywnych 45) — normalne po dezaktywacji / lukach w imporcie.
- **`cached_cnt`** = `topics.question_count` — zgodne z liczbą aktywnych (sync po migracji OK).
- Największy dział: **ANA-TRZ** (32% wszystkich aktywnych pytań anatomii).

---

## 5. Batche (`batch_label`)

| `batch_label` | Aktywne | Nieakt. | Min `source_code` | Max `source_code` |
|---------------|--------:|--------:|-------------------|-------------------|
| `e_anat_2022/1` | 96 | 3 | `ANAT-e2022-1-573` | `ANAT-e2022-1-671` |
| `e_anat_2023/1` | 87 | 6 | `ANAT-e2023-1-386` | `ANAT-e2023-1-478` |
| `e_anat_2023/2` | 92 | 2 | `ANAT-e2023-2-479` | `ANAT-e2023-2-572` |
| `e_anat_2024/1` | 92 | 1 | `ANAT-e2024-1-196` | `ANAT-e2024-1-288` |
| `e_anat_2024/2` | 97 | 0 | `ANAT-e2024-2-289` | `ANAT-e2024-2-385` |
| `e_anat_2025/1` | 95 | 0 | `ANAT-e2025-1-001` | `ANAT-e2025-1-095` |
| **`e_anat_2025/2`** | **100** | **0** | `ANAT-e2025-2-096` | **`ANAT-e2025-2-195`** |

**Globalny zakres `source_code` (wszystkie ANA, aktywne):** `ANAT-e2022-1-573` … `ANAT-e2025-2-195`.

**Przykłady „ostatnich” rekordów w batchu 2025/2:**

| `id` | `topic_id` | `source_code` |
|------|------------|---------------|
| `ana-obw-020` | `ANA-OBW` | `ANAT-e2025-2-195` ← **najwyższy numer egzaminu w bazie** |
| `ana-trz-060` | `ANA-TRZ` | `ANAT-e2025-2-193` |
| `ana-tul-006` | `ANA-TUL` | `ANAT-e2025-1-095` ← koniec batcha 2025/1 |

---

## 6. Kolejny import — METADANE (szablon)

```
METADANE BATCHA
subject_id: anatomia
topic_id: ANA-TRZ                    ← przykład; wybierz dział
tracks:                              ← puste = oba kierunki (domyślnie)
question_id_prefix: ana-trz
start_question_number: 216          ← z tabeli §4 (max seq + 1)
batch_label: e_anat_2026/1
source_code_start: ANAT-e2026-1-001
```

Zasady (`FormatPisaniaPytan.md`):

- `id`: `{prefix}-{NNN}` małe litery, np. `ana-trz-216`.
- `topic_id` w `INSERT`: kolumna FK = kod WIELKIMI (`ANA-TRZ`).
- `theme_label`: lista 12 etykiet układów/topografii (patrz FormatPisaniaPytan §3.1).
- **Nie** używać `subject_id = 'stoma-anatomia'` w `INSERT INTO topics`.

---

## 7. Pytania nieaktywne (`is_active = false`)

| `id` | `topic_id` | `source_code` | `batch_label` | Uwaga z audytu 2026-05-18 |
|------|------------|---------------|---------------|---------------------------|
| `ana-cza-037` | `ANA-CZA` | `ANAT-e2023-2-548` | `e_anat_2023/2` | — |
| `ana-nac-021` | `ANA-NAC` | `ANAT-e2023-1-387` | `e_anat_2023/1` | — |
| `ana-ner-029` | `ANA-NER` | `ANAT-e2023-1-414` | `e_anat_2023/1` | 🔴 błąd klucza — audyt sugeruje `correct_option_id = 'c'` |
| `ana-ner-047` | `ANA-NER` | `ANAT-e2022-1-654` | `e_anat_2022/1` | — |
| `ana-ner-048` | `ANA-NER` | `ANAT-e2022-1-664` | `e_anat_2022/1` | 🔴 błąd klucza — audyt sugeruje `correct_option_id = 'b'` |
| `ana-obw-038` | `ANA-OBW` | `ANAT-e2023-1-424` | `e_anat_2023/1` | — |
| `ana-obw-065` | `ANA-OBW` | `ANAT-e2022-1-647` | `e_anat_2022/1` | — |
| `ana-oun-055` | `ANA-OUN` | `ANAT-e2023-1-434` | `e_anat_2023/1` | — |
| `ana-oun-069` | `ANA-OUN` | `ANAT-e2023-2-561` | `e_anat_2023/2` | — |
| `ana-trz-069` | `ANA-TRZ` | `ANAT-e2024-1-265` | `e_anat_2024/1` | — |
| `ana-trz-140` | `ANA-TRZ` | `ANAT-e2023-1-421` | `e_anat_2023/1` | audyt: sugerowana dezaktywacja (duplikat) |
| `ana-trz-144` | `ANA-TRZ` | `ANAT-e2023-1-445` | `e_anat_2023/1` | — |

Tylko **3** z 12 mają jednoznaczną notatkę w audycie merytorycznym; reszta — do weryfikacji przy deduplikacji.

---

## 8. Backlog jakości (audyt merytoryczny 2026-05-18)

Źródło: `AnatomiaAudyt-2026-05-18.md` (766 pytań przed merge; dziś 671 rekordów, 659 aktywnych).

### Bilans (szacunek z audytu)

| Kategoria | ~Liczba | % |
|-----------|--------:|---:|
| Poprawne, bezsporne | ~520 | 68% |
| Duplikaty tematyczne | ~200+ | 26% |
| Niejednoznaczności | ~30 | 4% |
| Błędy klucza | 6 | 0,8% |
| Niespójności kluczy (grupy) | 3 | ~2% |

### Priorytety strukturalne

1. **Deduplikacja** — największy zysk: `ANA-OUN` (85 → ~30 unikalnych), `ANA-TRZ` (215 → ~140 unikalnych); duplikaty w `ANA-CZA`, `ANA-KON`, `ANA-JAM`.
2. **Poprawki kluczy** — m.in. `ana-cza-035`, `ana-obw-002`, `ana-trz-109` (lista SQL w audycie; część ID `lek-ana-*` już nie istnieje — mapować na `ana-*`).
3. **Ujednolicenie terminologii** — powięź nasienna, torebka nerki, opona twarda (spory w wyjaśnieniach).
4. **Rewizja pytań z wątpliwościami w explanation** (~30).

### Stan deduplikacji

Audyt rekomendował masowe `is_active = false` dla duplikatów. **W bazie nadal 659 aktywnych** — deduplikacja **nie została przeprowadzona** (poza 12 ręcznie wyłączonymi).

---

## 9. Rozjazd dokumentacji w repo

| Źródło | Topiki ANA w dokumencie | W bazie |
|--------|-------------------------|--------|
| `scripts/seed-content.sql` | 5 (CZA, MIE, NAC, NER, JAM) | 10 |
| `docs/KodyPrzedmiotow.md` | 5 | 10 |
| `FormatPisaniaPytan.md` §2 | 5 | 10 |

**Brakujące w seed/docs (są w bazie od importów 2022–2025):**

- `ANA-OUN` — Ośrodkowy układ nerwowy  
- `ANA-OBW` — Nerwy obwodowe i sploty  
- `ANA-KON` — Anatomia kończyn  
- `ANA-TUL` — Anatomia tułowia  
- `ANA-TRZ` — Trzewia  

**TODO repo:** zaktualizować `KodyPrzedmiotow.md`, `seed-content.sql` (opcjonalnie), `FormatPisaniaPytan.md` §2.

---

## 10. Zapytania SQL do powtórzenia audytu

```sql
-- Topiki + liczniki
SELECT t.id, t.name, t.question_count,
       COUNT(*) FILTER (WHERE q.is_active) AS active,
       COUNT(*) FILTER (WHERE NOT q.is_active) AS inactive
FROM topics t
LEFT JOIN questions q ON q.topic_id = t.id
WHERE t.subject_id = 'anatomia'
GROUP BY t.id, t.name, t.question_count
ORDER BY t.display_order;

-- Batche
SELECT batch_label,
       COUNT(*) FILTER (WHERE is_active) AS active,
       MIN(source_code), MAX(source_code)
FROM questions
WHERE topic_id LIKE 'ANA-%'
GROUP BY batch_label
ORDER BY batch_label;

-- Legacy LEK
SELECT COUNT(*) FROM questions WHERE id LIKE 'lek-ana-%';
```

---

## 11. Changelog tego pliku

| Data | Opis |
|------|------|
| 2026-05-28 | Pierwszy eksport stanu po migracji kanon + weryfikacja live Supabase |
