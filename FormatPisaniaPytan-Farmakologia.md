# Format pytań — Farmakologia (3 rok stomatologii)

> **Cel:** ten plik jest **jedynym źródłem prawdy** dla LLM-a (Claude) konwertującego surowy materiał (slajdy / pytania kolokwialne / podręcznik) na batch SQL do Supabase. Companion do `FormatPisaniaPytan.md` (uniwersalne zasady).

---

## 0. TL;DR dla bota

1. Każde pytanie pisz w SQL-u, gotowe do wklejenia w Supabase SQL Editor.
2. 5 opcji `a`–`e`, kolejność w JSONB zawsze `a → b → c → d → e`.
3. `id` pytania: `farm-{NN}-{NNN}` (małe litery, NN = numer tematu, NNN = 001-...).
4. `topic_id` ∈ kontrolowana lista FARM-01 … FARM-17 (sekcja 2).
5. `subtheme_label` — wybierasz z listy podtematów dla danego tematu (sekcja 3) **lub** `NULL`.
6. `theme_label` — dla farmakologii **zawsze `NULL`** (lista istnieje tylko dla anatomii).
7. Apostrofy w `text`/`explanation` podwajaj (`it''s`, nie `it's`).
8. Ostatni rekord w `VALUES` kończysz **`);`** (nie przecinkiem).
9. Po batchu zawsze `UPDATE public.topics SET question_count = …`.
10. Bez emoji, bez tabel markdown w `explanation`, polskie znaki zachowane.

---

## 1. Struktura tabeli `questions` (przypomnienie)

| Kolumna             | Typ     | Wymagane | Wartość dla farmakologii |
|---------------------|---------|----------|--------------------------|
| `id`                | TEXT    | TAK      | `farm-{NN}-{NNN}` |
| `topic_id`          | TEXT    | TAK      | `FARM-01` … `FARM-17` |
| `text`              | TEXT    | TAK      | Treść pytania |
| `options`           | JSONB   | TAK      | Tablica 5 opcji `a`–`e` |
| `correct_option_id` | TEXT    | TAK      | `a`/`b`/`c`/`d`/`e` |
| `explanation`       | TEXT    | TAK      | 2–6 zdań, dlaczego poprawna i dlaczego główne dystraktory są błędne |
| `difficulty`        | TEXT    | NIE      | `latwe` \| `srednie` \| `trudne` (domyślnie `srednie`) |
| `question_type`     | TEXT    | NIE      | **pomiń** → DB ustawi `single_choice` |
| `is_active`         | BOOL    | NIE      | **pomiń** → DB ustawi `true` |
| `theme_label`       | TEXT    | NIE      | **zawsze `NULL`** dla farmakologii |
| `subtheme_label`    | TEXT    | NIE      | Z listy w sekcji 3 lub `NULL` |
| `batch_label`       | TEXT    | NIE      | `e_farm_<rok>/<nr>` lub `NULL` |
| `learning_outcome`  | TEXT    | NIE      | Kod efektu kształcenia (np. `B.W7`) lub `NULL` |
| `source_exam`       | TEXT    | NIE      | Np. `LDEK 2024 wiosna` lub `NULL` |
| `source_code`       | TEXT    | NIE      | Kod pytania w źródle lub `NULL` |

> Kolumna `difficulty` **istnieje** w tabeli `questions` (default `srednie`) — można jej używać. To różnica wobec `FormatPisaniaPytan.md` (anatomia ją pomija).

---

## 2. Tematy (`topics.id`) — kontrolowana lista

| `topic_id` | `name`                                                                            | Skrót w `id` pytania |
|------------|-----------------------------------------------------------------------------------|----------------------|
| `FARM-01`  | Farmakodynamika, farmakokinetyka i interakcje leków                               | `farm-01-`           |
| `FARM-02`  | Autakoidy (aminowe, peptydowe, purynowe, gazowe, lipidowe)                        | `farm-02-`           |
| `FARM-03`  | NLPZ, leczenie RZS i dny moczanowej. Opioidowe leki przeciwbólowe                 | `farm-03-`           |
| `FARM-04`  | Leki autonomicznego układu nerwowego                                              | `farm-04-`           |
| `FARM-05`  | Płytki krwi, leki przeciwkrzepliwe, leczenie niedokrwistości                      | `farm-05-`           |
| `FARM-06`  | Leki moczopędne. Układ krążenia cz. I – nadciśnienie tętnicze i płucne            | `farm-06-`           |
| `FARM-07`  | Układ krążenia cz. II – HF, dławica, OZW, antyarytmiczne, hipolipemizujące        | `farm-07-`           |
| `FARM-08`  | Leki psychotropowe – przeciwdepresyjne, anksjolityczne, neuroleptyczne            | `farm-08-`           |
| `FARM-09`  | OUN i obwodowy UN – znieczulenie miejscowe i ogólne, miorelaksacja, leki nasenne  | `farm-09-`           |
| `FARM-10`  | Leki przeciwpadaczkowe, zespoły otępienne, choroba Parkinsona                     | `farm-10-`           |
| `FARM-11`  | Witaminy, biopierwiastki i suplementy diety                                       | `farm-11-`           |
| `FARM-12`  | Układ oddechowy – wykrztuśne, przeciwkaszlowe, astma, POChP                       | `farm-12-`           |
| `FARM-13`  | Leki przeciwbakteryjne i środki odkażające. Farmakobiologia infekcji              | `farm-13-`           |
| `FARM-14`  | Leki przeciwwirusowe, przeciwgrzybicze i przeciwpasożytnicze. Medycyna podróży    | `farm-14-`           |
| `FARM-15`  | Leki układu pokarmowego                                                           | `farm-15-`           |
| `FARM-16`  | Hormony – podwzgórze, przysadka, tarczyca, kora nadnerczy, hormony płciowe        | `farm-16-`           |
| `FARM-17`  | Metabolizm wapnia, homeostaza węglowodanowa, leczenie otyłości                    | `farm-17-`           |

**Numeracja `id` pytania:** trzy cyfry, zera wiodące (`001`, `014`, `127`). Przed batchem sprawdź:

```sql
SELECT id FROM public.questions
 WHERE topic_id = 'FARM-03'
 ORDER BY id DESC LIMIT 1;
```

---

## 3. Kontekst tematyczny — co należy do którego `FARM-NN`

> Lista pomocnicza dla bota: gdy materiał wejściowy mówi o danym leku/mechanizmie, kieruj go do wskazanego `topic_id`. Opcjonalny `subtheme_label` dobierz z listy w kolumnie po prawej (lub zostaw `NULL`).

### FARM-01 — Farmakodynamika, farmakokinetyka, interakcje
Zakres: receptory i typy (jonotropowe, metabotropowe, jądrowe), agoniści/antagoniści, ED50/LD50, indeks terapeutyczny, krzywe dawka-odpowiedź. Wchłanianie, dystrybucja (Vd, wiązanie z białkami), metabolizm (CYP450 — induktory/inhibitory), wydalanie, klirens, t½, biodostępność, efekt pierwszego przejścia. Interakcje farmakodynamiczne i farmakokinetyczne. Działania niepożądane, idiosynkrazja, polipragmazja.

**Subtematy:** `Receptory i mechanizmy działania`, `Farmakokinetyka — wchłanianie`, `Dystrybucja i wiązanie z białkami`, `Metabolizm i CYP450`, `Wydalanie i klirens`, `Interakcje lekowe`, `Indeks terapeutyczny`.

### FARM-02 — Autakoidy
Histamina (H1–H4), antagoniści H1 I i II generacji (difenhydramina, prometazyna, loratadyna, cetyryzyna, feksofenadyna), antagoniści H2 (ranitydyna, famotydyna). Serotonina (5-HT1–7), tryptany, ondansetron. Bradykinina, prostaglandyny i leukotrieny (LTRA: montelukast). Adenozyna. NO. Endokannabinoidy.

**Subtematy:** `Histamina i leki przeciwhistaminowe`, `Antagoniści H2`, `Serotonina i tryptany`, `Setrony (antagoniści 5-HT3)`, `Bradykinina`, `Prostaglandyny`, `Leukotrieny`, `Tlenek azotu`.

### FARM-03 — NLPZ, RZS, dna, opioidy
**NLPZ:** mechanizm (COX-1/COX-2), klasy (salicylany: ASA; pochodne kwasu propionowego: ibuprofen, naproksen; pochodne kwasu octowego: diklofenak, indometacyna; oksykamy: piroksykam, meloksykam; koksyby: celekoksyb, etorykoksyb), działania niepożądane (GI, nerki, sercowo-naczyniowe, reakcje nadwrażliwości), paracetamol (osobno — nie jest NLPZ). **RZS:** DMARDy konwencjonalne (metotreksat, sulfasalazyna, leflunomid, hydroksychlorochinę), biologiczne (anty-TNF: infliksymab, adalimumab; rytuksymab, tocylizumab, abatacept), JAK-inhibitory (tofacitinib, baricitinib). **Dna:** ostra (kolchicyna, NLPZ, GKS), przewlekła (allopurynol, febuksostat, prebenecyd). **Opioidy:** agonistyczne (morfina, fentanyl, oksykodon, metadon), częściowe (buprenorfina), z wtórnym działaniem (tramadol, tapentadol), słabe (kodeina), antagoniści (nalokson, naltrekson).

**Subtematy:** `NLPZ — COX-1/COX-2`, `Salicylany`, `Koksyby`, `Paracetamol`, `DMARDy konwencjonalne`, `Biologiczne DMARDy`, `JAK-inhibitory`, `Leki na dnę moczanową`, `Allopurynol i febuksostat`, `Opioidy silne`, `Opioidy słabe (tramadol, kodeina)`, `Antagoniści opioidowi`.

### FARM-04 — Leki autonomicznego układu nerwowego
**Cholinergiczne:** parasympatykomimetyki (pilokarpina, betanechol), inhibitory AChE (neostygmina, pirydostygmina, donepezyl, riwastygmina, edrofonium), antagoniści muskarynowi (atropina, skopolamina, ipratropium, tiotropium, oksybutynina, tolterodyna). **Adrenergiczne:** agoniści α1 (fenylefryna), α2 (klonidyna, deksmedetomidyna), β1 (dobutamina), β2 (salbutamol, salmeterol, formoterol), nieselektywne (adrenalina, noradrenalina, izoprenalina, efedryna). Antagoniści α1 (prazosyna, doksazosyna, tamsulosyna), α nieselektywne (fenoksybenzamina, fentolamina), β1-selektywne (metoprolol, bisoprolol, nebiwolol, atenolol), nieselektywne β (propranolol, nadolol), α+β (karwedilol, labetalol). Sympatykolityki ośrodkowe (metyldopa, klonidyna). Blokery zwojów (heksametonium, mekamylamina — historyczne).

**Subtematy:** `Parasympatykomimetyki`, `Inhibitory AChE`, `Antagoniści muskarynowi`, `Agoniści adrenergiczni α`, `Agoniści adrenergiczni β`, `α-blokery`, `β-blokery selektywne`, `β-blokery nieselektywne`, `Sympatykolityki ośrodkowe`, `Adrenalina i noradrenalina`.

### FARM-05 — Płytki, antykoagulanty, niedokrwistość
**Antyagregacyjne:** ASA, inhibitory P2Y12 (klopidogrel, prasugrel, tikagrelor), inhibitory GP IIb/IIIa (abciksymab, eptyfibatyd, tirofiban), dipirydamol, cilostazol. **Antykoagulanty:** heparyny (UFH, LMWH: enoksaparyna, dalteparyna, nadroparyna), fondaparynuks, antagoniści wit. K (warfaryna, acenokumarol), DOAC (dabigatran — anty-IIa; rywaroksaban, apiksaban, edoksaban — anty-Xa). Odwracanie: protamina, witamina K, idarucyzumab (dabigatran), andeksanet alfa (Xa). **Fibrynolityczne:** alteplaza, tenekteplaza, streptokinaza. Inhibitory fibrynolizy: kwas traneksamowy, kwas aminokapronowy. **Niedokrwistość:** żelazo (doustne, IV), kwas foliowy, wit. B12, erytropoetyna (epoetyna alfa/beta, darbepoetyna).

**Subtematy:** `ASA i antyagregacyjne`, `Inhibitory P2Y12`, `Heparyny`, `Antagoniści witaminy K`, `DOAC — inhibitory Xa`, `DOAC — inhibitory IIa`, `Odwracanie antykoagulacji`, `Leki fibrynolityczne`, `Antyfibrynolityki`, `Żelazo`, `Witamina B12 i kwas foliowy`, `Erytropoetyna`.

### FARM-06 — Diuretyki + nadciśnienie/płucne
**Diuretyki:** pętlowe (furosemid, torasemid, bumetanid), tiazydy (HCTZ, indapamid, chlortalidon), oszczędzające K (spironolakton, eplerenon, amiloryd, triamteren), osmotyczne (mannitol), inhibitory CA (acetazolamid). **Nadciśnienie tętnicze:** ACEI (kaptopryl, enalapryl, ramipryl, peryndopryl), ARB (losartan, walsartan, telmisartan), CCB dihydropirydynowe (amlodypina, nifedypina, lerkanidypina), niedihydropirydynowe (werapamil, diltiazem), β-blokery, diuretyki, agoniści α2 (metyldopa, klonidyna), α1-blokery (doksazosyna), wazodylatatory (hydralazyna, minoksydyl), nitroprusydek sodu, inhibitory reniny (aliskiren), ARNI (sakubitryl/walsartan). **Nadciśnienie płucne:** prostacyklinowe (epoprostenol, iloprost, treprostinil), antagoniści ET (bosentan, ambrisentan, macitentan), PDE5 (sildenafil, tadalafil), riocyguat.

**Subtematy:** `Diuretyki pętlowe`, `Tiazydy`, `Diuretyki oszczędzające potas`, `ACEI`, `ARB`, `CCB dihydropirydynowe`, `CCB niedihydropirydynowe`, `Inhibitory reniny`, `ARNI`, `Leki na nadciśnienie płucne`.

### FARM-07 — Układ krążenia II
**HF:** diuretyki, ACEI/ARB, ARNI, β-blokery (bisoprolol, karwedilol, metoprolol CR/XL, nebiwolol), MRA, SGLT2-inhibitory (dapagliflozyna, empagliflozyna), iwabradyna, digoksyna. **Dławica:** azotany (nitrogliceryna, ISDN, ISMN — tolerancja!), β-blokery, CCB, nikorandyl, ranolazyna, trimetazydyna. **OZW:** ASA + inhibitor P2Y12, antykoagulanty, statyny, β-blokery, ACEI. **Antyarytmiczne (Vaughan Williams):** klasa Ia (chinidyna, prokainamid, dizopiramid), Ib (lidokaina, meksyletyna, fenytoina), Ic (flekainid, propafenon); II (β-blokery); III (amiodaron, sotalol, dronedaron, dofetylid, ibutylid); IV (werapamil, diltiazem); inne — adenozyna, digoksyna, magnez. **Hipolipemizujące:** statyny (atorwastatyna, rosuwastatyna, simwastatyna), ezetymib, fibraty (fenofibrat, gemfibrozyl), żywice (cholestyramina), kwas nikotynowy, PCSK9 (alirokumab, ewolokumab), inkliziran, kwasy ω-3.

**Subtematy:** `Leki na niewydolność serca`, `Glikozydy naparstnicy`, `SGLT2-inhibitory w HF`, `Iwabradyna`, `Azotany`, `Antyarytmiczne klasa I`, `Antyarytmiczne klasa II`, `Antyarytmiczne klasa III`, `Antyarytmiczne klasa IV`, `Adenozyna`, `Statyny`, `Fibraty`, `PCSK9-inhibitory`, `Ezetymib`.

### FARM-08 — Leki psychotropowe
**Przeciwdepresyjne:** SSRI (fluoksetyna, sertralina, escitalopram, paroksetyna, citalopram), SNRI (wenlafaksyna, duloksetyna), TLPD (amitryptylina, klomipramina, nortryptylina, imipramina, doksepina), IMAO (moklobemid, selegilina), atypowe (mirtazapina, bupropion, trazodon, agomelatyna, wortioksetyna). **Stabilizatory nastroju:** lit, walproinian, karbamazepina, lamotrygina. **Anksjolityki:** benzodiazepiny (diazepam, lorazepam, alprazolam, klonazepam, midazolam, oksazepam), buspiron, hydroksyzyna, pregabalina. **Neuroleptyki:** klasyczne (chlorpromazyna, haloperidol, flufenazyna, zuklopentyksol), atypowe (rysperydon, olanzapina, kwetiapina, klozapina, arypiprazol, ziprazidon, lurazidon, palmityniany długodziałające). Działania niepożądane: EPS, zespół metaboliczny, agranulocytoza (klozapina), QTc.

**Subtematy:** `SSRI`, `SNRI`, `TLPD`, `IMAO`, `Atypowe przeciwdepresyjne`, `Lit`, `Stabilizatory nastroju`, `Benzodiazepiny`, `Buspiron`, `Neuroleptyki klasyczne`, `Neuroleptyki atypowe`, `Klozapina`, `Działania niepożądane neuroleptyków`.

### FARM-09 — OUN/PNS: znieczulenie, miorelaksacja, nasenne
**Znieczulenie miejscowe:** estry (prokaina, tetrakaina, benzokaina), amidy (lidokaina, mepiwakaina, prilokaina, bupiwakaina, ropiwakaina, artikaina). Dodatki: adrenalina, wodorowęglan. Kardiotoksyczność bupiwakainy, methemoglobinemia (prilokaina, benzokaina). **Znieczulenie ogólne:** wziewne (sewofluran, izofluran, desfluran, podtlenek azotu, halotan — historyczny), dożylne (propofol, etomidat, ketamina, tiopental, midazolam), opioidy do anestezji (fentanyl, remifentanyl, sufentanyl, alfentanyl). MAC, indukcja, podtrzymanie. **Miorelaksanty:** depolaryzujące (sukcynylocholina — hipertermia złośliwa, hiperkaliemia), niedepolaryzujące (rokuronium, wekuronium, atrakurium, cisatrakurium, pankuronium). Odwracanie: neostygmina + glikopirolan, sugammadeks (roku, wekuronium). Spazmolityki ośrodkowe (baklofen, tyzanidyna, tolperizon, dantrolen — hipertermia złośliwa). **Nasenne:** benzodiazepiny krótkodziałające (triazolam, temazepam), Z-leki (zolpidem, zopiklon, eszopiklon, zaleplon), agoniści melatoniny (ramelteon, melatonina), antagonista oreksyny (suworeksant), antyhistaminowe I generacji.

**Subtematy:** `Znieczulenie miejscowe — amidy`, `Znieczulenie miejscowe — estry`, `Lidokaina`, `Artikaina`, `Wziewne anestetyki`, `Propofol`, `Ketamina`, `Opioidy anestezjologiczne`, `Sukcynylocholina`, `Niedepolaryzujące miorelaksanty`, `Sugammadeks`, `Z-leki`, `Hipertermia złośliwa`.

### FARM-10 — Padaczka, otępienie, Parkinson
**Padaczka:** klasyczne (fenytoina, karbamazepina, walproinian, fenobarbital, etosuksymid — napady nieświadomości), nowsze (lamotrygina, lewetyracetam, topiramat, gabapentyna, pregabalina, okskarbazepina, lakozamid, perampanel, brywaracetam, eslikarbazepina, zonisamid, tiagabina, wigabatryna), benzodiazepiny w stanie padaczkowym (lorazepam, diazepam, midazolam, klonazepam). **Otępienie:** inhibitory AChE (donepezyl, riwastygmina, galantamina), antagonista NMDA (memantyna), donanemab/aducanumab/lekanemab (anty-amyloid β). **Parkinson:** lewodopa + karbidopa/benserazyd, agoniści dopaminy (pramipeksol, ropinirol, rotygotyna, apomorfina), inhibitory MAO-B (selegilina, rasagilina, safinamid), inhibitory COMT (entakapon, tolkapon, opikapon), amantadyna, antagoniści muskarynowi (biperyden, triheksyfenidyl — drżenie).

**Subtematy:** `Leki przeciwpadaczkowe klasyczne`, `Walproinian`, `Karbamazepina`, `Lamotrygina`, `Lewetyracetam`, `Stan padaczkowy`, `Inhibitory AChE w demencji`, `Memantyna`, `Lewodopa`, `Agoniści dopaminy`, `Inhibitory MAO-B`, `Inhibitory COMT`.

### FARM-11 — Witaminy, biopierwiastki, suplementy
**Witaminy rozpuszczalne w tłuszczach:** A (retinol, izotretynoina, acytretyna), D (cholekalcyferol, kalcytriol, parykalcytol, alfakalcydol), E (tokoferol), K (filochinon, menachinon). **Witaminy rozpuszczalne w wodzie:** B1 (tiamina), B2 (ryboflawina), B3 (niacyna), B5 (kwas pantotenowy), B6 (pirydoksyna), B7 (biotyna), B9 (kwas foliowy), B12 (cyjanokobalamina, hydroksykobalamina), C (kwas askorbinowy). **Biopierwiastki:** żelazo, jod, fluor (próchnica!), cynk, magnez, selen, miedź, chrom, mangan. Niedobory i nadmiary. Hiperwitaminoza A i D.

**Subtematy:** `Witamina A`, `Witamina D`, `Witamina K`, `Witaminy z grupy B`, `Kwas foliowy`, `Witamina B12`, `Witamina C`, `Fluor`, `Jod`, `Cynk`, `Magnez`.

### FARM-12 — Układ oddechowy
**Astma/POChP:** SABA (salbutamol, fenoterol), LABA (salmeterol, formoterol, indakaterol), ICS (budesonid, flutikazon, beklometazon, cyklesonid, mometazon), LAMA (tiotropium, umeklidynium, glikopironium, akilidynium), antagoniści leukotrienowi (montelukast, zafirlukast), zileuton, kromony (kromoglikan, nedokromil), teofilina, omalizumab (anty-IgE), mepolizumab/reslizumab/benralizumab (anty-IL5), dupilumab (anty-IL4Rα), tezepelumab (anty-TSLP), roflumilast (PDE4). **Wykrztuśne:** acetylocysteina, ambroksol, bromheksyna, karbocysteina, erdosteina, mukolityki. **Przeciwkaszlowe:** opioidowe (kodeina, dekstrometorfan), nieopioidowe (butamirat, lewodropropizyna). Surfaktant. Tlenoterapia.

**Subtematy:** `SABA`, `LABA`, `ICS`, `LAMA`, `Antagoniści leukotrienowi`, `Teofilina`, `Biologiczne w astmie`, `Wykrztuśne — mukolityki`, `Przeciwkaszlowe opioidowe`, `Przeciwkaszlowe nieopioidowe`.

### FARM-13 — Antybiotyki + odkażające
**β-laktamy:** penicyliny naturalne (benzylopenicylina, fenoksymetylopenicylina), penicyliny izoksazolilowe (kloksacylina, dikloksacylina, flukloksacylina), aminopenicyliny (amoksycylina, ampicylina), karboksypenicyliny (tikarcylina), ureidopenicyliny (piperacylina), inhibitory β-laktamaz (klawulanian, sulbaktam, tazobaktam, awibaktam, relebaktam, waborbaktam). Cefalosporyny I–V generacji (cefazolina, cefuroksym, ceftriakson, cefepim, ceftarolina, ceftolozan/tazobaktam, ceftolozan, ceftarolina). Karbapenemy (imipenem/cylastatyna, meropenem, ertapenem, dorypenem). Monobaktamy (aztreonam). **Aminoglikozydy** (gentamycyna, amikacyna, tobramycyna, streptomycyna — ototoks., nefrotoks.). **Makrolidy** (erytromycyna, klarytromycyna, azytromycyna, fidaksomycyna). **Linkozamidy** (klindamycyna, linkomycyna — kolit rzekomobłoniasty). **Tetracykliny i glicylocykliny** (doksycyklina, minocyklina, tygecyklina, eravacyklina, omadacyklina). **Fluorochinolony** (cyprofloksacyna, lewofloksacyna, moksyfloksacyna, delafloksacyna — tendinopatie, QTc). **Sulfonamidy + TMP** (kotrimoksazol). **Glikopeptydy** (wankomycyna, teikoplanina, dalbawancyna, telawancyna, oritawancyna). **Oksazolidynony** (linezolid, tedizolid). **Lipopeptyd** (daptomycyna). **Streptograminy** (kwinupristyna/dalfopristyna). **Nitromidazole** (metronidazol, tynidazol, ornidazol). **Nitrofurany** (nitrofurantoina, furazydyna). **Fosfomycyna**. **Polimyksyny** (kolistyna). **Ryfamycyny** (ryfampicyna, ryfaksymina, ryfabutyna). **Mupirocyna**, **kwas fusydowy**. **Przeciwprątkowe** (izoniazyd, ryfampicyna, pirazynamid, etambutol, streptomycyna; bedakwilina, pretomanid, delamanid). **Trąd** (dapson, klofazimina). **Środki odkażające/antyseptyki:** chlorheksydyna, jod (PVP-I), nadtlenek wodoru, octanidyna, alkohole, podchloryn sodu.

**Subtematy:** `Penicyliny`, `Cefalosporyny`, `Karbapenemy`, `Aminoglikozydy`, `Makrolidy`, `Klindamycyna`, `Tetracykliny`, `Fluorochinolony`, `Kotrimoksazol`, `Wankomycyna`, `Linezolid`, `Metronidazol`, `Tuberkulostatyki`, `Antyseptyki w stomatologii`, `Mechanizmy oporności`.

### FARM-14 — Przeciwwirusowe, grzybicze, pasożytnicze + medycyna podróży
**Przeciwwirusowe — Herpes:** acyklowir, walacyklowir, pencyklowir, gancyklowir, walgancyklowir, foskarnet, cidofowir. **HIV (HAART):** NRTI (zidowudyna, tenofowir, emtrycytabina, abakawir, lamiwudyna), NNRTI (efawirenz, rilpiwiryna, doravyryna), PI (atazanawir, darunawir, lopinawir/rytonawir), INSTI (raltegrawir, dolutegrawir, biktegrawir, kabotegrawir), inhibitory wejścia (marawirok, enfuwirtyd, fostemsawir, ibalizumab). **WZW B/C:** entekawir, tenofowir; DAA HCV (sofosbuwir, ledipaswir, welpataswir, glekaprewir/pibrentaswir). **Grypa:** oseltamiwir, zanamiwir, baloksawir, peramiwir. **COVID-19:** remdesiwir, paksloid (nirmatrelwir/rytonawir), molnupirawir. **RSV:** rybawiryna, palivizumab, nirsewimab. **Przeciwgrzybicze:** azole (flukonazol, itrakonazol, worykonazol, posakonazol, izawukonazol, ketokonazol — głównie miejscowo), polieny (amfoterycyna B — formy lipidowe, nystatyna), echinokandyny (kaspofungina, mikafungina, anidulafungina, rezafungina), terbinafina, gryzeofulwina, flucytozyna. Miejscowo: klotrimazol, mikonazol, ciklopiroks. **Przeciwpasożytnicze:** metronidazol/tynidazol (pierwotniaki — Giardia, Trichomonas, ameba), niklozamid, prazykwantel (tasiemce, przywry), albendazol, mebendazol, iwermektyna (nicienie, świerzb), pirantel; **malaria:** ACT (artemeter+lumefantryna, dihydroartemizyna+piperachina), chinina, chlorochina, hydroksychlorochina, meflochina, atowakwon+proguanil, prymachina, tafenochina, doksycyklina. **Medycyna podróży:** szczepienia (żółta gorączka, dur, WZW A/B, japońskie zapalenie mózgu, wścieklizna, cholera), profilaktyka malarii, biegunka podróżnych (azytromycyna, rifaksymina, loperamid + rehydratacja).

**Subtematy:** `Acyklowir i pochodne`, `HAART — NRTI`, `HAART — INSTI`, `Leki na grypę`, `Azole`, `Polieny`, `Echinokandyny`, `Terbinafina`, `Metronidazol w pasożytach`, `Albendazol`, `Iwermektyna`, `Profilaktyka malarii`, `Szczepienia podróżne`.

### FARM-15 — Układ pokarmowy
**Refluks/wrzody:** PPI (omeprazol, pantoprazol, esomeprazol, lansoprazol, rabeprazol, dexlansoprazol), H2-blokery (famotydyna, ranitydyna — wycofana w wielu krajach), leki zobojętniające (związki Al, Mg, wapnia), sukralfat, bizmut koloidalny, mizoprostol. **Eradykacja H. pylori:** schematy potrójne i poczwórne (PPI + amoksycylina + klarytromycyna; PPI + bizmut + tetracyklina + metronidazol; wankomycyna/lewofloksacyna — schematy ratunkowe). **Przeczyszczające:** osmotyczne (laktuloza, makrogol, sól glauberska), drażniące/stymulujące (bisakodyl, senes, picosiarczan sodu), zmiękczające (dokuzan sodu, parafina ciekła), masowe (otręby, metyloceluloza, plantago), selektywne agoniści 5-HT4 (prukalopryd), aktywatory CFTR (lubiproston), agoniści cyklazy guanylanowej (linaklotyd, plekanatyd), antagoniści opioidowych µ obwodowych (metylnaltrekson, naloksegol). **Przeciwbiegunkowe:** loperamid, difenoksylat, octreotyd, kaolin, smektyt, racekadotryl. **Przeciwwymiotne:** antagoniści 5-HT3 (ondansetron, granisetron, palonosetron), antagoniści D2 (metoklopramid, domperidon — QTc), antagoniści NK1 (aprepitant, fosaprepitant, rolapitant), antyhistaminowe (prometazyna, cyklizyna), antymuskarynowe (skopolamina), kannabinoidy (dronabinol, nabilon), olanzapina off-label. **IBD:** mesalazyna (5-ASA), sulfasalazyna, GKS (budesonid, prednizon), tiopuryny (azatiopryna, 6-MP), metotreksat, biologiczne (anty-TNF: infliksymab, adalimumab, certolizumab, golimumab; wedolizumab — anty-α4β7; ustekinumab — IL-12/23; risankizumab — IL-23; rizatryptan; ozanimod, etrasimod — S1P; tofacitinib, upadacitinib — JAK). **Wątroba:** UDCA, kwas obetycholowy, laktuloza w encefalopatii, ryfaksymina, N-acetylocysteina w zatruciu paracetamolem. **Trzustka:** preparaty enzymatyczne (Kreon).

**Subtematy:** `PPI`, `H2-blokery`, `Eradykacja H. pylori`, `Leki przeciwbiegunkowe`, `Loperamid`, `Setrony przeciwwymiotne`, `Metoklopramid`, `Aprepitant`, `Mesalazyna`, `Biologiczne w IBD`, `Sulfasalazyna`, `Enzymy trzustkowe`.

### FARM-16 — Hormony
**Podwzgórze/przysadka:** GnRH-agoniści (leuprorelina, goserelina, tryptorelina), antagoniści GnRH (degareliks, ganireliks, cetroreliks), GH (somatropina), antagonista receptora GH (pegwisomant), oktreotyd, lanreotyd, pazyreotyd (somatostatyna), kabergolina, bromokryptyna (agoniści D2 — prolaktynoma, akromegalia), desmopresyna (analog ADV), wazopresyna, tolwaptan, koniwaptan. **Tarczyca:** lewotyroksyna, liotyronina, tireostatyki (tiamazol/metimazol, propylotiouracyl), jod radioaktywny (¹³¹I), jodek potasu. **Kora nadnerczy:** glikokortykosteroidy (hydrokortyzon, prednizon, prednizolon, metyloprednizolon, deksametazon, betametazon, triamcynolon, budesonid) — działania niepożądane (osteoporoza, hiperglikemia, jaskra, immunosupresja, supresja osi HPA), mineralokortykoidy (fludrokortyzon), antagoniści (spironolakton, eplerenon, mifepriston, ketokonazol, metyrapon, ozylodrostat). **Hormony płciowe:** estrogeny (etynyloestradiol, walerianian estradiolu), progestageny (lewonorgestrel, dezogestrel, drospirenon, dienogest, medroxyprogesteron, octan octanu, octan ulipristalu — antyprogesterowy), antyestrogeny (klomifen, tamoksyfen, fulwestrant, raloksyfen — SERM), inhibitory aromatazy (anastrozol, letrozol, eksemestan), androgeny (testosteron), antyandrogeny (flutamid, bikalutamid, enzalutamid, apalutamid, cyproteron, finasteryd, dutasteryd — 5α-reduktaza), antykoncepcja hormonalna (COC, mini-pill, plastry, krążki, implanty, IUD-LNG, antykoncepcja awaryjna — lewonorgestrel, octan ulipristalu).

**Subtematy:** `Analogi GnRH`, `Hormony tarczycy`, `Tireostatyki`, `Glikokortykosteroidy`, `Mineralokortykoidy`, `Antagoniści MR`, `Estrogeny`, `Progestageny`, `SERM`, `Inhibitory aromatazy`, `Antyandrogeny`, `Antykoncepcja hormonalna`, `Desmopresyna`.

### FARM-17 — Wapń, węglowodany, otyłość
**Osteoporoza/metabolizm wapnia:** bisfosfoniany (alendronian, ryzedronian, ibandronian, zoledronian, pamidronian — MRONJ w stomatologii!), denosumab (anty-RANKL — MRONJ), teryparatyd, abaloparatyd (analogi PTH), romosozumab (anty-sklerostyna), raloksyfen, kalcytonina (łosośiowa), preparaty wapnia, witamina D, kalcymimetyki (cynakalcet, etelkalcetid), tabletki fosforanowe (sewelamer, węglan lantanu). **Cukrzyca:** insulina (krótko: aspart, lispro, glulizyna; szybka: humulina R; pośrednia: NPH; długodziałająca: glargina, detemir, degludec; bardzo szybka: faster aspart), metformina (1. linia), sulfonylomoczniki (glipizyd, glimepiryd, gliklazyd, glibenklamid), meglitynidy (repaglinid, nateglinid), pioglitazon (TZD), inhibitory α-glukozydazy (akarboza, miglitol), inhibitory DPP-4 (sitagliptyna, linagliptyna, saksagliptyna, alogliptyna, wildagliptyna), agoniści GLP-1 (liraglutyd, semaglutyd, dulaglutyd, eksenatyd, liksysenatyd, tirzepatyd — dualny GIP/GLP-1, retatrutyd), SGLT2-inhibitory (dapagliflozyna, empagliflozyna, kanagliflozyna, ertugliflozyna). Glukagon (hipoglikemia). **Otyłość:** orlistat (inhibitor lipazy), liraglutyd 3 mg, semaglutyd 2.4 mg, tirzepatyd, naltrekson + bupropion, fentermina (USA), setmelanotyd (MC4R-agonista — rzadkie zespoły genetyczne).

**Subtematy:** `Bisfosfoniany`, `MRONJ w stomatologii`, `Denosumab`, `Teryparatyd`, `Insuliny`, `Metformina`, `Sulfonylomoczniki`, `Inhibitory DPP-4`, `Agoniści GLP-1`, `SGLT2-inhibitory`, `Semaglutyd w otyłości`, `Orlistat`.

---

## 4. Co jest szczególnie istotne dla **stomatologa**

Bot powinien preferować pytania o wątku stomatologicznym tam, gdzie to ma sens:

| Temat | Wątek stomatologiczny |
|-------|------------------------|
| FARM-01 | CYP450 a interakcje z analgetykami i antybiotykami; biodostępność po podaniu doustnym vs. iniekcji do tkanek miękkich |
| FARM-02 | Leki przeciwhistaminowe przed zabiegiem; serotonina w napięciu mięśni żucia |
| FARM-03 | NLPZ vs. paracetamol w bólu po ekstrakcji; opioidy w bólu po zabiegach; ASA — krwawienie po ekstrakcji |
| FARM-04 | Atropina i adrenalina (dodatek do LA), antycholinergiczne — kserostomia |
| FARM-05 | DOAC/warfaryna — postępowanie okołozabiegowe; krwawienie poekstrakcyjne; **kwas traneksamowy miejscowo** |
| FARM-06 | Diuretyki — kserostomia; ACEI — obrzęk naczynioruchowy |
| FARM-07 | Statyny — interakcje, mialgie; β-blokery + adrenalina w LA (ostrożność) |
| FARM-08 | Kserostomia od TLPD/SSRI; benzodiazepiny — premedykacja anksjolityczna |
| FARM-09 | **Główny rozdział praktyczny:** artikaina, lidokaina, dawki maksymalne, adrenalina (1:100 000, 1:200 000), N₂O w sedacji |
| FARM-10 | Fenytoina — przerost dziąseł; karbamazepina — neuralgia n. V; lewodopa — interakcje |
| FARM-11 | Fluor w profilaktyce próchnicy; witamina D + Ca; B12 — owrzodzenia aftowe |
| FARM-12 | Astma — premedykacja, ostrożność z ASA; inhalatory a kserostomia |
| FARM-13 | **Profilaktyka antybiotykowa endocarditis** (amoksycylina, klindamycyna w uczuleniu); metronidazol w infekcjach beztlenowych; chlorheksydyna w stomatologii |
| FARM-14 | Acyklowir w opryszczce wargowej i HSV-1; flukonazol/nystatyna w kandydozie jamy ustnej |
| FARM-15 | PPI i kserostomia; metoklopramid + EPS |
| FARM-16 | **GKS — supresja osi HPA, postępowanie przy stresie chirurgicznym, MRONJ z bisfosfonianami** (ale to FARM-17) |
| FARM-17 | **MRONJ — bisfosfoniany, denosumab — kluczowe dla stomatologa!**; semaglutyd a opóźnione opróżnianie żołądka (NPO przed sedacją) |

---

## 5. SZABLON SQL — kompletny batch (do skopiowania)

```sql
-- ============================================================
-- BATCH: e_farm_2026/1  ·  stoma-farmakologia
-- Topic:  FARM-09 (Znieczulenie miejscowe)
-- Author: Claude                Date: 2026-05-19
-- Źródło: Materiały kursu / kolokwium 2025
-- ============================================================

INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   difficulty, subtheme_label, batch_label)
VALUES

('farm-09-001', 'FARM-09',
 'Maksymalna dawka artikainy 4% z adrenaliną 1:100 000 u dorosłego o masie 70 kg wynosi orientacyjnie:',
 '[
   {"id":"a","text":"Około 100 mg (1 ampułka 1,7 ml)"},
   {"id":"b","text":"Około 250 mg (3,5 ampułki 1,7 ml)"},
   {"id":"c","text":"Około 500 mg (7 ampułek 1,7 ml)"},
   {"id":"d","text":"Około 1000 mg (14 ampułek)"},
   {"id":"e","text":"Dawka nie jest ograniczona, dopóki pacjent toleruje znieczulenie"}
 ]'::jsonb,
 'c',
 'Maksymalna dawka artikainy u zdrowego dorosłego wynosi około 7 mg/kg masy ciała, co dla pacjenta 70 kg daje ok. 490 mg. Ampułka 1,7 ml artikainy 4% zawiera 68 mg substancji czynnej, więc bezpieczna granica to ok. 7 ampułek. Przekroczenie dawki maksymalnej grozi neurotoksycznością i kardiotoksycznością (chociaż artikaina jest bezpieczniejsza od bupiwakainy). Adrenalina 1:100 000 wydłuża działanie i zmniejsza wchłanianie ogólnoustrojowe.',
 'srednie',
 'Artikaina',
 'e_farm_2026/1'),

('farm-09-002', 'FARM-09',
 'Który z poniższych anestetyków miejscowych NIE jest amidem?',
 '[
   {"id":"a","text":"Lidokaina"},
   {"id":"b","text":"Artikaina"},
   {"id":"c","text":"Bupiwakaina"},
   {"id":"d","text":"Prokaina"},
   {"id":"e","text":"Mepiwakaina"}
 ]'::jsonb,
 'd',
 'Prokaina jest estrem kwasu para-aminobenzoesowego (PABA) — należy do starszej grupy anestetyków estrowych, które są szybciej metabolizowane przez esterazy osoczowe i częściej wywołują reakcje alergiczne (PABA jako hapten). Lidokaina, artikaina, bupiwakaina i mepiwakaina to amidy metabolizowane głównie w wątrobie przez CYP — reakcje alergiczne są bardzo rzadkie. Reguła pamięciowa: amidy mają „i" przed „-kaina" (lid-i-kaina, but-i-wakaina).',
 'latwe',
 'Znieczulenie miejscowe — estry',
 'e_farm_2026/1');

-- OSTATNI rekord w VALUES kończy się );  — nie przecinkiem!

-- ============================================================
-- PO WSZYSTKICH INSERTACH — przelicz licznik na topiku
-- ============================================================

UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*) AS cnt
      FROM public.questions
     WHERE topic_id = 'FARM-09' AND is_active = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;
```

---

## 6. Reguły merytoryczne (specyficzne dla farmakologii)

1. **Międzynarodowe nazwy substancji czynnych** (INN), nie nazwy handlowe (zamiast „Aspiryna" → „kwas acetylosalicylowy", zamiast „Adipina" → „lewodopa + benserazyd"). Wyjątek: szczegółowo wskazane preparaty w kontekście klinicznym.
2. **Klasyfikacje używaj precyzyjnie**: „NLPZ" ≠ „paracetamol"; „opioid silny" ≠ „tramadol"; „β-bloker selektywny" ≠ „karwedilol" (ten jest α+β).
3. **Mechanizm działania w `explanation`** — zawsze podaj: receptor/enzym, kierunek (agonista/antagonista, inhibitor/induktor), efekt komórkowy, efekt kliniczny.
4. **Dawki maksymalne / typowe** — podawaj orientacyjnie z odniesieniem do masy ciała (np. „7 mg/kg") lub w mg z zaznaczeniem standardowego dorosłego. Unikaj fałszywej precyzji typu „dokładnie 423 mg".
5. **Działania niepożądane** — wyróżniaj typowe (częste) vs. ciężkie (rzadkie ale klinicznie istotne, np. agranulocytoza przy klozapinie, MRONJ przy bisfosfonianach).
6. **Interakcje** — zawsze wskaż mechanizm (CYP3A4-inhibitor, P-gp, farmakodynamiczne addytywne).
7. **Wątek stomatologiczny** — gdy jest naturalny, podkreśl go w wyjaśnieniu (kserostomia, MRONJ, krwawienie poekstrakcyjne, premedykacja, znieczulenie miejscowe).
8. **Bez emoji, bez tabel markdown w `explanation`** — czysty tekst, można pogrubienia `**` oraz listy z myślnikiem.

---

## 7. Checklist dla bota — przed wysłaniem batcha

- [ ] Każde `id` unikalne, wzorzec `farm-{NN}-{NNN}`, NN zgodne z `topic_id`
- [ ] `topic_id` ∈ FARM-01 … FARM-17
- [ ] 5 opcji `a`–`e` w stałej kolejności w JSONB
- [ ] `correct_option_id` matchuje istniejący `id` opcji
- [ ] `text` i `explanation` po polsku, polskie znaki zachowane
- [ ] Apostrofy podwojone (`''`)
- [ ] `difficulty` ∈ `latwe` \| `srednie` \| `trudne`
- [ ] `theme_label` = `NULL` (dla farmakologii)
- [ ] `subtheme_label` z listy w sekcji 3 albo `NULL`
- [ ] `batch_label` w formacie `e_farm_<rok>/<nr>` albo `NULL`
- [ ] Ostatni `VALUES` kończy się `);`
- [ ] Na końcu batcha `UPDATE public.topics ... question_count`

---

## 8. Prompt-system dla Claude'a (gotowy do wklejenia)

> Jesteś asystentem przygotowującym pytania farmakologii do bazy Supabase w aplikacji „Kurs na LDEK". Twoim wyjściem jest **wyłącznie blok SQL** zgodny ze schematem z pliku `FormatPisaniaPytan-Farmakologia.md`. Dla każdego batcha:
>
> 1. Wybierz `topic_id` z listy FARM-01 … FARM-17 na podstawie zakresu materiału wejściowego (lista w sekcji 3).
> 2. Numerację pytań kontynuuj od ostatniego `id` w danym `topic_id` (lub od 001).
> 3. Trzymaj 5 opcji `a`–`e` w stałej kolejności w JSONB.
> 4. `correct_option_id` to jedna z liter `a`–`e`.
> 5. `explanation`: 2–6 zdań, mechanizm + dlaczego dystraktory są błędne, w razie potrzeby wątek stomatologiczny.
> 6. `difficulty` dobierz adekwatnie (`latwe` — definicja/fakt, `srednie` — mechanizm/zastosowanie, `trudne` — przypadek kliniczny/integracja wiedzy).
> 7. `subtheme_label` wybierz z listy podtematów dla danego `topic_id` (sekcja 3 dokumentu) lub zostaw `NULL`.
> 8. `theme_label` zawsze `NULL`. `batch_label` zgodnie z poleceniem użytkownika.
> 9. Po wszystkich `INSERT`-ach dodaj `UPDATE public.topics ... question_count` dla wszystkich dotkniętych `topic_id`.
> 10. Nie generuj komentarzy poza nagłówkiem batcha. Output musi być gotowy do wklejenia w Supabase SQL Editor i kliknięcia „Run".

---

## 9. Stan obecny w bazie (snapshot 2026-05-19)

- `stoma-farmakologia` istnieje, `display_order = 13`, jedyny przedmiot roku 3.
- Wszystkie 17 tematów `FARM-01 … FARM-17` zaseedowane, `question_count = 0`.
- Żadnych pytań w bazie — pierwszy batch nadpisze `question_count`.
- W UI karta „Farmakologia" jest na razie pusta (`topic_count > 0`, ale brak pytań → sesja się nie uruchomi do pierwszego batcha).
