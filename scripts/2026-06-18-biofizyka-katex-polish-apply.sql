-- ============================================================
-- APPLY: biofizyka — audyt KaTeX + polskie znaki
-- Data:     2026-06-18T21:15:52.168Z
-- Zmienionych pytań: 55 / 783
-- Rollback: exports/biofizyka-pre-katex-polish-rollback.sql
-- ============================================================

BEGIN;

UPDATE public.questions
   SET text = 'Czas wygaszenia fosforescencji jest zazwyczaj … niż fluorescencji.',
       options = '[{"id":"a","text":"krótszy"},{"id":"b","text":"równy"},{"id":"c","text":"dłuższy"},{"id":"d","text":"dwa razy krótszy"}]'::jsonb,
       explanation = 'Fosforescencja ma dłuższy czas wygaszenia niż fluorescencja. Fosforescencja wymaga "zabronionych" przejsc między stanami o roznym spinie (triplet->singlet), co trwa dłużej.'
 WHERE id = 'biofiz-c1-013';

UPDATE public.questions
   SET text = 'Widmo emisyjne jako otrzymujemy dla gazów wieloatomowych klasyfikujemy jako widmo:',
       options = '[{"id":"a","text":"charakterystyczne"},{"id":"b","text":"ciągłe"},{"id":"c","text":"$pasmowe (jezeli wieloatomowe = cząsteczkowe)$"},{"id":"d","text":"$liniowe (jezeli wieloatomowe = atomowe)$"}]'::jsonb,
       explanation = 'Gazy wieloatomowe (cząsteczkowe) daja widmo pasmowe - skladajace się z wielu blisko siebie polozonych linii tworzacych pasma. Wynika to z przejsc rotacyjno-oscylacyjnych.'
 WHERE id = 'biofiz-c1-030';

UPDATE public.questions
   SET text = 'Polaryzacja zachodząca na powierzchni dielektryka spełnia warunek ($α$ - kąt padania wiązki świetlnej na dielektryk, n - współczynnik załamania światła)',
       options = '[{"id":"a","text":"$\\\\tan(\\\\alpha) = n, całkowicie spolaryzowanym jest promień odbity$"},{"id":"b","text":"$\\\\tan(\\\\alpha) = n, całkowicie spolaryzowanym jest promień załamany$"},{"id":"c","text":"$\\\\sin(\\\\alpha) = n, całkowicie spolaryzowanym jest promień odbity$"},{"id":"d","text":"$\\\\sin(\\\\alpha) = n, całkowicie spolaryzowanym jest promień załamany$"}]'::jsonb,
       explanation = 'Prawo Brewstera: $\\tan(\alpha) = n. Pod k$ątem Brewstera promień odbity jest całkowicie spolaryzowany (drgania E prostopadle do płaszczyzny padania). Promień załamany jest czesciowo spolaryzowany.'
 WHERE id = 'biofiz-c2-003';

UPDATE public.questions
   SET text = 'Jeżeli światło przechodzi z ośrodka o współczynniku załamania n1 ($α$ - kąt padania) do ośrodka o współczynniku załamania n2 ($β$ - kąt załamania) to prawo załamania światła w tym przypadku wyraża równanie',
       options = '[{"id":"a","text":"$n1 \\\\cos(\\\\alpha) = n2 \\\\cos(\\\\beta)$"},{"id":"b","text":"$n2 \\\\cos(\\\\alpha) = n1 \\\\cos(\\\\beta)$"},{"id":"c","text":"$n2 \\\\sin(\\\\alpha) = n1 \\\\sin(\\\\beta)$"},{"id":"d","text":"$n1 \\\\sin(\\\\alpha) = n2 \\\\sin(\\\\beta) sin \\\\alpha n2 = sin \\\\beta n1 \\\\alpha - kąt padania \\\\beta - kąt załamania$"}]'::jsonb,
       explanation = 'Prawo Snella (załamania): $n_{1} \cdot \\sin(\alpha) = n_{2} \cdot \\sin(\beta)$, gdzie alpha to kąt padania, beta to kąt załamania. Prawo okresla, jak zmienia się kierunek promienia na granicy ośrodków.'
 WHERE id = 'biofiz-c2-013';

UPDATE public.questions
   SET text = 'Krew jest cieczą nienewtonowską i tiksotropową. Wzrost lepkości krwi jest powodowany przez',
       options = '[{"id":"a","text":"zwiększenie stopnia elongacji erytrocytów przy dużych prędkościach ścinania"},{"id":"b","text":"zmniejszenie temperatury krwi lub wzrost hematokrytu"},{"id":"c","text":"zmniejszenie temperatury krwi lub hematokrytu"},{"id":"d","text":"zmniejszenie stopnia agregacji erytrocytów przy małych prędkościach ścinania"}]'::jsonb,
       explanation = 'Lepkość krwi rośnie przy: nizszej temperaturze, wyzszym hematokrycie, agregacji erytrocytów. Krew jest cieczą tiksotropową - lepkość zależy od szybkosci ścinania.'
 WHERE id = 'biofiz-c3-011';

UPDATE public.questions
   SET text = 'W trakcie przepływu krwi przez naczynia krwionośne na lepkość krwi mogą wpływać różne czynniki. Powoduje to, że lepkość krwi może być różna w różnych częściach układu naczyniowego. Jednym ze zjawisk wpływających na lepkość krwi to efekt Magnusa. Można go wyjaśnić poprzez',
       options = '[{"id":"a","text":"zjawisko osiowej akumulacji erytrocytów"},{"id":"b","text":"zależność hematokrytu od sposobu przepływu krwi"},{"id":"c","text":"wpływ ciśnienia krwi w naczyniu na przepływ erytrocytów w naczyniu"},{"id":"d","text":"zjawisko pozaosiowego przepływu krwi"}]'::jsonb,
       explanation = 'Akumulacja osiowa erytrocytów (efekt Fahraeus-Lindqvist): czerwone krwinki gromadza się w osi naczynia, przy scianach plynie osocze. Zmniejsza to pozorna lepkość w małych naczyniach.'
 WHERE id = 'biofiz-c3-015';

UPDATE public.questions
   SET text = 'Wzrost lepkości krwi powoduje:',
       options = '[{"id":"a","text":"zmniejszenie hematokrytu i zmniejszenie temperatury krwi"},{"id":"b","text":"zwiększenie hematokrytu i zwiększenie temperatury krwi"},{"id":"c","text":"wzrost hematokrytu i zmniejszenie temperatury krwi"},{"id":"d","text":"zmniejszenie hematokrytu i wzrost temperatury krwi"}]'::jsonb,
       explanation = 'Lepkość krwi rośnie przy: wyzszym hematokrycie (wiecej komorek) i nizszej temperaturze (większa lepkość osocza). Odwrotne czynniki zmniejszaja lepkość.'
 WHERE id = 'biofiz-c3-027';

UPDATE public.questions
   SET text = 'Zjawisko akumulacji osiowej krwinek wpływa na lepkość krwi i powoduje',
       options = '[{"id":"a","text":"zmniejszenie lepkości krwi"},{"id":"b","text":"stałą lepkość krwi niezależnie od średnicy naczynia"},{"id":"c","text":"wzrost lepkości krwi"}]'::jsonb,
       explanation = 'Akumulacja osiowa (efekt Fahraeus-Lindqvist) zmniejsza pozorna lepkość krwi w małych naczyniach. Erytrocyty plyna w osi, przy scianach jest osocze o mniejszej lepkości.'
 WHERE id = 'biofiz-c3-030';

UPDATE public.questions
   SET text = 'W mięśniu po jego wydłużeniu z początkowej długości i pozostawieniu stałej długości mięśnia występuje zjawisko:',
       options = '[{"id":"a","text":"pełzania"},{"id":"b","text":"relaksacji odkształcenia"},{"id":"c","text":"relaksacji naprężenia"},{"id":"d","text":"płynięcia"}]'::jsonb,
       explanation = 'Relaksacja naprężenia: przy stałej długości (stalym odksztalceniu) naprężenie stopniowo maleje w czasie. Charakterystyczne dla materialow lepko-sprezystych.'
 WHERE id = 'biofiz-c4-010';

UPDATE public.questions
   SET text = 'Potencjał elektryczny na błonie komórki mięśnia poprzecznie prążkowanego wynosi około',
       options = '[{"id":"a","text":"$-60 mV$"},{"id":"b","text":"$-6 V$"},{"id":"c","text":"$-6 mV$"},{"id":"d","text":"$-60 kV$"}]'::jsonb,
       explanation = 'Potencjał spoczynkowy komórki mięśniowej wynosi ok. -60 do -90 mV (wnetrze ujemne wzgledem zewnetrza). Depolaryzacja do ok. +30 mV wyzwala skurcz.'
 WHERE id = 'biofiz-c4-013';

UPDATE public.questions
   SET text = 'Energia do skurczu mięśnia czerpana jest z',
       options = '[{"id":"a","text":"ATP"},{"id":"b","text":"ciepła dostarczonego z otoczenia komórki"},{"id":"c","text":"potencjału błonowego komórki mięśniowej"},{"id":"d","text":"ciepła wydzielonego w procesach metabolicznych"}]'::jsonb,
       explanation = 'Energia do skurczu pochodzi z hydrolizy ATP (adenozynotrifosforan). ATP -> ADP + Pi + energia. ATP jest uniwersalnym nosnikiem energii w komórce.'
 WHERE id = 'biofiz-c4-014';

UPDATE public.questions
   SET text = 'Maksymalny zasięg, kiedy ciało po odjęciu działającej siły powraca do poprzedniego kształtu to:',
       options = '[{"id":"a","text":"granica zerwania próbki"},{"id":"b","text":"granica plastyczności"},{"id":"c","text":"granica proporcjonalności"},{"id":"d","text":"granica sprężystości"}]'::jsonb,
       explanation = 'Granica sprężystości: maksymalne naprężenie, przy ktorym material wraca do pierwotnego kształtu po odjęciu siły. Powyzej - trwale odksztalcenie plastyczne.'
 WHERE id = 'biofiz-c4-016';

UPDATE public.questions
   SET text = 'Liniowa wprost proporcjonalna zależność między naprężeniem wewnętrznym względnym wydłużeniem wynikającym z prawa Hooke’a nie jest spełniona:',
       options = '[{"id":"a","text":"na granicy proporcjonalności"},{"id":"b","text":"w zakresie od zera do granicy proporcjonalności"},{"id":"c","text":"powyżej granicy proporcjonalności"},{"id":"d","text":"tylko do połowy granicy proporcjonalności"}]'::jsonb,
       explanation = 'Prawo Hookea (sigma = E * epsilon) obowiązuje w zakresie od zera do granicy proporcjonalności. Powyżej zależność jest nieliniowa.'
 WHERE id = 'biofiz-c4-019';

UPDATE public.questions
   SET text = 'Reologiczny model Maxwella opisuje',
       options = '[{"id":"a","text":"ruch harmoniczny prosty"},{"id":"b","text":"zachowanie mięśni gładkich podczas rozciągania"},{"id":"c","text":"zachowanie mięśni poprzecznie prążkowanych podczas rozciągania"},{"id":"d","text":"ruch harmoniczny tłumiony"}]'::jsonb,
       explanation = 'Model Maxwella opisuje zachowanie mięśni gładkich podczas rozciągania - wykazuja one relaksacje naprezenia (naprężenie maleje przy stalym odksztalceniu).'
 WHERE id = 'biofiz-c4-027';

UPDATE public.questions
   SET text = 'Jak nazywa się prawo, któremu podlega wiele materiałów poddanych obciążeniom, o ile obciążenie nie przekracza granicy sprężystości materiału',
       options = '[{"id":"a","text":"prawo Hooke''a"},{"id":"b","text":"prawo Younga"},{"id":"c","text":"prawo Hilla"},{"id":"d","text":"prawo Maxwella"}]'::jsonb,
       explanation = 'Prawo Hookea: $\sigma = E \cdot \epsilon (naprężenie proporcjonalne do odkształcenia)$. Obowiązuje dla małych odkształceń w zakresie sprezystym. E to modul Younga.'
 WHERE id = 'biofiz-c4-030';

UPDATE public.questions
   SET text = 'Jednostką efektywnego równoważnika dawki (dawki skutecznej) jest',
       options = '[{"id":"a","text":"grey (Gy)"},{"id":"b","text":"$\\dfrac{C}{kg}$"},{"id":"c","text":"siwert (Sv)"},{"id":"d","text":"bekerel (Bq)"}]'::jsonb,
       explanation = 'Dawka skuteczna (efektywny rownowaznik dawki) mierzona jest w siewertach (Sv). Uwzględnia rozny wpływ biologiczny różnych rodzajow promieniowania i czulosc tkanek.'
 WHERE id = 'biofiz-s1-003';

UPDATE public.questions
   SET text = 'W stanie stacjonarnym',
       options = '[{"id":"a","text":"funkcje termodynamiczne układu zachowują stałą wartość w czasie"},{"id":"b","text":"w układzie nie zachodzą procesy tworzące entropię"},{"id":"c","text":"szybkość tworzenia się entropii jest stała i przyjmuje wartość największą"},{"id":"d","text":"zmienia się entropia układu, bez zmian entalpii swobodnej"}]'::jsonb,
       explanation = 'Stan stacjonarny: funkcje termodynamiczne (T, p, stężenia) sa stale w czasie, mimo ze przez układ przeplywaja strumienie energii i materii. Rozny od rownowagi termodynamicznej.'
 WHERE id = 'biofiz-s2-023';

UPDATE public.questions
   SET text = 'U człowieka stan, w którym ciepło oddawane do otoczenia nie jest w stanie zbilansować ciepła wytwarzanego w organizmie to',
       options = '[{"id":"a","text":"gorączka"},{"id":"b","text":"hipotermia"},{"id":"c","text":"sprawna termoregulacja"},{"id":"d","text":"hipertermia"}]'::jsonb,
       explanation = 'Hipertermia: produkcja ciepła przewyzsza oddawanie, temperatura ciala rośnie niekontrolowanie. Rozna od goraczki (kontrolowana przez ośrodek termoregulacji).'
 WHERE id = 'biofiz-s2-028';

UPDATE public.questions
   SET text = 'Jak nazywa się zjawisko unoszenia ciepła za pośrednictwem poruszającej się substancji?',
       options = '[{"id":"a","text":"parowanie"},{"id":"b","text":"konwekcja"},{"id":"c","text":"promieniowanie"},{"id":"d","text":"przewodnictwo cieplne"}]'::jsonb,
       explanation = 'Konwekcja to unoszenie ciepła przez poruszajaca się materię (gaz, ciecz). Przewodzenie - przez zderzenia czasteczek, promieniowanie - przez fale EM.'
 WHERE id = 'biofiz-s2-033';

UPDATE public.questions
   SET text = 'Entropia',
       options = '[{"id":"a","text":"nie zmienia się podczas procesów nieodwracalnych"},{"id":"b","text":"zmniejsza się podczas nieodwracalnych procesów"},{"id":"c","text":"nie jest funkcją stanu"},{"id":"d","text":"jest wprost proporcjonalna do prawdopodobieństwa termodynamicznego"}]'::jsonb,
       explanation = 'Entropia S = k*ln(W) - jest wprost proporcjonalna do logarytmu prawdopodobieństwa termodynamicznego W. Rośnie w procesach nieodwracalnych. Jest funkcją stanu.'
 WHERE id = 'biofiz-s2-043';

UPDATE public.questions
   SET text = 'Współczynnik dyfuzji nie jest',
       options = '[{"id":"a","text":"malejący wraz ze wzrostem temperatury"},{"id":"b","text":"współczynnikiem proporcjonalności w prawie Ficka"},{"id":"c","text":"zależny od kształtu cząsteczek substancji transportowanej"},{"id":"d","text":"zależny od wielkości cząsteczek substancji transportowanej"}]'::jsonb,
       explanation = 'Współczynnik dyfuzji D ROŚNIE ze wzrostem temperatury (większe ruchy termiczne). Zależy od wielkości i kształtu cząsteczek, jest współczynnikiem w prawie Ficka.'
 WHERE id = 'biofiz-s2-045';

UPDATE public.questions
   SET text = 'Zgodnie z drugą zasadą termodynamiki podczas dowolnego procesu całkowita entropia wszechświata',
       options = '[{"id":"a","text":"wzrasta lub pozostaje stała"},{"id":"b","text":"zmniejsza się"},{"id":"c","text":"wzrasta"},{"id":"d","text":"pozostaje stałe"}]'::jsonb,
       explanation = 'II zasadą: całkowita entropia wszechświata (układ + otoczenie) wzrasta lub pozostaje stała. W procesach odwracalnych dS_total = 0, w nieodwracalnych dS_total > 0.'
 WHERE id = 'biofiz-s2-048';

UPDATE public.questions
   SET text = 'Układ termodynamiczny można uznać za układ otwarty',
       options = '[{"id":"a","text":"jeśli wymienia on tylko energię ze swoim otoczeniem"},{"id":"b","text":"jeśli jego masa jest stała"},{"id":"c","text":"jeśli wymienia on materię i energię ze swoim otoczeniem"},{"id":"d","text":"jeśli może on wymieniać dowolną energię ze swoim otoczeniem, z wyjątkiem materiału i ciepła"}]'::jsonb,
       explanation = 'Układ otwarty wymienia z otoczeniem zarówno energie jak i materię. Układ zamkniety wymienia tylko energie. Układ izolowany nie wymienia niczego.'
 WHERE id = 'biofiz-s2-049';

UPDATE public.questions
   SET text = 'Jakim typem układu termodynamicznego jest żywy organizm?',
       options = '[{"id":"a","text":"zamkniętym"},{"id":"b","text":"otwartym"},{"id":"c","text":"izolowanym"},{"id":"d","text":"adiabatycznym"}]'::jsonb,
       explanation = 'Żywy organizm to układ otwarty - wymienia z otoczeniem zarówno energie (cieplo, praca) jak i materię (pokarm, tlen, CO2, metabolity). Utrzymuje stan stacjonarny.'
 WHERE id = 'biofiz-s2-051';

UPDATE public.questions
   SET text = 'Czas trwania potencjału czynnościowego wynosi od około 0,5 do 2 ms',
       options = '[{"id":"a","text":"prawda"},{"id":"b","text":"fałsz"}]'::jsonb,
       explanation = 'Potencjał czynnościowy trwa ok. 1-2 ms w neuronach, nieco dłużej w komórce mięśniowej serca (200-400 ms). Faza depolaryzacji to ok. 0.5 ms.'
 WHERE id = 'biofiz-s2-055';

UPDATE public.questions
   SET text = 'Na zachowanie się krwi w naczyniach w trakcie przepływu ma istotny wpływ współczynnik lepkości krwi. Współczynnik lepkości krwi może zwiększyć się w przypadku:',
       options = '[{"id":"a","text":"zmniejszenia hematokrytu lub zmniejszenia temperatury krwi"},{"id":"b","text":"wzrostu hematokrytu lub zmniejszenia temperatury krwi"},{"id":"c","text":"zwiększenia hematokrytu lub zwiększenia temperatury krwi"},{"id":"d","text":"zmniejszenia hematokrytu lub wzrostu temperatury krwi"}]'::jsonb,
       explanation = 'Lepkość krwi rośnie przy: wzroscie hematokrytu (wiecej komorek) i spadku temperatury (większa lepkość osocza). Te same czynniki co dla kazdej cieczy plus agregacja erytrocytow.'
 WHERE id = 'biofiz-s2-067';

UPDATE public.questions
   SET text = 'Przy przechodzeniu promieniowania rentgenowskiego lub gamma dochodzi do oddziaływania tych promieniowań z materią poprzez zjawiska: fotoelektryczne, Comptona lub kreacji par. W przypadku rozproszenia Comptonowskiego, możemy stwierdzić, że w wyniku tego oddziaływania',
       options = '[{"id":"a","text":"zarówno długość jak i częstotliwość fali promieniowania zmniejszają się"},{"id":"b","text":"długość fali promieniowania zmniejsza się"},{"id":"c","text":"częstotliwość fali promieniowania zwiększa się"},{"id":"d","text":"długość fali promieniowania zwiększa się a częstotliwość zmniejsza się"}]'::jsonb,
       explanation = 'Efekt Comptona: foton traci energie (rozpraszany na elektronie), wiec jego częstotliwość maleje (E=hf), a długość fali rośnie ($\dfrac{\\lambda = c}{f})$.'
 WHERE id = 'biofiz-s2-079';

UPDATE public.questions
   SET text = 'Człowiek w swoim codziennym życiu narażony jest na wpływ promieniowania jonizującego, pochodzącego od czynników naturalnych (promieniowanie kosmiczne, promieniowanie z izotopów promieniotwórczych znajdujących się w niewielkich ilościach w otoczeniu). Związana z tym przeciętna dawka skuteczna (efektywna) promieniowania jonizującego dla człowieka od tła wynosi (Sv - Siwert)',
       options = '[{"id":"a","text":"$25 mSv$"},{"id":"b","text":"$2,5 Sv$"},{"id":"c","text":"$2,5 mSv$"},{"id":"d","text":"$0,25 Sv$"}]'::jsonb,
       explanation = 'Średnia roczna dawka promieniowania naturalnego: ok. 2-3 mSv (radon, promieniowanie kosmiczne, izotopy w żywności, promieniowanie z gruntu).'
 WHERE id = 'biofiz-s2-096';

UPDATE public.questions
   SET text = 'Współczynnik lepkości określa własności cieczy związane z wzajemnym oddziaływaniem molekuł w trakcie przepływu cieczy (w sąsiednich warstwach cieczy). Współczynnik ten definiowany jest jako iloraz',
       options = '[{"id":"a","text":"naprężenia ścinającego do powierzchni stykających się warstw"},{"id":"b","text":"prędkości ścinania do naprężenia ścinającego"},{"id":"c","text":"naprężenia ścinającego do prędkości ścinania"},{"id":"d","text":"prędkości ścinania do powierzchni stykających się warstw"}]'::jsonb,
       explanation = 'Współczynnik lepkości eta = naprężenie scinajace / szybkosc ścinania = tau / (dv/dy). Jednostka: Pa*s. Dla cieczy newtonowskiej eta = const.'
 WHERE id = 'biofiz-s2-098';

UPDATE public.questions
   SET text = 'Ciała stałe pod wpływem przyłożonej siły ulegają odkształceniom. Zdolność materiału do osiągnięcia nowych kształtów oraz zachowania kształtów uprzednio uzyskanych po zdjęciu obciążenia bez naruszenia spójności to',
       options = '[{"id":"a","text":"ciągliwość"},{"id":"b","text":"plastyczność"},{"id":"c","text":"sprężystość"},{"id":"d","text":"wytrzymałość"}]'::jsonb,
       explanation = 'Plastyczność to zdolność materiału do trwalego odkształcenia bez zerwania. Sprężystość - powrot do ksztaltu. Wytrzymałość - odpornosc na zniszczenie.'
 WHERE id = 'biofiz-s2-102';

UPDATE public.questions
   SET text = 'Jednym z parametrów stosowanych w rentgenowskiej tomografii komputerowej jest projekcja. Parametr ten jest definiowany wzorem ($l$ - natężenie wiązki padającej, l - natężenie wiązki przechodzącej, d - grubość woksla, ln () - logarytm naturalny)',
       options = '[{"id":"a","text":"i jest równy iloczynowi współczynników pochłaniania woksli, przez które przechodzi promieniowanie"},{"id":"b","text":"i jest równy sumie współczynników pochłaniania woksli, przez które przechodzi promieniowanie"},{"id":"c","text":"$P = d • \\ln(\\dfrac{l}{l}) i jest równy iloczynowi wspołczynnikow pochłaniania woksli, przez które przechodzi promieniowanie$"},{"id":"d","text":"$P = d • \\ln(\\dfrac{l}{l}) i jest równy sumie wspołczynnikow pochłaniania woksli, przez które przechodzi promieniowanie$"}]'::jsonb,
       explanation = 'Projekcja w CT to suma współczynników pochłaniania wzdłuż promienia RTG. Rekonstrukcja obrazu z wielu projekcji pod roznymi katami.'
 WHERE id = 'biofiz-s2-105';

UPDATE public.questions
   SET text = 'Przy przechodzeniu promieniowania jonizującego przez materiały dochodzi do oddziaływań, których miarą intensywności są dawki lub moce dawek. Jedną ze stosowanych jednostek tych wielkości jest Grej (Gy), który jest jednostką',
       options = '[{"id":"a","text":"mocy dawki pochłoniętej"},{"id":"b","text":"mocy dawki ekspozycyjnej"},{"id":"c","text":"dawki pochłoniętej"},{"id":"d","text":"dawki ekspozycyjnej"}]'::jsonb,
       explanation = 'Dawka pochłonięta D = energia zaabsorbowana / masa. Jednostka: Gy (gray) = J/kg. Mierzy energie zdeponowana w tkance.'
 WHERE id = 'biofiz-s2-118';

UPDATE public.questions
   SET text = 'Uzupełnij wg kolejności w tekście: Przy wdechu powiększa się powierzchnia pęcherzyków oraz ... się grubość pokrywających je surfaktantów i ... napięcie powierzchniowe.',
       options = '[{"id":"a","text":"zmniejsza, zwiększa"},{"id":"b","text":"zmniejsza, zmniejsza"},{"id":"c","text":"zwiększa, zmniejsza"},{"id":"d","text":"zwiększa, zwiększa"}]'::jsonb,
       explanation = 'Przy wdechu: powierzchnia pęcherzyków rośnie, stężenie surfaktantu maleje (rozcieczenie), napięcie powierzchniowe zwiększa się.'
 WHERE id = 'biofiz-s2-130';

UPDATE public.questions
   SET text = 'Jaka jest rola surfaktantów w procesie oddychania?',
       options = '[{"id":"a","text":"zmniejszają strumień dyfuzyjny tlenu przez powierzchnię pęcherzyków"},{"id":"b","text":"zmieniają współczynnik napięcia powierzchniowego pęcherzyków płucnych"},{"id":"c","text":"zmniejszają współczynnik sprężystości pęcherzyków płucnych"},{"id":"d","text":"zwiększają strumień dyfuzyjny tlenu przez powierzchnię pęcherzyków"}]'::jsonb,
       explanation = 'Surfaktant zmniejsza współczynnik napięcia powierzchniowego pęcherzyków płucnych. Zapobiega zapadaniu małych pęcherzyków (prawo Laplacea).'
 WHERE id = 'biofiz-s2-136';

UPDATE public.questions
   SET text = 'Fale ultradźwiękowe padając na ruchome struktury biologiczne ulegają odbiciu lub rozproszeniu i zmieniają swoją',
       options = '[{"id":"a","text":"częstotliwość"},{"id":"b","text":"gęstość"},{"id":"c","text":"prędkość"},{"id":"d","text":"ciśnienie akustyczne"}]'::jsonb,
       explanation = 'Efekt Dopplera: fala odbita od ruchomej struktury zmienia częstotliwość. Jesli struktura zbliza się, częstotliwość rośnie; jesli oddala, maleje. Podstawa USG Doppler.'
 WHERE id = 'biofiz-s3-013';

UPDATE public.questions
   SET text = 'Biorąc pod uwagę długości kosteczek słuchowych oraz różne powierzchnie błony okienka owalnego i bębenka przyjmuje się,że wzmocnienie dźwięku w uchu środkowym jest',
       options = '[{"id":"a","text":"około 20 krotne"},{"id":"b","text":"około 5 krotne"},{"id":"c","text":"około 25 krotne"},{"id":"d","text":"około 10 krotne"}]'::jsonb,
       explanation = 'Układ kosteczek słuchowych i stosunek powierzchni błony bebenkowej do okienka owalnego daje wzmocnienie ok. 20-22 razy. Konieczne do dopasowania impedancji powietrze-plyny ucha wewnetrznego.'
 WHERE id = 'biofiz-s3-014';

UPDATE public.questions
   SET text = 'Wartość pochodnej funkcji w danym punkcie określa',
       options = '[{"id":"a","text":"wartość funkcji w danym punkcie i gdy pochodna jest ujemna to funkcja jest malejąca"},{"id":"b","text":"jak szybko zmienia się funkcja i gdy pochodna jest dodatnia to funkcja jest rosnąca"},{"id":"c","text":"wartość funkcji w danym punkcie i gdy pochodna jest dodatnia to funkcja jest rosnąca"},{"id":"d","text":"jak szybko zmienia się funkcja i gdy pochodna jest ujemna to funkcja jest rosnąca"}]'::jsonb,
       explanation = 'Pochodna określa szybkosc zmiany funkcji (nachylenie stycznej). Gdy pochodna > 0, funkcja rośnie; gdy pochodna < 0, funkcja maleje; gdy pochodna = 0, funkcja ma ekstremum.'
 WHERE id = 'biofiz-w1-027';

UPDATE public.questions
   SET text = 'Rozpraszanie Rayleigha cechuje się tym, że rozmiary struktur rozpraszających są',
       options = '[{"id":"a","text":"dużo mniejsze od długości fali ultradźwiękowej"},{"id":"b","text":"porównywalne z długością fali ultradźwiękowej"},{"id":"c","text":"dużo większe od długości fali ultradźwiękowej"},{"id":"d","text":"nie mają związku z długością fali ultradźwiękowej"}]'::jsonb,
       explanation = 'Rozpraszanie Rayleigha zachodzi gdy rozmiary struktur rozpraszających sa dużo mniejsze od długości fali (d << lambda). Typowe dla małych cząstek, silnie zależy od częstotliwości (~f^4).'
 WHERE id = 'biofiz-w3-019';

UPDATE public.questions
   SET text = 'Natężenie promieniowania definiuje wzór',
       options = '[{"id":"a","text":"$I = \\dfrac{E}{S} · t, gdzie E jest energia fali, S jest powierzchnią przez ktora fala przechodzi a t - jest czasem przejscia fali przez powierzchnie S$"},{"id":"b","text":"$I = \\dfrac{E}{S,} gdzie E jest energia fali a S jest powierzchnią przez ktora fala przechodzi$"},{"id":"c","text":"$I = \\dfrac{P}{t,} gdzie P jest moca fali a t - jest czasem przejscia fali o mocy P$"},{"id":"d","text":"$I = \\dfrac{E}{P} · t, gdzie P jest moca fali, S jest powierzchnią przez ktora fala przechodzi a t - jest czasem przejscia fali przez powierzchnie S$"}]'::jsonb,
       explanation = 'Natężenie promieniowania I = E/(S*t) = P/S, gdzie E to energia, S powierzchnią, t czas, P moc. Jednostka: W/m^2. To energia przypadajaca na jednostke powierzchni w jednostce czasu.'
 WHERE id = 'biofiz-w4-004';

UPDATE public.questions
   SET text = 'Dwukrotne zwiększenie wysokiego napięcia w lampie rentgenowskiej spowoduje:',
       options = '[{"id":"a","text":"dwukrotne zwiększenie granicy krótkofalowej promieniowania i zmniejszenie natężenia promieniowania w całym zakresie widma"},{"id":"b","text":"dwukrotne zmniejszenie granicy krótkofalowej promieniowania i zwiększenie natężenia promieniowania w całym zakresie widma"},{"id":"c","text":"dwukrotne zwiększenie granicy krótkofalowej promieniowania i zwiększenie natężenia promieniowania w całym zakresie widma"},{"id":"d","text":"dwukrotne zmniejszenie granicy krótkofalowej promieniowania i zmniejszenie natężenia promieniowania w całym zakresie widma"}]'::jsonb,
       explanation = 'Podwojenie napięcia: $lambda_{min} = \dfrac{hc}{eU}$, wiec 2x U -> lambda_min/2 (granica krotkofalowa maleje dwukrotnie). Natezenie promieniowania rośnie proporcjonalnie do U^2.'
 WHERE id = 'biofiz-w4-018';

UPDATE public.questions
   SET text = 'Dawka skuteczna promieniowania jonizującego dla człowieka od tła wynosi:',
       options = '[{"id":"a","text":"$2.5 mSv$"},{"id":"b","text":"$250 MSv$"},{"id":"c","text":"$0.25 kSv$"},{"id":"d","text":"$2.5 Sv$"}]'::jsonb,
       explanation = 'Naturalne promieniowanie tła (kosmiczne + ziemskie + radon) daje dawkę ok. 2-3 mSv/rok dla przecietnego człowieka. W Polsce ok. 2.5 mSv/rok. To dawka referencyjna do porownan.'
 WHERE id = 'biofiz-w4-029';

UPDATE public.questions
   SET text = 'Dawki pochłonięte przez pacjenta podczas tomografii rentgenowskiej:',
       options = '[{"id":"a","text":"są znacznie większe od dawki promieniowania tła"},{"id":"b","text":"są znacznie mniejsze od dawki promieniowania tła"},{"id":"c","text":"nie mogą być porównywalne z dawką promieniowania tła ze względu na różne jednostki"},{"id":"d","text":"są takie same jak dawka promieniowania tła"}]'::jsonb,
       explanation = 'Dawka podczas CT (5-25 mSv) jest znacznie większa od rocznej dawki tła (ok. 2.5 mSv). Jedno badanie CT glowy to ok. 2 mSv, CT brzucha ok. 10-15 mSv.'
 WHERE id = 'biofiz-w4-034';

UPDATE public.questions
   SET text = 'Jednostką równoważnika dawki pochłoniętej jest',
       options = '[{"id":"a","text":"grej (Gy)"},{"id":"b","text":"siwert (Sv)"},{"id":"c","text":"$\\dfrac{C}{kg}$"},{"id":"d","text":"bekerel (Bq)"}]'::jsonb,
       explanation = 'Równoważnik dawki (dawka skuteczna) w siewertach (Sv). H = D * w_R * w_T, gdzie D w Gy, w_R to współczynnik wagowy promieniowania.'
 WHERE id = 'biofiz-w5-063';

UPDATE public.questions
   SET text = 'Prawo Bragga przedstawia równanie (gdzie: d - stała, α - kąt pod którym obserwujemy wzmocnienie, a - odległość między płaszczyznami)',
       options = '[{"id":"a","text":"$2d = a \\cdot sin\\\\alpha$"},{"id":"b","text":"$d = a \\cdot sin2\\\\alpha$"},{"id":"c","text":"$d = 2 \\cdot a \\cdot sin2\\\\alpha$"},{"id":"d","text":"$d = 2 \\cdot a \\cdot sin\\\\alpha$"}]'::jsonb,
       explanation = 'Prawo Bragga: $n \cdot \$\\$\\lambda = 2d \cdot \\\\\\\\\\sin(\\\\\alpha)$$. n to rz$ąd dyfrakcji, d to odległość międzypłaszczyznowa, alpha to kąt.'
 WHERE id = 'biofiz-w5-197';

UPDATE public.questions
   SET text = 'Jednostką równoważnika dawki pochłoniętej w układzie SI jest',
       options = '[{"id":"a","text":"$1 Bq (bekerel) = 1 \\dfrac{rozpad}{s}$"},{"id":"b","text":"$1 Sv (siwert) = \\dfrac{1J}{kg}$"},{"id":"c","text":"$1 \\dfrac{C}{kg} = 1 \\dfrac{kulomb}{kilogram}$"},{"id":"d","text":"$1 Gy (grej) = 1 \\dfrac{J}{kg}$"}]'::jsonb,
       explanation = 'Równoważnik dawki (dawka równoważna) w siewertach (Sv). 1 Sv = 1 J/kg (wymiarowo jak Gy, ale z uwzględnieniem w_R).'
 WHERE id = 'biofiz-w5-202';

UPDATE public.questions
   SET text = 'Jednostką efektywnego równoważnika dawki (dawki skutecznej) jest',
       options = '[{"id":"a","text":"Grej (Gy)"},{"id":"b","text":"Siwert (Sv)"},{"id":"c","text":"Bekerel (Bq)"},{"id":"d","text":"$\\dfrac{C}{kg}$"}]'::jsonb,
       explanation = 'Dawka skuteczna (efektywna) w siewertach (Sv). E = suma(w_T * H_T).'
 WHERE id = 'biofiz-w5-215';

UPDATE public.questions
   SET text = 'Z zależności siły międzyatomowej F od odległości r pomiędzy atomami (wykres) można stwierdzić, że w miarę zbliżania się do atomów do siebie siły',
       options = '[{"id":"a","text":"odpychające maleją i przechodzą w siły przyciągające, które powoli rosną"},{"id":"b","text":"przyciągające maleją i przechodzą w siły odpychające które powoli rosną"},{"id":"c","text":"odpychające rosną, potem maleją i przechodzą w siły przyciągające"},{"id":"d","text":"przyciągające rosną, potem maleją i przechodzą w siły odpychające"}]'::jsonb,
       explanation = 'Siły miedzyatomowe: przy małych odleglosciach dominuja siły odpychania (szybko malejace), przy wiekszych - siły przyciagania. Rownowaga przy r = r_0.'
 WHERE id = 'biofiz-w5-251';

UPDATE public.questions
   SET text = 'Rozpad promieniotwórczy beta minus polega na przemianie',
       options = '[{"id":"a","text":"protonu w neutron, elektron i antyneutrino elektronowe"},{"id":"b","text":"neutronu w proton, pozyton i neutrino elektronowe"},{"id":"c","text":"neutronu w proton, pozyton i antyneutrino elektronowe"},{"id":"d","text":"neutronu w proton, elektron i antyneutrino elektronowe"}]'::jsonb,
       explanation = 'Rozpad beta minus: neutron -> proton + elektron + antyneutrino elektronowe. Liczba atomowa Z rośnie o 1, liczba masowa A bez zmian.'
 WHERE id = 'biofiz-w5-257';

UPDATE public.questions
   SET text = 'W wiązaniu van der Waalsa zasięg sił odpychania jest',
       options = '[{"id":"a","text":"jest to wiązanie w którym występują tylko siły przyciągające"},{"id":"b","text":"znacznie dłuższy aniżeli sił przyciągania"},{"id":"c","text":"jest to wiązanie, w którym występują tylko siły odpychające"},{"id":"d","text":"znacznie krótszy aniżeli sił przyciągania"}]'::jsonb,
       explanation = 'W wiązaniu van der Waalsa siły odpychania mają znacznie krótszy zasięg niż siły przyciągania. Odpychanie dominuje przy małych odleglosciach (nakladanie powlok elektronowych).'
 WHERE id = 'biofiz-w5-263';

UPDATE public.questions
   SET text = 'Jednostką dawki pochłoniętej jest',
       options = '[{"id":"a","text":"grej (Gy)"},{"id":"b","text":"bekerel (Bq)"},{"id":"c","text":"$\\dfrac{C}{kg}$"},{"id":"d","text":"siwert (Sv)"}]'::jsonb,
       explanation = 'Dawka pochłonięta mierzona w grejach (Gy). 1 Gy = 1 J/kg. Dawka skuteczna (równoważna) - w siewertach (Sv). Aktywność - w bekerelach (Bq).'
 WHERE id = 'biofiz-w5-269';

UPDATE public.questions
   SET text = 'Dwukrotne zwiększenie wysokiego napięcia w lampie rentgenowskiej spowoduje dwukrotne',
       options = '[{"id":"a","text":"zwiększenie granicy krótkofalowej promieniowania i zmniejszenie natężenia promieniowania w całym zakresie widma"},{"id":"b","text":"zmniejszenie granicy krótkofalowej promieniowania i zmniejszenie natężenia promieniowania w całym zakresie widma"},{"id":"c","text":"zwiększenie granicy krótkofalowej promieniowania i zwiększenie natężenia promieniowania w całym zakresie widma"},{"id":"d","text":"zmniejszenie granicy krótkofalowej promieniowania i zwiększenie natężenia promieniowania w całym zakresie widma"}]'::jsonb,
       explanation = 'Lambda_min = hc/(eU). Dwukrotne zwiększenie napięcia U: lambda_min maleje o polowe (granica krotkofalowa przesuwa się). Natezenie RTG rośnie.'
 WHERE id = 'biofiz-w5-273';

UPDATE public.questions
   SET text = 'Jednostką współczynnika lepkości cieczy nie jest',
       options = '[{"id":"a","text":"$\\dfrac{Ns}{m2}$"},{"id":"b","text":"$Pa \\cdot s$"},{"id":"c","text":"$\\dfrac{kg}{m} \\cdot s$"},{"id":"d","text":"$\\dfrac{Pa}{s}$"}]'::jsonb,
       explanation = 'Jednostki lepkości: Pa*s = Ns/m^2 = kg/(m*s). Pa/s NIE jest jednostka lepkości - wymiar nie zgadza się (lepkość = naprężenie / prędkość scinania).'
 WHERE id = 'biofiz-w5-277';

UPDATE public.questions
   SET text = 'Dawka skuteczna promieniowania jonizującego dla człowieka od tła wynosi',
       options = '[{"id":"a","text":"$25 mSv$"},{"id":"b","text":"$2,5 mSv$"},{"id":"c","text":"$0,25 mSv$"},{"id":"d","text":"$2,5 Sv$"}]'::jsonb,
       explanation = 'Dawka skuteczna od tła naturalnego: ok. 2-3 mSv/rok (radon, promieniowanie kosmiczne, izotopy w żywności, promieniowanie z gruntu).'
 WHERE id = 'biofiz-w5-281';

UPDATE public.questions
   SET text = 'Jednostką dawki ekspozycyjnej jest',
       options = '[{"id":"a","text":"$\\dfrac{J}{kg}$"},{"id":"b","text":"Grej (Gy)"},{"id":"c","text":"Bekerel (Bq)"},{"id":"d","text":"$\\dfrac{C}{kg}$"}]'::jsonb,
       explanation = 'Dawka ekspozycyjna (kerama): jednostka C/kg. Mierzy jonizacje powietrza przez promieniowanie X lub gamma. Dawka pochłonięta: Gy (J/kg).'
 WHERE id = 'biofiz-w5-287';

UPDATE public.questions
   SET text = 'Dla oka z wadą krótkowzroczności refrakcja R i odległość punktu dalekiego od oka SD spełniają zależności:',
       options = '[{"id":"a","text":"$R > 0 oraz S = R-1 D$"},{"id":"b","text":"$R > 0 oraz S = ∞ D$"},{"id":"c","text":"$R < 0 oraz S = ∞ D$"},{"id":"d","text":"R < 0 oraz S < 0 D"}]'::jsonb,
       explanation = 'Krótkowzroczność: refrakcja R < 0 (oko ma za duza moc). Punkt daleki S_D w skończonej odległości (przed oczami, nie w nieskonczonosci). Potrzebne soczewki rozpraszajace.'
 WHERE id = 'biofiz-w5-297';

COMMIT;
