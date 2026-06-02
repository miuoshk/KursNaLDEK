# Import pytań po histologii — tylko stomatologia (rok 1)

> Companion do `FormatPisaniaPytan.md`. Dotyczy batchy wgrywanych **po zakończeniu histologii** w programie stomatologii rok 1.

---

## 1. Gdzie są dane (stan na dziś)

| Kolejność w programie | `subjects.id` (UI) | Gdzie trzymać treść | W bazie |
|----------------------|--------------------|---------------------|---------|
| Histologia | `stoma-histologia` | **`histologia`** (shared) | 22 działy `HIST-01`…`HIST-22`, ~854 pytań |
| Biofizyka | `stoma-biofizyka` | **`biofizyka`** (shared) | 11 działów `BIOF-*`, ~713 pytań |
| Biologia | `stoma-biologia` | `stoma-biologia` | **brak topików** |
| Chemia | `stoma-chemia` | `stoma-chemia` | **brak topików** |
| Socjologia | `stoma-socjologia` | `stoma-socjologia` | `SOC-OG` (+ nowe `SOC-*`) |

**W repo nie ma gotowych plików SQL/JSON z nowymi batchami** — tylko wzorce (`FormatPisaniaPytan-Socjologia.md`, ten plik). Istniejącą treść histologii/biofizyki pobierzesz z Supabase skryptem `scripts/export-topic-questions.mjs`.

Eksport przykładowy (już w repo): `exports/histologia-HIST-01-sample.json`.

---

## 2. Jak zrobić batch **tylko dla stomatologii**

Kolumna `topics.tracks` (`TEXT[]`):

- `NULL` lub `{}` → dział widoczny na **stomatologii i lekarskim** (domyślnie).
- `ARRAY['stomatologia']` → **tylko stomatologia** (`stoma-histologia`, `stoma-biofizyka`, …).
- `ARRAY['lekarski']` → tylko lekarski (wzór: `FARM-19` w farmakologii).

### Nowy dział (np. `HIST-23`, `BIOF-C5`, `BIO-01`)

```sql
INSERT INTO public.topics
  (id, subject_id, name, display_order, question_count, tracks)
VALUES
  (
    'HIST-23',
    'histologia',                    -- kanon, NIE stoma-histologia
    'Nazwa działu ze źródła',
    23,
    0,
    ARRAY['stomatologia']::TEXT[]   -- tylko STOMA
  )
ON CONFLICT (id) DO UPDATE SET
  subject_id    = EXCLUDED.subject_id,
  name          = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  tracks        = EXCLUDED.tracks;
```

### Przedmiot wyłącznie stomatologiczny (biologia, chemia, socjologia)

`subject_id` = `stoma-biologia` / `stoma-chemia` / `stoma-socjologia` — **bez** `tracks` (lekarski i tak nie ma tego przedmiotu w menu).

Wzór pełnego batcha socjologii: **`FormatPisaniaPytan-Socjologia.md`**.

---

## 3. Histologia — działy w kanonie (`subject_id = histologia`)

| `topic_id` | `display_order` | Nazwa | Uwaga STOMA-only |
|------------|-----------------|-------|------------------|
| `HIST-01` | 1 | Metody badawcze | wspólne |
| `HIST-02` | 2 | Cytoplazma | wspólne |
| `HIST-03` | 3 | Jądro komórkowe | wspólne |
| `HIST-04` | 4 | Tkanka nabłonkowa | wspólne |
| `HIST-05` | 5 | Tkanka łączna | wspólne |
| `HIST-06` | 6 | Tkanka tłuszczowa | wspólne |
| `HIST-07` | 7 | Chrząstka | wspólne |
| `HIST-08` | 8 | Kości | wspólne |
| `HIST-09` | 9 | Tkanka nerwowa i układ nerwowy | wspólne |
| `HIST-10` | 10 | Tkanka mięśniowa | wspólne |
| `HIST-11` | 11 | Układ krążenia | wspólne |
| `HIST-12` | 12 | Krew i hemopoeza | wspólne |
| `HIST-13` | 13 | Układ odpornościowy i narządy limfatyczne | wspólne |
| `HIST-14` | 14 | Układ pokarmowy | wspólne |
| `HIST-15` | 15 | Układ oddechowy | wspólne |
| `HIST-16` | 16 | Skóra | wspólne |
| `HIST-17` | 17 | Układ moczowy | wspólne |
| `HIST-18` | 18 | Gruczoły wewnątrzwydzielnicze | wspólne |
| `HIST-19` | 19 | Układ rozrodczy | wspólne |
| `HIST-20` | 20 | Oko i ucho — specjalne narządy zmysłów | wspólne |
| `HIST-21` | 21 | Rozwój zęba | **`tracks = stomatologia`** (już w bazie) |
| `HIST-22` | 22 | Embriologia ogólna i embriogeneza narządów | wspólne (chyba że batch tylko STOMA) |

### `questions.tracks` (histologia — batche tylko STOMA)

Nowe pytania w **istniejących** działach `HIST-01`…`HIST-22` (topik `tracks` NULL), ale **tylko dla stomatologii**:

```sql
tracks = ARRAY['stomatologia']::TEXT[]
```

- `tracks = NULL` na pytaniu → widoczne na STOMA i LEK (stare LDEK).
- Ten sam `topic_id` (np. `HIST-14`) — bez osobnego działu `-S`.
- Wymaga migracji `scripts/2026-05-28-questions-tracks.sql` + deploy kodu filtrującego.

### `questions.id` (histologia)

`HIST-{NN}-{NNN}` — np. `HIST-09-001` (prefiks z numerem działu w ID).

```sql
-- Kolejne ID w dziale:
SELECT id FROM public.questions WHERE topic_id = 'HIST-14' ORDER BY id DESC LIMIT 1;
```

---

## 4. Biofizyka — następny przedmiot po histologii (shared)

| `topic_id` | Nazwa |
|------------|-------|
| `BIOF-C1` | Biospektroskopia |
| `BIOF-C2` | Optyka cieczy (refrakcja, polaryzacja) |
| `BIOF-C3` | Bioreologia (lepkość, wiskozymetria) |
| `BIOF-C4` | Biomechanika (sprężystość, dźwignie) |
| `BIOF-S1` | Promieniowanie jonizujące, dozymetria |
| `BIOF-S2` | Promieniowanie niejonizujące, lasery, RTG |
| `BIOF-S3` | Bioakustyka, słuch, USG |
| `BIOF-W1` | Błędy pomiarowe |
| `BIOF-W3` | Ultrasonografia (wykład) |
| `BIOF-W4` | Tomografia komputerowa (CT) |
| `BIOF-W5` | Tomografia rezonansu magnetycznego (MRI/NMR) |

Import: `subject_id = biofizyka`. Nowe działy **tylko STOMA** → `tracks = ARRAY['stomatologia']`.  
Prefiks pytań w bazie: sprawdź istniejące ID (`SELECT id FROM questions WHERE topic_id = 'BIOF-C1' LIMIT 3`).

Eksport działu do edycji:

```bash
node scripts/export-topic-questions.mjs --subject biofizyka --topic BIOF-C1 --format sql --out exports/biof-BIOF-C1.sql
```

---

## 5. Checklist po imporcie

1. `subject_id` / `topic_id` zgodne z tabelą powyżej (kanon vs `stoma-*`).
2. Dla STOMA-only: `tracks = ARRAY['stomatologia']` na topiku.
3. **Nie** wstawiaj topików pod `stoma-histologia` / `stoma-biofizyka` (powłoki bez treści).
4. Przelicz licznik:

```sql
UPDATE public.topics t
SET question_count = (
  SELECT COUNT(*)::int FROM public.questions q
  WHERE q.topic_id = t.id AND COALESCE(q.is_active, true)
)
WHERE t.id = 'HIST-23';  -- lub IN (...)
```

5. Smoke: konto STOMA rok 1 → widać dział; konto LEK rok 1 → działu z `tracks = stomatologia` **nie ma**.

---

## 6. Skrypt SQL w repo

- `scripts/2026-05-28-topics-tracks.sql` — definicja kolumny `tracks` + przykład `FARM-19` (tylko lekarski).
