-- Histologia: snapshot pytań z placeholderami "Brak w PDF" / "brak danych w PDF"
-- Wygenerowano: 2026-06-19T19:58:10.635Z
-- Pytań: 47 | Placeholderów w opcjach: 57
-- Cel: rollback / kontekst przed podmianą distraktorów.
-- JSON handover: exports/histologia-brak-w-pdf-handover.json
-- UWAGA: correct_option_id zostaw bez zmian — podmieniaj tylko teksty opcji z placeholderami.

BEGIN;

-- HIST-01-008 | HIST-01 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-653
UPDATE public.questions
   SET text = 'Reakcja immunohistochemiczna polega przede wszystkim na:',
       options = '[{"id":"a","text":"Wykrywaniu obecności i lokalizacji antygenów w tkance"},{"id":"b","text":"Wykrywaniu DNA genowego"},{"id":"c","text":"Hybrydyzacji mRNA"},{"id":"d","text":"Detekcji aktywności enzymów"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **IHC (immunohistochemia)** = wykrywanie **obecności i lokalizacji antygenów** (białek, glikoprotein) w tkankach utrwalonych za pomocą **specyficznych przeciwciał** (monoklonalnych lub poliklonalnych) + chromogen (DAB, brąz) lub fluorescencja (IHF). Techniki: bezpośrednia (Ab-chromogen); pośrednia (primary + secondary Ab + amplifikacja przez streptawidyna-biotyna lub polimery). Klinicznie: IHC kluczowa w patologii nowotworowej (CD20 = B-cell lymphoma;

CD3 = T-cell;

TTF-1 = płuco/tarczyca;

ER/PR/HER2 = rak piersi;

PSA = prostata; chromogranina = neuroendokrynne;

S100 = melanocyt).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-653',
       is_active = true
 WHERE id = 'HIST-01-008';

-- HIST-02-009 | HIST-02 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-854
UPDATE public.questions
   SET text = 'Triada Gregga dotyczy:',
       options = '[{"id":"a","text":"głuchoty"},{"id":"b","text":"zaćmy"},{"id":"c","text":"wady serca"},{"id":"d","text":"różyczki"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Triada Gregga** to klasyczne **trzy objawy WRODZONEGO ZESPOŁU RÓŻYCZKI** (CRS): ( 1) **wady serca** — PDA, zwężenie tętnicy płucnej, VSD/ASD; ( 2) **zaćma wrodzona** — obustronna, gęste zmętnienie soczewki; też retinopatia „sól i pieprz", mikroftalmia; ( 3) **głuchota czuciowo-nerwowa** — uszkodzenie ślimaka i narządu Cortiego. Klucz D — triada Gregga **DOTYCZY RÓŻYCZKI** (zakażenie wirusem Rubella w I trymestrze). Opisana przez **Normana Gregga** (Australia, 1941) — pierwszy dowód teratogenności zakażenia wirusowego. Im wcześniejsze zakażenie, tym poważniejsze wady (do 8. tygodnia = organogeneza). Inne objawy CRS: mikrocefalia, plamica (blueberry muffin), IUGR. Profilaktyka: szczepienie MMR. Klucz: D.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-854',
       is_active = true
 WHERE id = 'HIST-02-009';

-- HIST-02-012 | HIST-02 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-857
UPDATE public.questions
   SET text = 'W stadium moruli znajduje / znajdują się:',
       options = '[{"id":"a","text":"2 blastomery"},{"id":"b","text":"4 blastomery"},{"id":"c","text":"7–8 blastomerów"},{"id":"d","text":"12–16 blastomerów"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**MORULA** (łac. morum = jeżyna) — 3.– 4. doba po zapłodnieniu, **12–32 blastomery** (typowo **12–16** — klucz D). Sekwencja: zygota → 2 komórki (~30 godz.) → 4 → 8 (kompakcja, E-kadheryny, polarność wewn./zewn.) → **MORULA** (12–16 blastomerów) → wchodzi do macicy. Blastomery wewnętrzne → **EMBRIOBLAST/ICM** → zarodek + amnion; zewnętrzne → **TROFOBLAST** → łożysko. (4.– 5. doba): kawitacja → **BLASTOCYSTA** z jamą blastocelu. (6.– 7. doba): implantacja w endometrium. **Gastrula** — III tydzień: gastrulacja, 3 listki zarodkowe. Klucz: D.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-857',
       is_active = true
 WHERE id = 'HIST-02-012';

-- HIST-03-015 | HIST-03 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-633
UPDATE public.questions
   SET text = 'Typ sygnalizacji w przypadku angiotensyny II:',
       options = '[{"id":"a","text":"Z białkiem G (GPCR AT1R, Gq)"},{"id":"b","text":"Z innymi białkami (RTK)"},{"id":"c","text":"Z kompleksem (receptory jądrowe)"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — angiotensyna II działa przez **receptor AT1R (GPCR, Gq)** → PLC → IP3 + DAG → Ca²⁺ + PKC → wazokonstrukcja + aldosteron. AT2R (Gq/Gi) — efekty przeciwne (wazodilatacja, antyproliferacja). Synteza: angiotensynogen (wątroba) → renina (JG nerki) → angiotensyna I → **ACE** (płuca) → **angiotensyna II**. Klinicznie: **ACE-inhibitory** (lisinopril, enalapril) + **ARB** (losartan, walsartan) → blokada układu RAA → ↓BP + nefroprotekcja + ↓HF; kandesartan/olmesartan dla AT1R.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-633',
       is_active = true
 WHERE id = 'HIST-03-015';

-- HIST-03-021 | HIST-03 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-666
UPDATE public.questions
   SET text = 'Co zawiera kwasne hydrolazy:',
       options = '[{"id":"a","text":"Lizosomy"},{"id":"b","text":"Mitochondria"},{"id":"c","text":"Peroksysomy"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — powtórka Q510 e2020-1. **Lizosomy** = kwaśne hydrolazy (>60 typów: katepsyny B/D/L, glikozydazy, lipazy, sulfatazy, nukleazy; optimum pH ~5.0 utrzymywane przez V-ATPazę). Peroksysomy = katalaza + oksydazy (H₂O₂); mitochondria = oksydoreduktazy oddechowe. Klinicznie: LSD (lizosomalne choroby spichrzeniowe): Gaucher (β-glukocerebrozydaza), Fabry (α-galaktozydaza A), Tay-Sachs (heksozaminidaza A), Niemann-Pick (sfingomielinaza), Pompe (α-glukozyda); leczenie ERT;

HSCT w niektórych.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-666',
       is_active = true
 WHERE id = 'HIST-03-021';

-- HIST-03-035 | HIST-03 | klucz: c
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-861
UPDATE public.questions
   SET text = 'Co jest łączone w splicingu alternatywnym?',
       options = '[{"id":"a","text":"ogon poli-A"},{"id":"b","text":"czapeczka"},{"id":"c","text":"eksony"},{"id":"d","text":"introny"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**SPLICING** — wycinanie intronów i **ŁĄCZENIE EKSONÓW** w dojrzałe mRNA. Wykonywany przez **SPLICEOSOM** — kompleks snRNP (U1, U2, U4, U5, U6) + ~200 białek. Mechanizm: rozpoznanie 5'' splice site (GT) i 3'' splice site (AG) → wycięcie intronu jako **lariat (lasso)** → ligacja eksonów. **SPLICING ALTERNATYWNY** — z jednego pre-mRNA powstają różne mRNA przez **różne sposoby ŁĄCZENIA EKSONÓW** (klucz C): pomijanie eksonów (exon skipping), alternatywne miejsca splicingu, retencja intronu, eksony wzajemnie wykluczające się. Znaczenie: ~95% genów ludzkich ma splicing alternatywny → z ~20 000 genów → ~100 000+ białek. Klasyk: tropomiozyna, CD45. **Ogon poli-A** ( A) i **czapeczka 7-MeG** ( B) — inne procesy obróbki pre-mRNA (poliadenylacja, capping). Klucz: C.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-861',
       is_active = true
 WHERE id = 'HIST-03-035';

-- HIST-03-037 | HIST-03 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-863
UPDATE public.questions
   SET text = 'Wybierz zdanie prawidłowe o cyklinach:',
       options = '[{"id":"a","text":"są to białka łączące się z kinazami"},{"id":"b","text":"hamują procesy cyklu komórkowego"},{"id":"c","text":"biorą udział w regulacji cyklu komórkowego"},{"id":"d","text":"A i C"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**CYKLINY** — białka regulatorowe cyklu komórkowego: ( A) **ŁĄCZĄ SIĘ Z CDK (cyclin-dependent kinases)** — cyklina = podjednostka regulatorowa, CDK = katalityczna (ser/thr kinaza). Cyklina aktywuje CDK (zmiana konformacji) → fosforylacja substratów (Rb, laminy, histon H1). POPRAWNE. ( C) **REGULUJĄ CYKL KOMÓRKOWY** — cykliczne narastanie i degradacja (D→E→A→ B) napędza progresję G1→S→G2→M. POPRAWNE. ( B) **HAMUJĄ PROCESY CYKLU** — BŁĄD: cykliny **NAPĘDZAJĄ** cykl. Hamowanie — **CKI (CDK inhibitors)**: INK4 (p15, p16 — hamują CDK4/6-cyklina D), CIP/KIP (**p21** indukowane przez p53 → zatrzymanie G1/S przy uszkodzeniu DNA, **p27, p57**). Degradacja cyklin przez ubikwitynację: SCF (dla G1/S cyklin), APC/C (dla cykliny B w M). Klucz: D (A i C).',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-863',
       is_active = true
 WHERE id = 'HIST-03-037';

-- HIST-05-024 | HIST-05 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-634
UPDATE public.questions
   SET text = 'Powięzie, rozcięgna i twardówka gałki ocznej zbudowane są z:',
       options = '[{"id":"a","text":"Tkanki łącznej zbitej o utkaniu nieregularnym"},{"id":"b","text":"Tkanki łącznej luźnej"},{"id":"c","text":"Chrząstki sprężystej"},{"id":"d","text":"Chrząstki włóknistej"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — powtórka Q549 e2020-1. **Tkanka łączna zbita nieregularna**: włókna kolagenu I w różnych kierunkach → wielokierunkowa wytrzymałość; twardówka (ochronna torba oka), skóra właściwa (warstwa siateczkowata), torebki narządów. Powięzie i rozcięgna — autor przyjął NIEREGULARNA (wielowarstwowe z krzyżującymi się włóknami jako całość). Klinicznie: compartment syndrome → fasciotomia;

Dupuytren (palmar aponeurosis); plantar fasciitis; scleritis (autoimmun — RA, GPA).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-634',
       is_active = true
 WHERE id = 'HIST-05-024';

-- HIST-05-025 | HIST-05 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-640
UPDATE public.questions
   SET text = 'Buduje błonę śluzową i podśluzową układu oddechowego i pokarmowego, buduje błonę surowiczą:',
       options = '[{"id":"a","text":"Tkanka łączna wiotka (luźna)"},{"id":"b","text":"Tkanka łączna zwarta"},{"id":"c","text":"Tkanka chrzęstna"},{"id":"d","text":"Tkanka kostna"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **tkanka łączna wiotka (luźna, areolar)** buduje: blaszki właściwe błon śluzowych (pokarmowy, oddechowy, moczowo-płciowy), **błonę podśluzową** (tela submucosa), **błony surowicze** (pleura, otrzewna, osierdzie — pod mezotelium), otoczenie naczyń i nerwów, krezka. Cecha: dużo komórek (fibroblasty, makrofagi, mastocyty, adipocyty) + obfita substancja podstawowa (żel HA+GAG) + luźna sieć kolagenu I/III. Powtórka Q493 e2020-1.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-640',
       is_active = true
 WHERE id = 'HIST-05-025';

-- HIST-09-036 | HIST-09 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 1 / HISLEK-e2019-1-606
UPDATE public.questions
   SET text = 'Komórki mikrogleju:',
       options = '[{"id":"a","text":"Mają zdolność do fagocytozy"},{"id":"b","text":"Brak odpowiedzi"},{"id":"c","text":"Są składnikiem splotu naczyniowego"},{"id":"d","text":"Pochodzą z ektodermy"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — mikroglej = **rezydentny makrofag OUN**; zdolność do **fagocytozy** (patogeny, płytki amyloidowe, martwe neurony, debrisy mielinowe). Pochodzenie: **MEZODERMALNE** (progenitory mieloidalne z pęcherzyka żółtkowego → OUN ~8 tydz. ciąży, populacja samowyodnawiająca się). Markery: IBA1, CD68, CD11b, P2RY12, TMEM119. Funkcje: fagocytoza + APC (MHC II) + cytokiny (M1: TNF, IL-1, IL-6;

M2: IL-10, TGF-β) + synaptic pruning. **C FAŁSZ**: splot naczyniowy = komórki ependymopodobne (neuroektoderma) → CSF; **D FAŁSZ**: nie z ektodermy — z mezodermy/żółtkowca.

Klinicznie: Alzheimer (TREM2 receptor, ↓klierens amyloidu w dysregulowanym mikroglieniu);

Parkinson (α-synuklein + TNF);

HIV-HAND (HIV infekuje mikroglej, CD4+CCR5+); gitterzellen = mikroglej z fagocytowaną mieliną (udar, MS).',
       source_exam = 'LDEK 2019 sesja 1',
       source_code = 'HISLEK-e2019-1-606',
       is_active = true
 WHERE id = 'HIST-09-036';

-- HIST-10-027 | HIST-10 | klucz: c
-- placeholder: d="brak danych w PDF", e="brak danych w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-828
UPDATE public.questions
   SET text = 'Co wchodzi w skład triady?',
       options = '[{"id":"a","text":"2 kanaliki T i 1 cysterna brzeżna"},{"id":"b","text":"komórki satelitarne, kanalik T i cysterna brzeżna"},{"id":"c","text":"1 kanalik T i 2 cysterny brzeżne"},{"id":"d","text":"brak danych w PDF"},{"id":"e","text":"brak danych w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**TRIADA mięśnia szkieletowego** — klasyczna struktura sprzężenia elektromechanicznego zlokalizowana na pograniczu **prążka A i I** (granica disku A/I): ( 1) **JEDEN KANALIK T** — wpuklenie sarkolemy biegnące poprzecznie, propaguje depolaryzację do wnętrza włókna; ( 2) **DWIE CYSTERNY BRZEŻNE** — poszerzenia siateczki sarkoplazmatycznej po obu stronach kanalika T, magazynują **Ca²⁺** (z kalsekwestryną). Mechanizm: depolaryzacja → kanalik T → **DHPR** → **RyR1** w cysternie → wyrzut Ca²⁺ → skurcz. W **mięśniu sercowym**: **DIADA** (1 kanalik T + 1 cysterna), kanaliki T na poziomie linii Z. Klucz: C. Opcje D i E „brak danych w PDF" — autor nie podał dalszych odpowiedzi.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-828',
       is_active = true
 WHERE id = 'HIST-10-027';

-- HIST-11-030 | HIST-11 | klucz: b
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-678
UPDATE public.questions
   SET text = 'Z jakiej tkanki zbudowany jest szkielet serca?',
       options = '[{"id":"a","text":"Tkanka łączna wiotka"},{"id":"b","text":"Tkanka łączna zbita o utkaniu nieregularnym"},{"id":"c","text":"Tkanka siateczkowa"},{"id":"d","text":"Mięśniówka"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'b',
       explanation = '**Klucz B** — szkielet włóknisty serca = **tkanka łączna zbita nieregularna** (kolagen I + elastyna). Składniki: 4 pierścienie włókniste zastawek (anuli fibrosi) + 2 trójkąty włókniste + przegroda błoniasta (pars membranacea). Funkcje: przyczepiają zastawki, izolacja elektryczna przedsionki-komory (sygnał tylko przez węzeł AV + pęczek Hisa). Powtórka Q512 e2020-1. Klinicznie: kalcyfikacja szkieletu z wiekiem → bloki AV; chirurgia wymiany zastawek musi uwzględniać integralność pierścieni; fibrotyczny martwiak po MI (w sąsiedztwie, nie szkielet serca per se).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-678',
       is_active = true
 WHERE id = 'HIST-11-030';

-- HIST-11-032 | HIST-11 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-681
UPDATE public.questions
   SET text = 'Blaszka zewnętrzna (tunica adventitia) w żyłach zbudowana jest z:',
       options = '[{"id":"a","text":"Tkanki łącznej luźnej"},{"id":"b","text":"Tkanki łącznej zbitej"},{"id":"c","text":"Tkanki tłuszczowej"},{"id":"d","text":"Mięśnia gładkiego"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — powtórka Q609 e2019-1 + Q548 e2020-1. Tunica adventitia żył = **tkanka łączna luźna** (fibroblasty + kolagen I/III + nerwy autonomiczne); w żyłach DUŻYCH — liczne podłużne pęczki SMC (dominująca warstwa;

Q609).

Media żył = cieńsza niż tętnic.

Klinicznie: żylaki (CVI, niewydolność zastawek żylnych) → pończochy uciskowe, ablacja (RFA, EVLT);

DVT → DOAC (apixaban, rivaroxaban);

PE → heparyna → DOAC;

SVC syndrome (SCLC).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-681',
       is_active = true
 WHERE id = 'HIST-11-032';

-- HIST-11-033 | HIST-11 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-682
UPDATE public.questions
   SET text = 'Budowa tunica intima w naczyniach tętniczych:',
       options = '[{"id":"a","text":"Śródbłonek + tk. łączna wiotka podśródbłonkowa + blaszka sprężysta wewnętrzna"},{"id":"b","text":"Tylko śródbłonek"},{"id":"c","text":"Śródbłonek + SMC"},{"id":"d","text":"Tylko błona podstawna"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **tunica intima (błona wewnętrzna)** tętnic: **( 1) śródbłonek** (endothelium, komórki Weibel-Palade z P-selektyną + vWF); **( 2) tk. łączna podśródbłonkowa** (wiotka, fibroblasty + kolagen + GAG); **( 3) blaszka sprężysta wewnętrzna** (lamina elastica interna, wyraźna w tt. mięśniowych, "fenestrae" — okienka). Porównanie warstw: intima + media + adventitia. W tt. sprężystych lamina elastica interna słabiej widoczna (dużo błon okienkowatych w medii). Klinicznie: ateroskleroza (foam cells + plaque w intimie!); endarterektomia tętnicy szyjnej (endarterectomia — usunięcie intimy z blaszką); endothelin-1 z intimy w dysfunkcji śródbłonka.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-682',
       is_active = true
 WHERE id = 'HIST-11-033';

-- HIST-12-042 | HIST-12 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-707
UPDATE public.questions
   SET text = 'Gdzie wystepuje system kanalow otwartych i gestych (dense tubular system)?',
       options = '[{"id":"a","text":"Trombocyty (platki krwi)"},{"id":"b","text":"Megakariocyty"},{"id":"c","text":"Hepatocyty"},{"id":"d","text":"Podocyty"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **trombocyty (płytki krwi)** mają 2 systemy membranowe: **( 1) OCS (open canalicular system, kanały otwarte)** = inwaginacje błony plazmatycznej → sieć kanalików komunikujących z zewnętrzem → wydzielanie ziarnistości (droga egzocytozy); **( 2) DTS (dense tubular system, kanały gęste)** = zamknięty system śródplazmatyczny zbliżony do SER; magazyn Ca²⁺ (SERCA); synteza prostaglandyn (COX-1 tu!). OCS pochodzi z demarcation membrane system (DMS) megakariocytów. Klinicznie: aspiryna (iniehibicja COX-1 w DTS → ↓TXA2 → ↓agregacja płytek, nieodwracalne przez całe życie płytki ~10 dni);

HIT (heparyna + PF4 → IgG → tromboza; argatroban alternatywa);

ITP (anty-GPIIb/IIIa lub anty-GPIb Ab → splenektomia + rytuksymab + romiplostim/eltrombopag).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-707',
       is_active = true
 WHERE id = 'HIST-12-042';

-- HIST-12-043 | HIST-12 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-709
UPDATE public.questions
   SET text = 'Hialomer i granulomer sa elementami:',
       options = '[{"id":"a","text":"Trombocytow (plytek krwi)"},{"id":"b","text":"Erytrocytow"},{"id":"c","text":"Limfocytow"},{"id":"d","text":"Monocytow"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **trombocyty (płytki krwi)** w rozmazie: 2 strefy morfologiczne: **( 1) hialomer** = obwodowa, jasna, przezroczysta strefa; zawiera marginalny pierścień mikrotubul (utrzymanie kształtu dyskoidalnego) + filamenty aktynowe + spektryna (cytoszkielet płytek); **( 2) granulomer (chromomere)** = centralna, granularna strefa; zawiera ziarnistości α (fibryogen, vWF, PDGF, P-selektyna) + δ (ADP, Ca²⁺, serotonina) + λ (lizosomalne) + mitochondria + glikogen. Po aktywacji: kształt dysk → sferyczny z pseudopodiami; granulomer wypełnia całą komórkę. Klinicznie: ocena morfologii płytek w rozmazie (giant platelets = Bernard-Soulier, grey platelet syndrome = brak ziarnistości α;

Chediak-Higashi = gigantyczne ziarnistości).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-709',
       is_active = true
 WHERE id = 'HIST-12-043';

-- HIST-13-043 | HIST-13 | klucz: c
-- placeholder: d="Brak w PDF"
-- źródło: LDEK 2019 sesja 1 / HISLEK-e2019-1-604
UPDATE public.questions
   SET text = 'Fałszywe zdanie o komórkach plazmatycznych:',
       options = '[{"id":"a","text":"Najczęściej występują w błonie śluzowej układu pokarmowego"},{"id":"b","text":"Powstają z limfocytów B"},{"id":"c","text":"Wytwarzają heparynę i leukotrieny"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak poprawnych odpowiedzi"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Klucz C FAŁSZ** — plazmocyty NIE produkują heparyny ani leukotrienów → to **mastocyty + bazofile**. Plazmocyty produkują **immunoglobuliny (Ig, przeciwciała)**. **A PRAWDA**: najliczniejsze w lamina propria GALT/MALT (~80% to IgA-produkujące, sIgA) + sznury rdzenne węzłów + szpik (long-lived plasma cells). **B PRAWDA**: z aktywowanych B (naive → GC → plazmoblast → plazmocyt) po stymulacji Tfh (CD40L + IL-21). Struktura histologiczna: jądro ekscentryczne ("zegarowe"), hof perinuklearny (Golgi), cytoplazma bazofilna (rozbudowana RER → synteza Ig). Klinicznie: szpiczak mnogi (M-spike SPEP, CRAB, bortezomib + IMiDs + daratumumab, CAR-T); amyloidoza AL (łańcuchy lekkie); mastocytoza (D816V KIT mut., tryptaza+, CD117+).',
       source_exam = 'LDEK 2019 sesja 1',
       source_code = 'HISLEK-e2019-1-604',
       is_active = true
 WHERE id = 'HIST-13-043';

-- HIST-14-075 | HIST-14 | klucz: c
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 1 / HISLEK-e2019-1-615
UPDATE public.questions
   SET text = 'Przez co wydzielany jest IF (czynnik wewnętrzny Castle''a)?',
       options = '[{"id":"a","text":"Komórki jelita grubego"},{"id":"b","text":"Komórki jelita cienkiego"},{"id":"c","text":"Komórki żołądka — okładzinowe (parietal cells)"},{"id":"d","text":"Enterocyty dwunastnicy"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Klucz C** — **czynnik wewnętrzny Castle''a (IF)** produkują **komórki okładzinowe (parietal cells)** dna + trzonu żołądka (też produkują HCl). IF wiąże B12 po uwolnieniu z białek pokarmowych (HCl + pepsyna) → kompleks B12-IF chroniony → terminal ileum → receptor kubilinowy enterocytów → endocytoza → transkobalamina II do krwi. **A, B, D** = jelito tylko wchłania (receptory kubiliny w ileum), nie produkuje IF. Klinicznie: **pernicious anemia** (anty-IF ab + anty-parietal cells ab → atroficzne gastritis typ A → ↓IF → ↓B12 → niedokrwistość megaloblastyczna + SCD rdzenia kręgowego); B12 i.m. dożywotnio; gastrektomia/bypass bariatryczny → ↓parietal cells → ↓IF → suplementacja B12; metformina chronicznie → ↓absorpcja B12.',
       source_exam = 'LDEK 2019 sesja 1',
       source_code = 'HISLEK-e2019-1-615',
       is_active = true
 WHERE id = 'HIST-14-075';

-- HIST-14-078 | HIST-14 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-649
UPDATE public.questions
   SET text = 'Obkurczanie pęcherzyka żółciowego pobudza:',
       options = '[{"id":"a","text":"Cholecystokinina (CCK)"},{"id":"b","text":"Sekretyna"},{"id":"c","text":"Gastryna"},{"id":"d","text":"VIP"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **CCK (cholecystokinina)** z komórek I dwunastnicy (bodziec: tłuszcze + aa w dwunastnicy) → receptor CCK1-R na SMC pęcherzyka → **skurcz pęcherzyka** + relaksacja zwieracza Oddiego → wyrzut żółci do dwunastnicy; też aktywuje enzymy trzustki (CCK-A receptor na acini). Sekretyna → HCO₃⁻ trzustkowe + cholereza (wodnista żółć, NIE skurcz pęcherzyka). VIP → wazodylatacja + relaksacja SMC. Klinicznie: ERCP może wywołać skurcz sfinktera Oddiego → pancreatitis jatrogenowe; kamica żółciowa (4F) → cholecystitis (Murphy sign) → laparoskopowa cholecystektomia.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-649',
       is_active = true
 WHERE id = 'HIST-14-078';

-- HIST-14-081 | HIST-14 | klucz: c
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-668
UPDATE public.questions
   SET text = 'Nablonek pecherzyka zolciowego to:',
       options = '[{"id":"a","text":"Nablone jednowarstwowy plaski"},{"id":"b","text":"Nablone jednowarstwowy szescienny"},{"id":"c","text":"Nablone jednowarstwowy walcowaty"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Klucz C** — powtórka Q482/Q575 e2020-1. **Jednowarstwowy walcowaty** z mikrokosmkami apikalnymi → zagęszczanie żółci ~10× (NHE3 + Na/K-ATPaza + AQP1/8 → resorpcja wody). Brak muscularis mucosae + brak submucosy. Klinicznie: kamica (4F); cholecystitis acuta (Murphy sign);

ERCP (choledocholithiasis); ascending cholangitis (triada Charcota → pentada Reynoldsa = pilna ERCP); gallstone pancreatitis; porcelain gallbladder → ryzyko raka.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-668',
       is_active = true
 WHERE id = 'HIST-14-081';

-- HIST-14-082 | HIST-14 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-687
UPDATE public.questions
   SET text = 'Gdzie nie wystepuja faldy okrezne (plicae circulares)?',
       options = '[{"id":"a","text":"Dwunastnica"},{"id":"b","text":"Jelito czcze (jejunum)"},{"id":"c","text":"Jelito krete (ileum)"},{"id":"d","text":"Jelito grube (colon)"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Klucz D** — **jelito grube (colon)** NIE ma fałdów okrężnych (plicae circulares, zastawki Kerkringa, valvulae conniventes)! Jelito grube: brak kosmków + brak fałdów Kerkringa; głębsze krypty (crypts of Lieberkühn) + liczne komórki kubkowe + haustra (pofałdowania od taeniae coli) + appendices epiploicae. Fałdy okrężne: dystalna dwunastnica → maximum w jelicie czczym → stopniowo zanikają w krętym. Powtórka Q484 e2020-1. Klinicznie: choroba Leśniowskiego-Crohna vs UC (wrzodziejące zapalenie jelita grubego — tylko jelito grube + odbytnica); rak jelita grubego (polipektomia → leczenie CRC w stadium I-II;

FOLFOX/FOLFIRI + bevacizumab/cetuksymab w IV).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-687',
       is_active = true
 WHERE id = 'HIST-14-082';

-- HIST-15-044 | HIST-15 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-685
UPDATE public.questions
   SET text = 'Bariera krew-powietrze utworzona jest przez:',
       options = '[{"id":"a","text":"Surfaktant → pneumocyt I → bl. podstawna pneumocyta → bl. podstawna sródbłonka → sródbłonek kapilary"},{"id":"b","text":"Tylko pneumocyt I i sródbłonek"},{"id":"c","text":"Pneumocyt II i sródbłonek"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **bariera krew-powietrze (blood-air barrier)** od strony powietrza do krwi: ( 1) **surfaktant** (warstwa płynu + fosfolipidy na granicy powietrze/płyn); ( 2) **pneumocyt I** (cienki ~0.2 µm, AQP5); ( 3) **błona podstawna pneumocyta I** (zlewająca się z BM śródbłonka w najcieńszych miejscach); ( 4) **błona podstawna śródbłonka** (lub wspólna BM); ( 5) **śródbłonek kapilary** (ciągły, nieliczne pory). Łączna grubość ~0.5 µm → szybka dyfuzja O₂/CO₂ (prawo Ficka). Klinicznie: ARDS = DAD (diffuse alveolar damage) → zniszczenie pneumocytów I + II + śródbłonka → błony hialinowe + obrzęk → ↓DLCO; "berlin criteria" PaO₂/FiO₂ <300;

PEEP + prone position.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-685',
       is_active = true
 WHERE id = 'HIST-15-044';

-- HIST-15-047 | HIST-15 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-717
UPDATE public.questions
   SET text = 'Gdzie wystepuja gruczoły Bowmana?',
       options = '[{"id":"a","text":"Nablone wechowy / czesc wechowa jamy nosowej / blaszka wlasciwa nablonka wechowego"},{"id":"b","text":"Powieka"},{"id":"c","text":"Tarczyca"},{"id":"d","text":"Skora"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **gruczoły Bowmana (gl. olfactoriae)** = surowicze gruczoły w **blaszce właściwej nabłonka węchowego** jamy nosowej (regio olfactoria: sklepienie + górna przegroda + górna małżowina, ~2-5 cm²). Wydzielina: wodnista + OBP (odorant-binding proteins, lipocaliny) → **rozpuszcza odoranty** → docierają do rzęsek neuronów węchowych (OR receptory GPCR, ~400 funkcjonalnych u człowieka). Nabłonek węchowy: neurony węchowe (bipolarne!) + komórki podporne + komórki podstawne (regeneracja neuronów, RZADKA CECHA OUN!). Klinicznie: anosmia w COVID-19 (uszkodzenie komórek podpornych/sustentacular z ACE2; regeneracja przez komórki podstawne); anosmia w chorobie Alzheimera i Parkinsona (wczesny objaw prodromalny!); Kallmann (brak migracji GnRH neurons + komórek węchowych → anosmia + hipogonadyzm).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-717',
       is_active = true
 WHERE id = 'HIST-15-047';

-- HIST-15-050 | HIST-15 | klucz: b
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2018 sesja 1 / HISLEK-e2018-1-757
UPDATE public.questions
   SET text = 'W oskrzelikach:',
       options = '[{"id":"a","text":"Mogą występować blaszki chrzęstne"},{"id":"b","text":"Mogą występować pojedyncze grudki chłonne"},{"id":"c","text":"Mogą występować gruczoły surowicze produkujące surfaktant"},{"id":"d","text":"Brak prawidłowej odpowiedzi"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'b',
       explanation = 'W ścianie oskrzelików mogą występować **pojedyncze grudki chłonne** należące do tkanki limfatycznej oskrzeli (BALT). Oskrzeliki nie mają natomiast chrząstki ani gruczołów podśluzówkowych — to odróżnia je od oskrzeli. Surfaktant wytwarzają pneumocyty II rzędu w pęcherzykach, a nie gruczoły. Dlatego jedyną prawdziwą cechą jest obecność grudek chłonnych. *Klinicznie:* skurcz mięśniówki gładkiej oskrzelików leży u podstaw napadu astmy, a ich zapalenie (bronchiolitis) jest częste u małych dzieci.',
       source_exam = 'LDEK 2018 sesja 1',
       source_code = 'HISLEK-e2018-1-757',
       is_active = true
 WHERE id = 'HIST-15-050';

-- HIST-16-024 | HIST-16 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-703
UPDATE public.questions
   SET text = 'Jakich komorek nie ma w skorze wlasciwej (dermis)?',
       options = '[{"id":"a","text":"Keratynocytow "},{"id":"b","text":"Adipocytow "},{"id":"c","text":"Fibroblastow"},{"id":"d","text":"Komorek tucznych "},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **keratynocytów NIE MA w skórze właściwej (dermis)**; keratynocyty = komórki **naskórka (epidermis)**: warstwy podstawna, kolczysta, ziarnista, (jasna), rogowa. Dermis zawiera: fibroblasty ( C) + makrofagi + mastocyty ( D) + adipocyty (B, szczeg. w głębokiej dermis/tk. podskórnej) + naczynia + nerwy + mieszki włosowe + gruczoły potowe + łojowe. Granica skórno-naskórkowa (DEJ): nabłonek wielowarstwowy płaski rogowaciejący na błonie podstawnej (kolagen IV + laminina-332 w hemidesmosomach). Klinicznie: zmiany skórne w dermis — czerniak (melanocyty z DEJ → dermis → przerzuty), SCC (atypowe keratynocyty inwadują dermis), BCC (z komórek bazalnych); sklerodermia (fibroza dermis — kolagen III).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-703',
       is_active = true
 WHERE id = 'HIST-16-024';

-- HIST-16-033 | HIST-16 | klucz: b
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2018 sesja 1 / HISLEK-e2018-1-751
UPDATE public.questions
   SET text = 'Jakich komórek nie ma w ozębnej?',
       options = '[{"id":"a","text":"Fibroblastów"},{"id":"b","text":"Odontoblastów"},{"id":"c","text":"Osteoblastów"},{"id":"d","text":"Limfocytów"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'b',
       explanation = '**Ozębna (periodontium, PDL)** to **tkanka łączna włóknista** w szczelinie ozębnej (między cementem korzenia a kością zębodołu). Główny element: **włókna Sharpey''a** — pęczki kolagenu I od cementu do kości. Komórki ozębnej: **fibroblasty** (najliczniejsze — remodelują kolagen), **cementoblasty** (wzdłuż cementu), **osteoblasty** (wzdłuż kości), **osteoklasty** (resorpcja — kluczowe w ortodoncji), **resztki Malasseza** (nabłonkowe — źródło torbieli korzeniowych), **komórki odpornościowe** (makrofagi, **limfocyty** — zapalenie przyzębia). **Odontoblasty** — komórki **miazgi zęba (pulpa)**, na granicy zębina/miazga, produkują prazębinę i zębinę; **NIE WYSTĘPUJĄ W OZĘBNEJ**. Klucz B jednoznaczny. Klinika: periodontitis — utrata przyczepu ozębnej; ortodoncja wykorzystuje osteoblasty/osteoklasty ozębnej do przemieszczania zębów.',
       source_exam = 'LDEK 2018 sesja 1',
       source_code = 'HISLEK-e2018-1-751',
       is_active = true
 WHERE id = 'HIST-16-033';

-- HIST-17-034 | HIST-17 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 1 / HISLEK-e2019-1-608
UPDATE public.questions
   SET text = 'Nefryna jest elementem:',
       options = '[{"id":"a","text":"Błony Bowmana"},{"id":"b","text":"Blaszki jasnej błony podstawnej"},{"id":"c","text":"Blaszki ciemnej"},{"id":"d","text":"Błonki filtracyjnej (slit diaphragm)"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Klucz D** — **nefryna (NPHS1)** = kluczowe białko **slit diaphragm (błonki szczelinowej)** między pedicytami (stopkami) sąsiednich podocytów; tworzy "zipper-like" strukturę (homotypicalne interakcje Ig-like). Trójwarstwowa bariera filtracyjna kłębuszka: ( 1) śródbłonek okienkowy (fenestracje 70-100 nm, ujemny glikokaliks); ( 2) GBM (~300-400 nm; kolagen IV α3α4α5 + laminin-521); ( 3) **podocyty + stopki + slit diaphragm (nefryna + podocyna + CD2AP)**. **A** = błona Bowmana w rogówce (NIE nerka!); **B/C** = blaszki BM nie zawierają nefryny. Klinicznie: CNF (NPHS1 mut., fiński typ — masywna proteinuria od urodzenia, nefrektomia + transplantacja);

SRNS + FSGS (NPHS2 podocyna, ACTN4);

MCD (zlepianie stopek podocytów, GKS-sensitive ~90%); membranous nephropathy (anty-PLA2R).',
       source_exam = 'LDEK 2019 sesja 1',
       source_code = 'HISLEK-e2019-1-608',
       is_active = true
 WHERE id = 'HIST-17-034';

-- HIST-17-036 | HIST-17 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-651
UPDATE public.questions
   SET text = 'Nabłonek przejściowy (urothelium) pokrywa:',
       options = '[{"id":"a","text":"Kanaliki kręte nerki"},{"id":"b","text":"Błonę śluzową jajowodu"},{"id":"c","text":"Błonę śluzową nasieniowodu"},{"id":"d","text":"Błonę śluzową pęcherza moczowego"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Klucz D** — **nabłonek przejściowy (urothelium, uroepithelium)** = wielowarstwowy nabłonek charakterystyczny dla **układu moczowego**: miedniczka nerkowa → moczowody → **pęcherz moczowy** → proksymalna cewka moczowa. Cecha: zmiana kształtu przy rozciąganiu (wypełniony pęcherz → 3-4 warstwy + spłaszczone komórki; pusty → 6-7 warstw + komórki parasolowate/facet cells, duże, dwujądrowe, z glikoglikokaliksiną umbrella cells). Klinicznie: rak urotelialny (transitional cell carcinoma, TCC) — najczęstszy rak pęcherza; czynniki ryzyka: palenie (arylaminy) + ekspozycja zawodowa + cyklofosfamid; hematuria → cystoskopia; leczenie TURBT + BCG (immunoterapia) w niemusculo-invasive; cystektomia + chemio w invasive.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-651',
       is_active = true
 WHERE id = 'HIST-17-036';

-- HIST-17-040 | HIST-17 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-694
UPDATE public.questions
   SET text = 'Bezpośrednim przedłużeniem blaszki ściennej torebki Bowmana jest:',
       options = '[{"id":"a","text":"Kanalik proksymalny (PCT)"},{"id":"b","text":"Petla Henlego"},{"id":"c","text":"Kanalik dalszy (DCT)"},{"id":"d","text":"Brak prawidlowej odpowiedzi"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — powtórka Q556 e2020-1 + Q694 (późniejsze). Nabłonek blaszki ściennej torebki Bowmana (jednowarstwowy płaski) w **biegunie moczowym** przechodzi w nabłonek **PCT** (sześcienny z brush borderem). Biegun naczyniowy = afferent + efferent arteriola + JGA (komórki przykłębuszkowe = renina; macula densa = "sensor" Na w dystalnym kanaliku). PCT: resorpcja ~65-70% Na⁺+H₂O + 100% glukozy (SGLT2 + SGLT1) + 100% aa. Klinicznie: ATN (muddy brown casts), Fanconi (pan-PCT defekt), SGLT2i (empagliflozin, dapagliflozin → ↓glikemia + ↓BP + nefroprotekcja w DM2 i CKD).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-694',
       is_active = true
 WHERE id = 'HIST-17-040';

-- HIST-17-041 | HIST-17 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-695
UPDATE public.questions
   SET text = 'Blaszke scienna torebki Bowmana wyściela:',
       options = '[{"id":"a","text":"Nablone jednowarstwowy plaski"},{"id":"b","text":"Nablone jednowarstwowy szescienny"},{"id":"c","text":"Nablone jednowarstwowy walcowaty"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — blaszka ścienna torebki Bowmana (pars parietalis capsulae glomeruli) = **jednowarstwowy płaski** (ścianka zewnętrzna torebki); przechodzi w nabłonek PCT w biegunie moczowym. Blaszka trzewna = podocyty (specyficzny nabłonek z pedicytami + slit diaphragm). Powtórka Q694. Klinicznie: crescentic GN (szybko postępujące RPGN) = proliferacja komórek blaszki ściennej (parietal cells) → crescents w przestrzeni Bowmana → masywna utrata funkcji → dializy; etiologia crescentic: anti-GBM (Goodpasture), ANCA-vasculitis, immunokompleksy (SLE, post-strep); pilne leczenie (plazmafereза + GKS + cyklofosfamid).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-695',
       is_active = true
 WHERE id = 'HIST-17-041';

-- HIST-17-047 | HIST-17 | klucz: c
-- placeholder: e="brak danych w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-834
UPDATE public.questions
   SET text = 'Wskaż zdanie nieprawidłowe o rdzeniu nerki:',
       options = '[{"id":"a","text":"występują przewody zbiorcze"},{"id":"b","text":"występują pętle Henlego"},{"id":"c","text":"występują komórki mioepitelialne"},{"id":"d","text":"dochodzą do niego tętniczki proste"},{"id":"e","text":"brak danych w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Rdzeń nerki** — piramidy Malpighiego z brodawkami nerkowymi. Cechy histologiczne: ( A) **PRZEWODY ZBIORCZE (Belliniego)** — nabłonek sześcienny, komórki główne (ADH) i wstawkowe (kwasowo-zasadowe);

POPRAWNE. ( B) **PĘTLE HENLEGO** — szczególnie długie pętle nefronów przyrdzeniowych, kluczowe dla mechanizmu przeciwprądowego zagęszczania moczu;

POPRAWNE. ( D) **TĘTNICZKI PROSTE (vasa recta)** — od tętniczek odprowadzających, równoległe do pętli Henlego, mechanizm przeciwprądowy wymiany (nie wypłukują gradientu);

POPRAWNE. ( C) **KOMÓRKI MIOEPITELIALNE** — NIE występują w rdzeniu nerki. Są w **gruczołach zewnątrzwydzielniczych** (ślinianki, sutek, gruczoły potowe, łzowe). W nerce ich brak. Klucz: C (błędne twierdzenie).',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-834',
       is_active = true
 WHERE id = 'HIST-17-047';

-- HIST-17-049 | HIST-17 | klucz: c
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-858
UPDATE public.questions
   SET text = 'Z czego powstają narządy układu moczowego?',
       options = '[{"id":"a","text":"z mezodermy przyśrodkowej"},{"id":"b","text":"z mezodermy przyosiowej"},{"id":"c","text":"z mezodermy pośredniej / nefrotomu"},{"id":"d","text":"z mezodermy bocznej"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Narządy układu moczowego** rozwijają się z **MEZODERMY POŚREDNIEJ (intermediate mesoderm) = NEFROTOMU** — paskowatego obszaru mezodermy między somitami a mezodermą boczną. Klucz C. **Klasyfikacja mezodermy** (od osi ciała na zewnątrz): ( 1) **MEZODERMA PRZYOSIOWA (paraxial)** = somity → mięśnie szkieletowe, kręgi, skóra właściwa; ( 2) **MEZODERMA POŚREDNIA = NEFROTOM** → **nerki** (pronefros → mezonefros → metanefros), **moczowody** (pączek moczowodowy z przewodu Wolffa), **gonady**; ( 3) **MEZODERMA BOCZNA (lateral plate)** → somatopleura (ściana ciała) i splanchnopleura (układ pokarmowy, krążenie). **Pęcherz moczowy** — z zatoki moczowo-płciowej (endoderma), ale trójkąt z mezodermy moczowodów. Klucz: C.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-858',
       is_active = true
 WHERE id = 'HIST-17-049';

-- HIST-18-071 | HIST-18 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-648
UPDATE public.questions
   SET text = 'Krążenie wrotne wyspowo-pęcherzykowe jest charakterystyczne dla:',
       options = '[{"id":"a","text":"Trzustki"},{"id":"b","text":"Szyszynki"},{"id":"c","text":"Przysadki"},{"id":"d","text":"Wątroby"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **krążenie wrotne wyspowo-pęcherzykowe (insulo-acinar portal system)** w trzustce: krew z naczyń krwionośnych wysp Langerhansa (bogata w insulinę, glukagon, somatostatynę) przepływa do otaczających acini egzokrynowych → hormony wysp wpływają na sekrecję egzokrynną (insulina stymuluje enzymy trzustkowe, glukagon/SS hamują). Wyspy Langerhansa = komórki α (glukagon, ~20%), β (insulina, ~70%), δ (somatostatyna, ~5%), PP (polipeptyd trzustkowy), ε (grelina). Klinicznie: cukrzyca T1 (autoimmun atakuje β); T2 (insulinooporność + wyczerpanie β); insulinoma (guzy β, hipoglikemia); ZES (gastrinoma); VIPoma; glukagonoma.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-648',
       is_active = true
 WHERE id = 'HIST-18-071';

-- HIST-18-074 | HIST-18 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-706
UPDATE public.questions
   SET text = 'Warstwa klebuszkowata, pasmowata i siateczkowata naleza do:',
       options = '[{"id":"a","text":"Kory nadnerczy (cortex)"},{"id":"b","text":"Rdzenia nadnerczy (medulla)"},{"id":"c","text":"Przytatczyc (parathyroid)"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **kora nadnerczy (cortex)** = 3 warstwy (GFR mnemonic): **G**lomerulosa (aldosteron) → **F**asciculata (kortyzol, najgrubsza ~75%) → **R**eticularis (androgeny DHEA). Rdzeń nadnerczy (medulla) = komórki chromochłonne (chromaffin) = zmodyfikowane postsynaptyczne neurony współczulne; produkują adrenalinę (~80%) + noradrenalinę (~20%); unerwienie preganglionarne (splanchnicus major). Klinicznie: Conn (aldosteronoma Z. glomerulosa → HTN + hipokaliemia); Cushing adrenal (adenoma Z. fasciculata); adrenarche (Z. reticularis, DHEA w wieku 6-8 lat); pheochromocytoma (rdzeń, reguła 10%; VMA+metanephrine w moczu; α-blokada pre-op).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-706',
       is_active = true
 WHERE id = 'HIST-18-074';

-- HIST-18-078 | HIST-18 | klucz: b
-- placeholder: d="Brak w PDF"
-- źródło: LDEK 2018 sesja 1 / HISLEK-e2018-1-771
UPDATE public.questions
   SET text = 'Komórki C tarczycy parafolikularne:',
       options = '[{"id":"a","text":"Występują tylko w ścianie pęcherzyków"},{"id":"b","text":"Występują w ścianie pęcherzyków i poza nią"},{"id":"c","text":"Nie występują w ścianie pęcherzyków"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak prawidłowej odpowiedzi"}]'::jsonb,
       correct_option_id = 'b',
       explanation = '**Komórki C (parafolikularne)** tarczycy — ~0.1% komórek, odrębne od tyreocytów. Pochodzenie: **grzebień nerwowy** — neuralna geneza, część układu **APUD/DNES** (diffuse neuroendocrine system); migrują z **5. kieszonki gardłowej (ciałko ostatnie)** do tarczycy. Lokalizacja: **W ŚCIANIE PĘCHERZYKÓW** — wbudowane między tyreocyty w nabłonku pęcherzykowym, ale **NIE STYKAJĄ się ze światłem pęcherzyka** (oddziela cienka cytoplazma tyreocytów lub błona podstawna); **POZA PĘCHERZYKAMI** — w przestrzeni międzypęcherzykowej (tkanka łączna). Stąd B — obie lokalizacje. **Funkcja**: wydzielają **KALCYTONINĘ (CT)** — peptyd 32 aa, hormon hipokalcemiczny: hamowanie **osteoklastów** (↓resorpcja kostna), ↑wydalanie Ca²⁺ i fosforanu z moczem. Klucz B poprawnie. Klinika: **rak rdzeniasty tarczycy (MTC)** — z komórek C; sporadyczny lub w **MEN 2A/2B** (mutacja RET); marker: kalcytonina;

IHC: kalcytonina, chromogranina A, synaptofizyna.',
       source_exam = 'LDEK 2018 sesja 1',
       source_code = 'HISLEK-e2018-1-771',
       is_active = true
 WHERE id = 'HIST-18-078';

-- HIST-18-088 | HIST-18 | klucz: a
-- placeholder: e="brak danych w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-843
UPDATE public.questions
   SET text = 'Jaka część nadnerczy odpowiedzialna jest za produkcję hormonów płciowych?',
       options = '[{"id":"a","text":"warstwa siatkowata kory"},{"id":"b","text":"warstwa kłębkowata kory"},{"id":"c","text":"warstwa pasmowata"},{"id":"d","text":"rdzeń nadnerczy"},{"id":"e","text":"brak danych w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Kora nadnerczy** — trzy warstwy (GFR — od zewnątrz): ( 1) **KŁĘBKOWATA (glomerulosa)** — ~15%, produkuje **ALDOSTERON** (mineralokortykoid); regulacja przez angiotensynę II (RAA) i K+. ( 2) **PASMOWATA (fasciculata)** — ~75%, produkuje **KORTYZOL** (glukokortykoid); regulacja przez ACTH. ( 3) **SIATKOWATA (reticularis)** — ~10%, produkuje **ANDROGENY** — **DHEA, siarczan DHEA, androstendion**; regulacja przez ACTH. Klucz A — warstwa siatkowata = hormony płciowe. **Rdzeń nadnerczy** (D) — komórki chromafinowe produkujące **katecholaminy** (adrenalina, noradrenalina) — system współczulny. Mnemonic: **GFR** (jak przesączanie nerkowe) = Glukokortykoid (Pasmowata), Filtrat=Mineralokortykoid (Kłębkowata), Reticularis=Androgeny.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-843',
       is_active = true
 WHERE id = 'HIST-18-088';

-- HIST-19-077 | HIST-19 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-639
UPDATE public.questions
   SET text = '70% objętości nasienia to wydzielina:',
       options = '[{"id":"a","text":"Pęcherzyków nasiennych"},{"id":"b","text":"Gruczołów opuszkowo-cewkowych (Cowpera)"},{"id":"c","text":"Sterczowa (prostata)"},{"id":"d","text":"Plemniki"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — skład nasienia (ejakulat ~2-5 mL): **( A) pęcherzyki nasienne (vesiculae seminales)** = ~65-70% objętości (bogata w fruktozę dla energii plemników + prostaglandyny + białka koagulacyjne); **( C) prostata** = ~25-30% (cytryniany, cynk, PSA, kwaśna fosfataza, antyinfekcyjne); **( B) gruczoły Cowpera** = < 5% (śluz, neutralizacja cewki przed ejakulacją); **plemniki** = <5% objętości. PSA (kallikrein) rozkłada koagulat nasienia. Klinicznie: CBAVD (brak pęcherzyków + nasieniowodu w CF) → azoospermia + niskie pH + brak fruktozy.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-639',
       is_active = true
 WHERE id = 'HIST-19-077';

-- HIST-19-080 | HIST-19 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-656
UPDATE public.questions
   SET text = 'Przewód najądrza wyściela nabłonek:',
       options = '[{"id":"a","text":"Wielorzędowy (pseudostratified) walcowaty ze stereocyliami"},{"id":"b","text":"Jednowarstwowy płaski"},{"id":"c","text":"Wielowarstwowy płaski"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **ductus epididymidis** = **pseudostratified walcowaty ze STEREOCYLIAMI** (długie mikrowilli, NIE rzęski — brak 9+2 struktur, aktyna zamiast mikrotubul; długie wypustki cytoplazmatyczne). Komórki główne (principal) z stereocyliami → dojrzewanie + capacitation plemników przez ~10-14 dni; resorpcja płynu + sekrecja czynników; magazyn w ogonie. Powtórka Q583 e2019-1 (ductuli efferentes = pseudo-stratified walcowaty z rzęskami + microkosmkami). Klinicznie: epididymitis (<35 r. = Chlamydia, >35 = E. coli); CBAVD (brak najądrza + nasieniowodu w CF); obstrukcyjna azoospermia → MESA/PESA + ICSI.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-656',
       is_active = true
 WHERE id = 'HIST-19-080';

-- HIST-19-082 | HIST-19 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-686
UPDATE public.questions
   SET text = 'Budowa najądrza:',
       options = '[{"id":"a","text":"Posiada głowę, trzon i ogon"},{"id":"b","text":"W skład trzonu i ogona wchodzi przewód najądrza"},{"id":"c","text":"Kwaśny odczyn wydzieliny"},{"id":"d","text":"Wszystkie prawidłowe"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Klucz D (wszystkie A+B+C)** — najądrze (epididymis): **( A) głowa (caput)** = ductuli efferentes (~10-20) → **trzon (corpus)** + **ogon (cauda)** = ductus epididymidis (~6m zwinięty, pseudostratified ze stereocyliami); **( B) trzon + ogon = przewód najądrza** (caput = ductuli efferentes); **( C) kwaśne pH wydzieliny** (~6.5-6.8 — hamuje przedwczesną aktywację plemników przed ejakulacją; dojrzewanie obejmuje ↓pH). Capacitation plemników: nabycie zdolności do fertilizacji + motylity (ruchliwości); magazyn w ogonie. Klinicznie: orchitis + epididymitis;

CBAVD (CF); vasektomia (przecięcie nasieniowodu po ogonie najądrza);

MESA (microsurgical epididymal sperm aspiration) + ICSI.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-686',
       is_active = true
 WHERE id = 'HIST-19-082';

-- HIST-19-094 | HIST-19 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2017 sesja 1 / HISLEK-e2017-1-853
UPDATE public.questions
   SET text = 'Kiedy powstają oocyty I rzędu?',
       options = '[{"id":"a","text":"pomiędzy 8.–30. tygodniem życia płodowego"},{"id":"b","text":"pomiędzy 5.–7. miesiącem życia płodowego"},{"id":"c","text":"zaraz po urodzeniu"},{"id":"d","text":"po osiągnięciu dojrzałości płciowej"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Oogeneza płodowa**: ( 1) 3.– 6. tydzień: **oogonia** (PGC migrujące z pęcherzyka żółtkowego) namnażają się mitotycznie; ( 2) od **~ 8. tygodnia** oogonia wchodzą w **mejozę I** → stają się **OOCYTAMI I RZĘDU** — mejoza zatrzymuje się w **profazie I (diploten)**; ( 3) do **~ 30. tygodnia** większość oocytów I rzędu otoczona komórkami pęcherzykowymi → **pęcherzyki pierwotne (primordial follicles)**. Klucz A (8.– 30. tydzień). Liczba oocytów maleje przez atrezję: ~7 mln (szczyt) → ~1–2 mln przy urodzeniu → ~300–400 tys. w dojrzewaniu → ~400–500 owuluje w życiu. **Wszystkie oocyty kobiety powstają przed urodzeniem** — klucz A. Mejoza I kończy się dopiero **tuż przed owulacją**; mejoza II — po zapłodnieniu. Klucz: A.',
       source_exam = 'LDEK 2017 sesja 1',
       source_code = 'HISLEK-e2017-1-853',
       is_active = true
 WHERE id = 'HIST-19-094';

-- HIST-20-028 | HIST-20 | klucz: d
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 1 / HISLEK-e2019-1-611
UPDATE public.questions
   SET text = 'Elementem nie wchodzącym w skład kubków smakowych są komórki:',
       options = '[{"id":"a","text":"Podstawne"},{"id":"b","text":"Typu II"},{"id":"c","text":"Typu III"},{"id":"d","text":"Kępkowe (brush cells)"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'd',
       explanation = '**Klucz D** — **komórki kępkowe (brush/tuft cells)** NIE wchodzą w skład kubka smakowego. Kubek smakowy zawiera: **( A) podstawne** (stem, turnover ~10 dni); **( B) typ I (dark/ciemne)** — podporowe, transport K⁺; **typ II (jasne)** — receptory słodkiego/gorzkiego/umami (TAS1R/TAS2R → PLCβ2 → IP3 → Ca²⁺ → ATP przez CALHM1); **( C) typ III** — receptor kwaśny (OTOP1/PKD2L1), klasyczne synapsy, serotonina; + zakończenia nerwowe (VII, IX, X). Komórki kępkowe = chemosensory w nabłonku oddechowym + jelitowym (IL-25 + ILC2). Klinicznie: ageuzja w COVID-19; ↓smak w niedoborze Zn; ageuzja po chemio; drogi smaku: VII (chorda tympani, przednie 2/3 języka) → IX (tylna 1/3) → X (nagłośnia) → jądro samotne → VPM wzgórza → insula.',
       source_exam = 'LDEK 2019 sesja 1',
       source_code = 'HISLEK-e2019-1-611',
       is_active = true
 WHERE id = 'HIST-20-028';

-- HIST-20-030 | HIST-20 | klucz: c
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-642
UPDATE public.questions
   SET text = 'Zrąb rogówki zawiera:',
       options = '[{"id":"a","text":"Kolagen typu I"},{"id":"b","text":"Kolagen typu V"},{"id":"c","text":"A i B (oba typy kolagenu)"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'c',
       explanation = '**Klucz C** — zrąb rogówki (substantia propria, ~90% grubości): **kolagen I + kolagen V** (oba!) ułożone w 200-300 równoległych lamellach (precyzyjny spacing → przezroczystość) + keratocyty + proteoglikany (decorin, lumican, keratocan regulują spacing włókien). Powtórka Q588 e2019-1. Inne warstwy rogówki: nabłonek wielowarstwowy płaski nierogowaciejący → błona Bowmana (kol. I+V) → **zrąb** → błona Descemeta (kol. VIII, rośnie z wiekiem) → śródbłonek (pompa Na/K, klucz dla przezroczystości). Klinicznie: LASIK (flap w zrębie); keratoconus (degeneracja zrębu); keratitis.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-642',
       is_active = true
 WHERE id = 'HIST-20-030';

-- HIST-20-031 | HIST-20 | klucz: a
-- placeholder: d="Brak w PDF", e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-643
UPDATE public.questions
   SET text = 'Jak soczewka jest połączona z wyrostkami rzęskowymi:',
       options = '[{"id":"a","text":"Więzadełkami Zinna (zonula ciliaris)"},{"id":"b","text":"Więzadełkami Zeissa"},{"id":"c","text":"Więzadełkami Molla"},{"id":"d","text":"Brak w PDF"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — soczewka zawieszona na **więzadełkach Zinna (zonula ciliaris, fibres zonulares)** = cienkie włókna z fibryliny-1 (FBN1!) łączące ciało rzęskowe z torebką soczewki. Akomodacja: skurcz m. ciliaris → relaksacja więzadełek → soczewka kulista (widzenie bliskie); relaksacja m. ciliaris → naciąg więzadełek → spłaszczenie (widzenie dalekie). **Więzadełka Zeissa** = gruczoły łojowe przy mieszkach rzęs (powieka); **Molla** = gruczoły potowe apokrynowe powieki. Klinicznie: presbyopia (↓elastyczność soczewki → brak akomodacji); ektopia soczewki (Marfan — FBN1 mut. → zerwanie więzadełek).',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-643',
       is_active = true
 WHERE id = 'HIST-20-031';

-- HIST-20-033 | HIST-20 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-676
UPDATE public.questions
   SET text = 'Gruczoły Molla i Zeissa znajduja sie w:',
       options = '[{"id":"a","text":"Powiece (przy mieszkach rzesotek)"},{"id":"b","text":"Twardzowce"},{"id":"c","text":"Rogówce"},{"id":"d","text":"Soczewce"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — gruczoły powieki przy mieszkach rzęs: **( 1) Gruczoły Molla** = zmodyfikowane gruczoły potowe **APOKRYNOWE** (apocrine sweat glands, cytoplazma z wypuklinami "dekap"); przewody otwierają się do mieszków rzęs lub bezpośrednio na skórze powieki; wydzielina: wodnisto-lipidowa; **( 2) Gruczoły Zeissa (Zeiss)** = zmodyfikowane gruczoły **ŁOJOWE** (sebaceous glands); przy mieszkach rzęs; tłusta wydzielina → chroni rzęsy + nawilżenie brzegu powieki; mikroanatomy inne niż gruczoły Meiboma (w tarsusie). Klinicznie: **chalazion** = zatkanie gruczołu Meiboma → ziarniak lipidowy; **gradówka** vs **jaczmen (hordeolum)** (S. aureus, ostry); **molluscum contagiosum** vs wirus HPV na powiece.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-676',
       is_active = true
 WHERE id = 'HIST-20-033';

-- HIST-20-034 | HIST-20 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-677
UPDATE public.questions
   SET text = 'Gruczoły Meiboma wystepuja w:',
       options = '[{"id":"a","text":"Powiece (w tarsusie)"},{"id":"b","text":"Twardzowce"},{"id":"c","text":"Rogówce"},{"id":"d","text":"Spojówce"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **gruczoły Meiboma (tarsalne)** = duże gruczoły łojowe (holokrynne) osadzone prostopadle w **tarsusie** (chrząstce) górnej (~25-40 gruczołó w) i dolnej (~20-30 gruczołó w) powieki; przewody wzdłuż brzegu powieki; wydzielina: meibum = lipidy (cholesterol, woski, tróójglicerydy) → **warstwa lipidowa łez** (zewnętrzna z 3-warstw błony łzowej) → hamuje parowanie łez. Klinicznie: dysfunkcja gruczołów Meiboma (MGD) = najczęstsza przyczyna **choroby suchego oka (dry eye disease)** → ↓lipidowa warstwa łez → ↑parowanie → keratoconjunctivitis sicca; **chalazion** = zatkanie MGD → ziarniak;

IPL (intense pulsed light) + ciepłe kompresy w MGD; sztuczne łzy w DED.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-677',
       is_active = false
 WHERE id = 'HIST-20-034';

-- HIST-20-040 | HIST-20 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2018 sesja 1 / HISLEK-e2018-1-746
UPDATE public.questions
   SET text = 'Funkcja narządu lemieszowego to:',
       options = '[{"id":"a","text":"Receptorowa — odbiór sygnałów zapachowych/feromonowych"},{"id":"b","text":"Produkcja płynu rozpuszczającego substancje zapachowe"},{"id":"c","text":"Brak funkcji"},{"id":"d","text":"Brak prawidłowej odpowiedzi"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = 'Narząd lemieszowo-nosowy (Jacobsona) pełni funkcję **receptorową — odbiera sygnały zapachowe i feromonowe**. U zwierząt odgrywa kluczową rolę w komunikacji chemicznej, a u człowieka jest strukturą szczątkową o dyskusyjnej czynności. Leży w przedniej części przegrody nosa. Produkcja płynu rozpuszczającego substancje zapachowe to zadanie gruczołów Bowmana okolicy węchowej, nie tego narządu. *Klinicznie:* u człowieka jego znaczenie funkcjonalne pozostaje przedmiotem badań.',
       source_exam = 'LDEK 2018 sesja 1',
       source_code = 'HISLEK-e2018-1-746',
       is_active = true
 WHERE id = 'HIST-20-040';

-- HIST-21-009 | HIST-14 | klucz: a
-- placeholder: e="Brak w PDF"
-- źródło: LDEK 2019 sesja 2 / HISLEK-e2019-2-710
UPDATE public.questions
   SET text = 'Biegun naczyniowy i zolciowy to charakterystyczna cecha:',
       options = '[{"id":"a","text":"Hepatocytow"},{"id":"b","text":"Komorek Kupffera"},{"id":"c","text":"Komorek Ito (stellate)"},{"id":"d","text":"Cholangiocytow"},{"id":"e","text":"Brak w PDF"}]'::jsonb,
       correct_option_id = 'a',
       explanation = '**Klucz A** — **hepatocyty** = **biegunowe komórki** z 2 powierzchniami funkcjonalnymi: **( 1) biegun naczyniowy (vascular/sinusoidal)** — zwrócony ku zatoczce (sinusoid) → wydzielanie albumin, czynników krzepnięcia, ApoB, lipoprotein → krew; mikrowille w przestrzeni Dissego; **( 2) biegun żółciowy (biliary/canalicular)** — zwrócony ku kanaliku żółciowemu → wydzielanie żółci (bile canaliculi między sąsiednimi hepatocytami, brak własnej ściany — tylko błony 2 hepatocytów + tight junctions). Komórki Kupffera ( B) = makrofagi rezydentne zatoczek;

Ito ( C) = gwiazdowe, magazyn wit. A + fibroza; cholangiocyty ( D) = nabłonek przewodów żółciowych. Klinicznie: hepatitis (martwica hepatocytów → ↑ALT/AST + ↑bilirubina);

PSC/PBC (cholangiopatie); hepatocellular carcinoma (HCC) AFP marker.',
       source_exam = 'LDEK 2019 sesja 2',
       source_code = 'HISLEK-e2019-2-710',
       is_active = true
 WHERE id = 'HIST-21-009';
COMMIT;
