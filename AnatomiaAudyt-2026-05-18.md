# Audyt merytoryczny — Anatomia (LEK + STOMA)

**Data:** 2026-05-18
**Zakres:** 766 pytań (LEK 95 + STOMA 671), wszystkie `single_choice`, `is_active = true`.
**Metodologia:** weryfikacja poprawności `correct_option_id` + spójność `explanation` z pytaniem i wybraną odpowiedzią.

Legenda flag:
- 🔴 **BŁĄD** — `correct_option_id` jest niepoprawne lub wyjaśnienie zaprzecza odpowiedzi.
- 🟠 **NIEJEDNOZNACZNOŚĆ** — odpowiedź broni się, ale jest dyskusyjna lub wyjaśnienie wymienia więcej niż opcja.
- 🟡 **LITERÓWKA / STYL** — drobiazgi mianownictwa, nieaktualne nazewnictwo, formatowanie.

---

## LEK Anatomia (95 pytań) — wyniki

**Status:** wysoka jakość. Znaleziono **1 błąd merytoryczny** i 2 niejednoznaczności.

### 🔴 BŁĘDY

#### `lek-ana-obw-002` — Splot szyjny
**Pytanie:** „Splot szyjny powstaje z połączenia:"
- a) Gałęzi brzusznych nerwów rdzeniowych C5–C7
- b) Gałęzi grzbietowych nerwów rdzeniowych C5–C7
- **c) Gałęzi brzusznych nerwów rdzeniowych C1–C4** ← faktycznie poprawne
- d) Gałęzi brzusznych i grzbietowych nerwów rdzeniowych C5–C7
- e) Żadne z powyższych ← obecnie oznaczone jako poprawne

**Problem:** `correct_option_id = "e"`, ale opcja **C jest prawdą merytoryczną** — splot szyjny tworzą gałęzie brzuszne C1–C4. Wyjaśnienie samo to potwierdza: *„Splot szyjny (plexus cervicalis) tworzą gałęzie brzuszne nerwów rdzeniowych C1–C4"*. Wyjaśnienie też niespójne — twierdzi że „powtórzona opcja C5–C7" jest dystraktorem, podczas gdy opcja C1–C4 jest jednak w pytaniu.

**Sugerowana poprawka:** `correct_option_id = "c"` + ewentualne dopisanie do wyjaśnienia uwagi o dystraktorach C5–C7 (które wchodzą do splotu ramiennego).

```sql
UPDATE questions SET correct_option_id = 'c' WHERE id = 'lek-ana-obw-002';
```

### 🟠 NIEJEDNOZNACZNOŚCI

#### `lek-ana-cza-007` — Ujścia do środkowego przewodu nosowego
Opcja B (oznaczona jako poprawna): „Zatoka czołowa, szczękowa i komórki sitowe przednie". Wyjaśnienie mówi jednak: *„do niego uchodzą: …, komórki sitowe przednie **i środkowe**"*. Klasycznie (Bochenek) komórki sitowe środkowe uchodzą do bulla ethmoidalis w przewodzie środkowym — wyjaśnienie ma rację, ale opcja jest okrojona. To OK jako "best of available", ale można rozważyć doprecyzowanie opcji B.

#### `lek-ana-nac-006` — Gałęzie ECA w dole zażuchwowym
Wyjaśnienie samo przyznaje: *„Uszna tylna odchodzi tuż przed wejściem do ślinianki — w polskiej tradycji często liczona razem"*. Klasycznie a. auricularis posterior odchodzi przed wejściem ECA w gruczoł przyuszny — czyli **przed** dolem zażuchwowym (przyusznicowym). Odpowiedź C broni się w polskiej tradycji, ale jest dyskusyjna.

---

## STOMA Anatomia (671 pytań) — wyniki częściowe

### ANA-CZA — Czaszka (42 pyt)

#### 🔴 `ana-cza-035` — Otwór słuchowy zewnętrzny
**Pytanie:** „Otwór słuchowy **zewnętrzny** (porus acusticus externus) położony jest w części kości skroniowej:"
- a) skalistej (piramidy) ← obecnie klucz
- **b) bębenkowej** ← merytorycznie poprawne
- e) na granicy łuskowej i bębenkowej

Wyjaśnienie samo zawiera komentarz autora: *„chyba bębenkowa???"*. Porus acusticus externus klasycznie należy do `pars tympanica` (część bębenkowa) — to **porus acusticus internus** leży w piramidzie. Sugerowana zmiana: `correct_option_id = "b"` (lub `e` jeśli akceptujemy granicę).

```sql
UPDATE questions SET correct_option_id = 'b' WHERE id = 'ana-cza-035';
```

#### 🟠 Inne uwagi do ANA-CZA
- `ana-cza-007` = duplikat `lek-ana-cza-007` (ta sama niejednoznaczność: opcja wymienia tylko „sitowe przednie", wyjaśnienie „przednie i środkowe").
- Duża **redundancja**: cza-006 = cza-012, cza-007 = cza-024, cza-013 = cza-028, cza-005 = cza-019, cza-008 = cza-018, cza-021 = cza-025 = cza-036, cza-014 = cza-029, cza-003 = cza-022, cza-004 = cza-023, cza-011 = cza-026, cza-016 = cza-027. Sugeruję deduplikację (zostawić jeden, dezaktywować resztę).

### ANA-JAM — Jama ustna (11 pyt)

- **Duplikat:** `ana-jam-001` = `ana-jam-002` = `lek-ana-jam-001` (identyczne 3×).
- 🟠 **`ana-jam-004`** — klucz `a` „włókna **zazwojowe** przełączają się w zwoju". Merytorycznie nieprecyzyjne — w zwoju przełączają się włókna **przedzwojowe** (pre-) na **zazwojowe** (post-). Autor sam to przyznaje w wyjaśnieniu. Opcja `b` (n. pośredni) byłaby cleaner key.
- 🟠 **`ana-jam-008`** — klucz `a` „przewód podżuchwowy przebija m. **gnykowo-językowy**". Klasycznie (Bochenek): przewód Whartona przebija m. **żuchwowo-gnykowy** (mylohyoideus), nie hyoglossus.
- 🟠 **`ana-jam-009`** — dwie merytorycznie poprawne opcje: C (torebka z blaszki powierzchownej) i D (przebija m. żuchwowo-gnykowy). Klucz C broni się, ale single_choice z dwiema prawdami.

### ANA-MIE — Mięśnie (21 pyt)

Wszystkie pytania merytorycznie poprawne. Duża redundancja:
- mie-001 = mie-009 (rozwierający szparę głośni)
- mie-002 = mie-008 (głowa dolna m. skrzydłowego bocznego)
- mie-003 = mie-007 (obustronny skurcz)
- mie-010 = mie-013 (staw głośni)
- mie-017 = mie-021 (chrząstki nieparzyste)

### ANA-NAC — Naczynia (42 pyt)

#### 🟡 `ana-nac-040` — Artefakt redakcyjny
Opcja `e` zawiera dosłownie tekst: *„mm. pochyłe, m. płatowaty głowy, m. dźwigacz łopatki **(powtórka opcji B)**"*. Komentarz „(powtórka opcji B)" to artefakt z procesu redakcji — widoczny dla użytkownika w sesji nauki. Należy usunąć z `options.text`.

```sql
UPDATE questions SET options = jsonb_set(
  options,
  '{4,text}',
  '"mm. pochyłe, m. płatowaty głowy, m. dźwigacz łopatki"'::jsonb
) WHERE id = 'ana-nac-040';
```

#### 🟠 Inne uwagi do ANA-NAC
- `ana-nac-021` — pytanie o granicę szyi z klatką piersiową: klucz `d` (żebro 1), ale `a` (wyrostek barkowy) też defensible. Autor przyznaje.
- `ana-nac-026` — wiele poprawnych opcji (autor pogrubił 3 z 5).
- `ana-nac-031` — klucz `b` „wyrostek sutkowy" jako granica **tylna** głowy/szyi. To granica boczna; tylna to kresa karkowa górna (opcja A bliższa).
- `ana-nac-041` — klucz `c` (ż. podobojczykowa + pień chłonny), ale opcja D (ż. podobojczykowa + n. przeponowy) też klasycznie poprawna dla szczeliny przedniej.
- Duplikaty: nac-001 = nac-014 (= lek-ana-nac-001), nac-002 = nac-016, nac-005 = nac-010 = nac-019, nac-008 = nac-017 = nac-024.

### ANA-KON — Kończyny (90 pyt)

#### 🟠 NIEJEDNOZNACZNOŚCI / DROBIAZGI
- `ana-kon-019` (= `ana-kon-064`) — klucz `a` „przeprowadza ruch przywodzenia kciuka". Pytanie dotyczy m. **odwodziciela** kciuka — odpowiedź klucza jest **przeciwieństwem nazwy mięśnia**. Wyjaśnienie podejrzewa błąd w oryginale, ale rozumuje że chodzi o m. addukcyjny. Wymaga doprecyzowania pytania (czy chodzi o abductor czy adductor pollicis).
- `ana-kon-031` — klucz `e` „wszystkie powyższe odpowiedzi prawidłowe" o kanale Guyona. Opcja `a` mówi „przebiega w nim n. **łokciowy**", ale w kanale Guyona są łokciowe **naczynia i nerw**. Klucz broni się, ale opcja A jest niepełna.
- `ana-kon-053` — pytanie o m. **napinacz powięzi szerokiej**: klucz `c` (przyczepia się na powięzi szerokiej + bierze udział w prostowaniu stawu kolanowego). Opcja `d` (zgięcie i odwiedzenie w stawie biodrowym) też klasycznie poprawna — TFL ma 4 funkcje. Wymaga ostrożności.

#### ⚠️ Bardzo wysoka redundancja
ANA-KON ma 90 pytań ale wiele to powtórki — np. m. naramienny pojawia się 6×, kanał nadgarstka 4×, m. trójgłowy ramienia 3×. Sugeruję pełną deduplikację.

### ANA-TUL — Tułów (50 pyt)

#### 🟠 NIEJEDNOZNACZNOŚCI
- `ana-tul-008` — klucz `b` „m. prosty brzucha **nie ma** przyczepu na chrząstce żebrowej". Klasycznie m. prosty brzucha przyczepia się do **chrząstek żeber V-VII** i wyrostka mieczykowatego. Klucz `b` (że NIE ma) jest **anatomicznie wątpliwy**. Autor zaznacza w wyjaśnieniu „kontrowersja".
- `ana-tul-019` — klucz `d` (kresa biała). W pytaniu „rozcięgno mięśni brzucha tworzy". W zależności od interpretacji — kresa biała jest częścią rozcięgna, ale **pochewka m. prostego** (opcja C) jest bardziej kompletną odpowiedzią.
- `ana-tul-027` — klucz `a` (mięśnie wdechowe). Opcje obejmują przeponę i mm. międzyżebrowe zewn. (klasyczne wdech), ale brakuje pomocniczych — pytanie się broni.
- `ana-tul-040` — pytanie o m. **piersiowy większy**: klucz `b` (przyczep do guzka większego k. ramiennej). Klasycznie m. pierśiowy większy przyczepia się do **grzebienia guzka większego** (crista tuberculi majoris), nie samego guzka większego — to przyczep m. nadgrzebieniowego. 🟠 Wymaga doprecyzowania ("grzebień guzka większego").

#### Duplikaty
tul-005 = tul-012, tul-014 = tul-022, tul-031 = tul-038 = tul-045 (rozcięgno).

### ANA-NER — Nerwy czaszkowe (48 pyt)

#### 🔴 BŁĘDY
##### `ana-ner-029` — Nerw twarzowy (VII)
**Pytanie:** „N. twarzowy zaopatruje **przywspółczulnie**:"
- a) przyusznicę
- **c) podżuchwową, podjęzykową i gruczoły łzowe** ← merytorycznie poprawne
- klucz obecny: `b` (sama podżuchwowa)

Wyjaśnienie autora samo to potwierdza: *„N. VII (przez n. pośredni) zaopatruje przywspółczulnie ślinianki podżuchwową, podjęzykową ORAZ gruczoły łzowe i śluzowe nosa/podniebienia"*. Klucz `b` jest niepełny.

```sql
UPDATE questions SET correct_option_id = 'c' WHERE id = 'ana-ner-029';
```

##### `ana-ner-048` — N. trójdzielny (V)
**Pytanie:** „N. **szczękowy (V2)** opuszcza czaszkę przez:"
- a) szczelinę oczodołową górną
- **b) otwór okrągły** ← anatomicznie poprawne
- c) otwór owalny
- klucz obecny: `a` (szczelina oczodołowa górna — to wyjście V1 *ophthalmicus*, NIE V2!)

Wyjaśnienie autora: *„V1 — szczelina oczodołowa górna; V2 — otwór okrągły; V3 — otwór owalny"*. Klucz jest sprzeczny z wyjaśnieniem.

```sql
UPDATE questions SET correct_option_id = 'b' WHERE id = 'ana-ner-048';
```

#### 🟠 NIEJEDNOZNACZNOŚCI
- `ana-ner-007` — n. trójdzielny: klucz `e` "wszystkie", ale opcja `b` zawiera anatomicznie nieprecyzyjne sformułowanie.
- `ana-ner-022` — n. błędny (X): klucz `c` jest streszczeniem; opcja `e` (wszystkie) byłaby też defensible.

### ANA-OBW — Nerwy obwodowe (67 pyt)

#### 🔴 BŁĘDY
##### `ana-obw-002` — Splot szyjny (DUPLIKAT BŁĘDU `lek-ana-obw-002`)
**Identyczne pytanie i identyczny błędny klucz** jak w LEK Anatomii. Klucz `e` ("żadne z powyższych"), poprawnie `c` (gałęzie brzuszne C1–C4).

```sql
UPDATE questions SET correct_option_id = 'c' WHERE id = 'ana-obw-002';
```

##### `ana-obw-038` — Splot szyjny (struktura pytania)
Autor sam komentuje w wyjaśnieniu: *„NAJLEPSZĄ Z NAJGORSZYCH ODPOWIEDZI JEST D ALE NADAL JEST NIEPOPRAWNA"*. Pytanie jest fundamentalnie wadliwe — żadna opcja nie jest poprawna anatomicznie. Sugeruję przeformułowanie lub dezaktywację.

#### 🟠 NIEJEDNOZNACZNOŚCI
- `ana-obw-042` — plexus coeliacus: unerwienie przez n. błędny vs nn. trzewne. Klucz broni się ale to uproszczenie.
- `ana-obw-044` — splot sercowy: klucz `e` „wszystkie", ale opcje obejmują częściowo nakładające się źródła współczulne.
- `ana-obw-055` — pęczek przyśrodkowy splotu ramiennego: klucz `e` "brak prawidłowej", ale opcja `c` "dolnego pnia (C8–Th1)" jest anatomicznie poprawna. Autor argumentuje że egzaminacyjnie chodziło o "korzeń" nie "pęczek".
- `ana-obw-065` — unerwienie **przywspółczulne** narządów płciowych: klucz `a` (n. sromowy). **N. sromowy jest somatyczny, nie przywspółczulny**. Klasycznie nn. trzewne miedniczne (S2–S4) — brak w opcjach. Autor sam przyznaje kontrowersję.

#### Duplikaty
obw-003 = obw-021, obw-004 = obw-022, obw-005 = obw-018 = obw-023, plus wiele innych powtórek tematu splotu szyjnego i ramiennego.

### ANA-OUN — Ośrodkowy układ nerwowy (85 pyt)

**Status:** **ZERO ścisłych błędów merytorycznych** w kluczach, ALE jedna poważna niespójność w bazie i duża liczba niejednoznaczności.

#### 🔴 NIESPÓJNOŚĆ KLUCZY (ANA-OUN, opona twarda rdzenia)
Pytanie „opona twarda rdzenia kręgowego" występuje w kilku wariantach z **niespójnymi kluczami w bazie**:

| ID | Treść opcji „dwie blaszki" | Klucz w bazie | Status wg autora |
|----|---------------------------|---------------|------------------|
| `ana-oun-021` | opcja `b` „składa się z dwóch blaszek" | `b` | POPRAWNE |
| `ana-oun-043` | opcja `b` „składa się z dwóch blaszek" | `b` | POPRAWNE |
| `ana-oun-069` | opcja `a` „ma dwie blaszki" | `a` | **autor w wyjaśnieniu: „KLUCZ A jest BŁĘDNY anatomicznie — opona twarda rdzenia ma 1 blaszkę"** |
| `ana-oun-054` | (opcja C, ale klucz `e`) | `e` | autor sam: „niedoprecyzowane" |
| `ana-oun-077` | (klucz na nić końcową) | `b` | autor: „rdzeń ma 1 blaszkę" |

**Wg klasycznej anatomii (Bochenek, Sobotta — wersja polska)**: opona twarda **mózgu** ma 2 blaszki (okostnową i oponową), opona twarda **rdzenia kręgowego** — **1 blaszkę** (oponową), bo okostna kanału kręgowego jest osobna. Wymaga ujednolicenia — albo wszystkie warianty na "1 blaszkę", albo akceptacja zmiennej tradycji i dezaktywacja sprzecznych pytań.

#### 🟠 NIEJEDNOZNACZNOŚCI
- `ana-oun-033` — zakręt przyhipokampowy: klucz `d` (przyśrodkowa), ale leży też na podstawnej (opcja `b`). Autor sam zauważa.
- `ana-oun-044` (= `ana-oun-055`) — jądro pośrednio-boczne: klucz `b` (C8–L2). Klasycznie Th1–L2/L3 (opcja `c`). Zależy od podręcznika (rozszerzenie o ośrodek Budge'a-Wallera).
- `ana-oun-050` — droga Flechsiga (rdzeniowo-móżdżkowa tylna): klucz `a` „trójneuronowa", ale klasycznie dwuneuronowa. Autor przyznaje rozbieżność źródeł.
- `ana-oun-051` — droga Gowersa: klucz `b` „trójneuronowa", opcja `d` „biegnie w sznurze bocznym" też anatomicznie prawdziwa.
- `ana-oun-058` — termin „droga rdzeniowo-wzgórzowa **tylna**" nie jest klasyczny (są: boczna i przednia). Wymaga zmiany terminologii.
- `ana-oun-062` — ograniczenie przednie komory III: klucz `a` (spoidło przednie). **Klasycznie blaszka krańcowa** (opcja `e`) jest prawidłową odpowiedzią w węższym sensie.
- `ana-oun-070`, `ana-oun-079` — autor sam przyznaje: „brak wyraźnego klucza w PDF — pytanie niedokończone, ale logicznie pasuje". Pytania niedoprecyzowane.
- `ana-oun-071` — wzgórek twarzowy: autor wątpi czy klucz w bazie jest taki sam jak egzaminacyjny: „imo nie było takiej odpowiedzi z jądrami".

#### ⚠️ EKSTREMALNA REDUNDANCJA
ANA-OUN ma **85 pytań** ale tylko ~**30 unikalnych treści**. Najczęstsze powtórki:
- pęcherzyki mózgowe pierwotne: `oun-052 = oun-061 = oun-074` (3×)
- wzgórek n. twarzowego: `oun-016 = oun-019 = oun-028 = oun-046 = oun-057 = oun-071` (6×)
- przegroda przezroczysta: `oun-007 = oun-017 = oun-026 = oun-045` (4×)
- opona twarda rdzenia (5×) — z niespójnymi kluczami!
- ramiona wzgórków dolnych (słuch): `oun-022 = oun-047 = oun-059` (3×)
- jądro pośrednio-boczne: `oun-044 = oun-055` (2×)
- t. łącząca tylna: `oun-006 = oun-024` (2×)
- przywspółczulne jądro VII: `oun-013 = oun-035` (2×)
- droga rdzeniowo-móżdżkowa tylna: `oun-050 = oun-065` (2×)

### ANA-TRZ — Trzewia (215 pyt)

**Status:** największy temat. Znaleziono **2 jednoznaczne błędy klucza** (oba przyznane przez autora w wyjaśnieniu), **2 niespójności kluczy w bazie** dla tych samych pytań oraz **kilkanaście niejednoznaczności**. Skala redundancji wysoka (~70-80 powtórek).

#### 🔴 BŁĘDY KLUCZA

##### `ana-trz-109` — Torebka nerki (autor sam przyznaje błąd)
**Pytanie:** „Do miąższu nerki bezpośrednio przylega:"
- a) Powięź przednerkowa
- b) Powięź nerkowa
- c) Torebka tłuszczowa
- d) Błona podwłóknista nerki ← **obecny klucz**
- **e) Torebka włóknista nerki** ← anatomicznie poprawne

Autor w wyjaśnieniu: *„klucz autora wskazuje D ('błona podwłóknista nerki'), co jest BŁĘDEM merytorycznym — termin 'błona podwłóknista' nie istnieje w polskiej anatomii. Merytorycznie poprawną odpowiedzią jest E (torebka włóknista)"*.

```sql
UPDATE questions SET correct_option_id = 'e' WHERE id = 'ana-trz-109';
```

##### `ana-trz-140` — Pytanie wadliwe (autor sam przyznaje błąd)
**Pytanie:** „Żołądek:"
- a) leży wtórnie zewnątrzotrzewnowo
- b) tworzy tylną ścianę torby sieciowej ← także błędne (żołądek tworzy ścianę **przednią**)
- c) unaczyniony jest przez gałęzie t. krezkowej dolnej
- d) leży pierwotnie zewnątrzotrzewnowo
- e) jest unerwiony przywspółczulnie przez splot podbrzuszny górny ← **obecny klucz**

Autor w wyjaśnieniu: *„Autor wskazał klucz E, ale ta odpowiedź jest ewidentnie błędna — splot podbrzuszny górny unerwia narządy miednicy, NIE żołądek. Żołądek jest unerwiony przywspółczulnie przez n. błędne... Klucz autora jest błędny — żadna z 5 podanych opcji nie jest poprawna w pełnym brzmieniu"*.

**Sugerowana akcja:** dezaktywować pytanie (`is_active = false`) lub przeformułować — żadna opcja nie jest jednoznacznie poprawna.

```sql
UPDATE questions SET is_active = false WHERE id = 'ana-trz-140';
```

#### 🔴 NIESPÓJNOŚCI KLUCZY W BAZIE (te same pytania, różne klucze)

##### Powięź nasienna zewnętrzna (powtarza się w ANA-TRZ)
| ID | Treść opcji wybranej w kluczu | Klucz | Status |
|----|------------------------------|-------|--------|
| `ana-trz-015` | „Powięzi podskórnej" | `e` | wybrane jako poprawne |
| `ana-trz-058` | „Rozcięgna m. skośnego zewnętrznego brzucha" | `b` | wybrane jako poprawne |
| `ana-trz-069` | „Powięzi podskórnej" | `e` | wybrane jako poprawne |

Autor w wyjaśnieniu `ana-trz-069`: *„Autor klucza wskazał E (powięź podskórna) — to interpretacja klasyczna w polskiej anatomii. W batchu 2 ten sam temat miał wskazaną odpowiedź B (rozcięgno m. skośnego zewn.) — to nomenklaturowa niejednoznaczność. Dla SQL warto przyjąć jedną interpretację jako standard"*.

**Sugerowana akcja:** ujednolicić — autor (Bochenek) wskazuje że formalnie obie wersje istnieją, ale klasycznie używa się **„rozcięgna m. skośnego zewnętrznego"** (czyli klucz B w pytaniach, gdzie ta opcja występuje, oraz odpowiednie alternatywy w pozostałych).

##### Torebka włóknista nerki (wewnętrzna sprzeczność w pytaniach)
| ID | Opcja klucza | Klucz | Ocena autora |
|----|--------------|-------|--------------|
| `ana-trz-109` | „Błona podwłóknista" | `d` | **autor: „BŁĄD merytoryczny — powinno być E (torebka włóknista)"** |
| `ana-trz-149` | „Błona włóknista" | `d` | OK |
| `ana-trz-167` | „Błona podwłóknista (mięśniowa)" | `d` | **autor: „poprawne wg Bochenka — torebka ma 2 warstwy"** |

Wewnętrzna sprzeczność: opcja „błona podwłóknista" jest w `oun-109` uznawana za błąd, a w `oun-167` za poprawną. Wymaga ujednolicenia interpretacji.

#### 🟠 NIEJEDNOZNACZNOŚCI

- `ana-trz-039` — tętnice płucne: autor sam pisze że **opcje A, B i C są wszystkie prawdziwe**, ale single_choice wybrał A
- `ana-trz-044` — ściana tylna przedsionka prawego: klucz `a` (VCI), ale `b` (VCS) też uchodzi do ściany tylnej
- `ana-trz-049` — tt. żołądkowe krótkie biegną w więzadle **żołądkowo-śledzionowym** (klasycznie), nie „żołądkowo-przeponowym" jak w opcji C
- `ana-trz-084` — zwężenie anatomiczne przełyku: klucz `c` „lewe oskrzele + **aorta zstępująca**", klasycznie to **łuk aorty**
- `ana-trz-127` — krzywizna większa: klucz `b` (t. żołądkowo-sieciowa lewa), ale opcja `e` (tt. żołądkowe krótkie) też ją zaopatrują (dno żołądka)
- `ana-trz-129` — autor zaznacza: *„Brak klucza autorskiego — rozwiązanie oparte na klasycznej anatomii"*
- `ana-trz-131` — autor: *„Autor zaznaczył klucz dwojako (G:b, B:c)"* — niespójność oryginału
- `ana-trz-133` — klucz `b` (t. nadnerczowa środkowa), ale opcja `a` (t. nerkowa prawa) też jest parzystą gałęzią trzewną aorty brzusznej
- `ana-trz-144` — autor: *„autor źródła zaznaczył jako klucz OBA D i E na zielono — obie odpowiedzi są merytorycznie poprawne"*
- `ana-trz-145` — ściana tylna przedsionka prawego: klucz `d` (dół owalny), ale dół owalny leży w przegrodzie m-przedsionkowej (opcja `e`) — kilka prawdziwych opcji
- `ana-trz-167` — terminologia Bochenek vs Sokołowska-Pituchowa (jak wyżej)
- `ana-trz-169` — jajnik: autor sam wzmiankuje *„kontrowersję terminologiczną"* (wewnątrzotrzewnowo vs piętro podotrzewnowe miednicy)
- `ana-trz-173` — węzeł SA: klucz `e` (śródsierdzie), autor sam: *„Wiele podręczników podaje 'podosierdziowo' — kontrowersja terminologiczna"*
- `ana-trz-179` — krzywizna mniejsza: klucz `c` (t. żołądkowa prawa), klasycznie głównym dawcą jest **t. żołądkowa lewa** (opcja `a`)
- `ana-trz-196` — szlaki międzywęzłowe: autor sam: *„w Bochenku nie ma wspomniane... niektóre podręczniki anatomii nie uznają osobnych szlaków, a tylko rozproszone przewodzenie"*
- `ana-trz-212` — wnęka nerki: klucz `a` (początek moczowodu + naczynia), ale opcja `e` (układ kielichowo-miedniczkowy + naczynia) też defensywna (granica wnęka/zatoka)

#### ⚠️ EKSTREMALNA REDUNDANCJA
ANA-TRZ ma **215 pytań** ale tylko ~**140 unikalnych treści**. Najwięcej powtórek:
- cewka męska części (sterczowa-błoniasta-gąbczasta): `trz-046 = trz-113 = trz-176` (3×)
- wzgórek nasienny: `trz-047 = trz-114 = trz-157` (3×)
- 3 pęcherzyki / pęczek Hisa / rozdwojenie tchawicy / brodawka Vatera (po 2-3×)
- nerki położenie: `trz-092 = trz-139 = trz-154 = trz-198` (4×)
- gałęzie osierdziowe: `trz-054 = trz-108 = trz-160` (3×)
- zachyłki żebrowo-śródpiersiowe: `trz-057 = trz-110 = trz-150 = trz-163 = trz-214` (5×)
- ściana tylna torby sieciowej = trzustka: `trz-033 = trz-095 = trz-152` (3×)
- mięśnie grzebieniaste: `trz-037 = trz-102 = trz-141 = trz-171` (4×)
- więzadło wątrobowo-dwunastnicze + otwór Winslowa po 2-3×
- macica anteflexio-anteversio: `trz-019 = trz-073` (2×)
- jajowód kolejność części: `trz-018 = trz-072 = trz-174` (3×)
- kanał pachwinowy u kobiet: `trz-027 = trz-059 = trz-061 = trz-091` (4×)

---

## Podsumowanie końcowe (766 pytań Anatomia)

### Bilans
| Kategoria | Liczba | % całości |
|-----------|--------|-----------|
| 🔴 **Jednoznaczne błędy klucza** | 6 | 0,8% |
| 🔴 **Niespójności kluczy w bazie** | 3 (grupy pytań) | ~2% |
| 🟠 **Niejednoznaczności merytoryczne** | ~30 | ~4% |
| 🟡 **Drobiazgi redakcyjne** | ~5 | <1% |
| ⚠️ **Duplikaty (ten sam temat)** | ~200+ | ~26% |
| ✅ **Poprawne, bezsporne** | ~520 | ~68% |

### Pliki SQL — wszystkie sugerowane poprawki w jednym miejscu

```sql
UPDATE questions SET correct_option_id = 'c' WHERE id = 'lek-ana-obw-002';
UPDATE questions SET correct_option_id = 'b' WHERE id = 'ana-cza-035';
UPDATE questions SET options = jsonb_set(
  options,
  '{4,text}',
  '"mm. pochyłe, m. płatowaty głowy, m. dźwigacz łopatki"'::jsonb
) WHERE id = 'ana-nac-040';
UPDATE questions SET correct_option_id = 'c' WHERE id = 'ana-ner-029';
UPDATE questions SET correct_option_id = 'b' WHERE id = 'ana-ner-048';
UPDATE questions SET correct_option_id = 'c' WHERE id = 'ana-obw-002';
UPDATE questions SET correct_option_id = 'e' WHERE id = 'ana-trz-109';
UPDATE questions SET is_active = false WHERE id = 'ana-trz-140';
```

### Rekomendacje strukturalne

1. **Deduplikacja** — najwięcej zysku przyniesie deduplikacja ANA-OUN (85 → ~30 unikalnych) i ANA-TRZ (215 → ~140 unikalnych). Pozostawić jedną wersję każdego pytania, dezaktywować resztę (`is_active = false`).

2. **Ujednolicenie terminologii** — ustalić preferowane definicje dla:
   - powięź nasienna zewnętrzna (rozcięgno m. skośnego zewn. vs powięź podskórna)
   - torebka włóknista nerki (jednowarstwowa vs dwuwarstwowa wg Bochenka)
   - opona twarda rdzenia kręgowego (1 vs 2 blaszki)

3. **Rewizja niejednoznacznych pytań** — w ~30 pytaniach autor sam w wyjaśnieniu odnotował wątpliwości, sprzeczność z innymi źródłami lub że klucz pochodzi z domysłu (a nie z oryginalnego egzaminu). Te pytania należałoby ponownie zweryfikować z aktualnym podręcznikiem.

4. **Format pytań** — kilka pytań ma artefakty redakcyjne (np. `ana-nac-040` z komentarzem „(powtórka opcji B)" w tekście opcji widocznym dla użytkownika).

### Co NIE było weryfikowane
- Czy `explanation` jest aktualne wg najnowszych wytycznych klinicznych (np. SCAI 2023, NICE).
- Czy istnieją duplikaty między LEK-ANA-* a ANA-* (zaobserwowano kilka, ale pełna analiza wymaga osobnego przebiegu).
- Czy są pytania z innych przedmiotów które przypadkiem trafiły do anatomii.

