-- ============================================================
-- BATCH: e_anat_sto_2025/2  ·  subject_id=anatomia  ·  SHARED (oba kierunki, tracks=NULL)
-- Źródło: Egzamin anatomia STOMA SUM 2025 (ANATSTO e2025-2), 100 pytań (egzaminy STOMATOLOGII)
-- tracks NULL (anatomia wspólna) · source_code = oryginalne ANATSTO-NNN
-- Self-numbering id per dział = max seq z bazy + 1
--
-- Wersja po dedup (2026-05-28): 13 pytań — wycięte 87 duplikaty (batch + baza).
-- Audyt: exports/anatomia-batch-sto-2025-2-dedup-audit.md
-- ============================================================

WITH new_rows (seq, topic_id, qtext, opts, correct, expl, subtheme, srccode) AS (
 VALUES
(1, 'ANA-CZA',
   'Ściana górna jamy bębenkowej leży',
   '[{"id": "a", "text": "poniżej dołu przedniego czaszki"}, {"id": "b", "text": "poniżej dołu środkowego czaszki"}, {"id": "c", "text": "poniżej dołu tylnego czaszki"}, {"id": "d", "text": "AB"}, {"id": "e", "text": "BC"}]'::jsonb,
   'b',
   $E$Ściana górna jamy bębenkowej to **strop jamy bębenkowej** (paries tegmentalis), utworzony przez cienką blaszkę kostną **tegmen tympani** części skalistej kości skroniowej. Oddziela on ucho środkowe od **dołu środkowego czaszki**, w którym spoczywa płat skroniowy mózgu. Cienkość tej blaszki ma znaczenie kliniczne: zapalenie ucha środkowego może szerzyć się do jamy czaszki, wywołując ropień skroniowy lub zapalenie opon. Dół przedni leży nad oczodołami i zatokami, dół tylny nad tylną częścią piramidy.$E$,
   'jama bębenkowa', 'ANATSTO-409'),
(2, 'ANA-TRZ',
   'Brodawka dwunastnicza większa jest ujściem',
   '[{"id": "a", "text": "przewodu pęcherzykowego"}, {"id": "b", "text": "przewodu wątrobowego wspólnego"}, {"id": "c", "text": "przewodu wątrobowego prawego"}, {"id": "d", "text": "przewodu wątrobowego lewego"}, {"id": "e", "text": "przewodu żółciowego wspólnego"}]'::jsonb,
   'e',
   $E$Brodawka dwunastnicza większa (**brodawka Vatera**) leży na ścianie przyśrodkowej części zstępującej dwunastnicy. Uchodzi do niej **bańka wątrobowo-trzustkowa** (bańka Vatera) — wspólne ujście **przewodu żółciowego wspólnego** (ductus choledochus) i **przewodu trzustkowego** (Wirsunga), otoczone **zwieraczem Oddiego**. Przewód pęcherzykowy łączy się z wątrobowym wspólnym, tworząc przewód żółciowy wspólny — uchodzi pośrednio. Brodawka mniejsza to ujście przewodu trzustkowego dodatkowego (Santoriniego).$E$,
   'drogi żółciowe', 'ANATSTO-411'),
(3, 'ANA-OUN',
   'Jądro IV nerwu czaszkowego leży',
   '[{"id": "a", "text": "w dole równoległobocznym"}, {"id": "b", "text": "na wysokości wzgórków górnych blaszki pokrywy"}, {"id": "c", "text": "na wysokości wzgórków dolnych blaszki pokrywy"}, {"id": "d", "text": "ciał suteczkowatych bocznych"}, {"id": "e", "text": "ciał suteczkowatych przyśrodkowych"}]'::jsonb,
   'c',
   $E$Nerw IV (**bloczkowy**, n. trochlearis) unerwia mięsień skośny górny gałki ocznej. Jego jądro ruchowe leży w **śródmózgowiu na wysokości wzgórków dolnych** (colliculi inferiores) blaszki pokrywy. Nerw IV jest jedynym nerwem czaszkowym wychodzącym z **grzbietowej** powierzchni pnia mózgu i jedynym krzyżującym się przed wyjściem. Jądro III (okoruchowego) leży wyżej, na poziomie wzgórków górnych. Długi wewnątrzczaszkowy przebieg czyni n. IV podatnym na urazy.$E$,
   'nerwy czaszkowe — jądra', 'ANATSTO-413'),
(4, 'ANA-NER',
   'Źródła włókien przywspółczulnych dla przełyku to',
   '[{"id": "a", "text": "gałęzie sercowe szyjne"}, {"id": "b", "text": "pień współczulny"}, {"id": "c", "text": "nerw X"}, {"id": "d", "text": "gałęzie sercowe szyjne górne, środkowe"}, {"id": "e", "text": "nerw IX"}]'::jsonb,
   'c',
   $E$Unerwienie przywspółczulne przełyku pochodzi z **nerwu błędnego (X)**. W odcinku szyjnym i górnym piersiowym włókna biegną przez **nerwy krtaniowe wsteczne**, a poniżej wnęk płucnych oba nerwy błędne tworzą **splot przełykowy**, z którego powstają pnie błędne przedni i tylny. Pień współczulny dostarcza włókna współczulne (nie przywspółczulne). Nerw IX (językowo-gardłowy) unerwia gardło i górną część, lecz nie przełyk właściwy. Pobudzenie n. X nasila perystaltykę i wydzielanie gruczołów.$E$,
   'unerwienie przełyku', 'ANATSTO-416'),
(5, 'ANA-NER',
   'Ruchowe komórki nerwu IX leżą w',
   '[{"id": "a", "text": "jądrze ślinowym górnym"}, {"id": "b", "text": "jądrze ślinowym dolnym"}, {"id": "c", "text": "jądrze pasma samotnego"}, {"id": "d", "text": "jądrze dwuznacznym"}, {"id": "e", "text": "jądrze dodatkowym"}]'::jsonb,
   'd',
   $E$Nerw IX (**językowo-gardłowy**) ma cztery jądra. Włókna **ruchowe** (somatyczne) pochodzą z **jądra dwuznacznego** (nucleus ambiguus), wspólnego dla nerwów IX, X i XI — unerwiają mięsień rylcowo-gardłowy. Jądro ślinowe dolne dostarcza włókna przywspółczulne wydzielnicze do ślinianki przyusznej (przez n. uszno-skroniowy). Jądro pasma samotnego odbiera czucie smakowe i trzewne. Jądro ślinowe górne należy do nerwu VII, a jądro dodatkowe — do nerwu XI.$E$,
   'nerw językowo-gardłowy — jądra', 'ANATSTO-417'),
(6, 'ANA-OUN',
   'Ścianę boczną rogu przedniego komory bocznej ogranicza',
   '[{"id": "a", "text": "wzgórze"}, {"id": "b", "text": "podwzgórze"}, {"id": "c", "text": "ogon jądra ogoniastego"}, {"id": "d", "text": "głowa jądra ogoniastego"}, {"id": "e", "text": "zasuwka"}]'::jsonb,
   'd',
   $E$Róg przedni (czołowy) komory bocznej ma ściany utworzone przez: **głowę jądra ogoniastego** ścianę boczną, **przegrodę przezroczystą** ścianę przyśrodkową, a strop i ścianę przednią — **ciało modzelowate** (kolano i dziób). Jądro ogoniaste towarzyszy komorze na całym przebiegu: głowa przy rogu przednim, trzon przy części środkowej, ogon przy rogu dolnym (skroniowym). Wzgórze graniczy z częścią środkową i rogiem tylnym. Zasuwka (obex) należy do komory czwartej.$E$,
   'komora boczna', 'ANATSTO-418'),
(7, 'ANA-NAC',
   'Zawartości trójkąta tętnicy szyjnej nie stanowi',
   '[{"id": "a", "text": "nerw podjęzykowy"}, {"id": "b", "text": "pętla szyjna"}, {"id": "c", "text": "nerw krtaniowy wsteczny"}, {"id": "d", "text": "tętnica szyjna zewnętrzna"}, {"id": "e", "text": "tętnica szyjna wewnętrzna"}]'::jsonb,
   'c',
   $E$Trójkąt tętnicy szyjnej (mostkowo-obojczykowo-sutkowy, brzusiec górny łopatkowo-gnykowego, tylny dwubrzuścowego) zawiera: podział **tętnicy szyjnej wspólnej**, żyłę szyjną wewnętrzną, **nerw podjęzykowy (XII)**, **pętlę szyjną**, nerw błędny i krtaniowy górny. **Nerw krtaniowy wsteczny** biegnie głębiej w rowku tchawiczo-przełykowym, w dolnej części szyi — nie należy do tego trójkąta. Jest gałęzią nerwu błędnego.$E$,
   'trójkąt tętnicy szyjnej', 'ANATSTO-430'),
(8, 'ANA-TRZ',
   'Część brzuszna moczowodu',
   '[{"id": "a", "text": "leży na mięśniu lędźwiowym większym"}, {"id": "b", "text": "leży do przodu od mięśnia biodrowego"}, {"id": "c", "text": "leży do tyłu od nerwu płciowo-udowego"}, {"id": "d", "text": "leży do tyłu od nerwu biodrowo-podbrzusznego"}, {"id": "e", "text": "brak prawidłowej odpowiedzi"}]'::jsonb,
   'a',
   $E$Część brzuszna moczowodu biegnie zaotrzewnowo po przedniej powierzchni **mięśnia lędźwiowego większego** (m. psoas major), ku dołowi i przyśrodkowo. Krzyżuje się **do przodu** z nerwem płciowo-udowym (który leży na powięzi mięśnia lędźwiowego, więc moczowód jest do przodu, nie do tyłu od niego). Następnie krzyżuje naczynia biodrowe wspólne przy wejściu do miednicy. Moczowód otrzymuje krew z tętnic nerkowej, jajnikowej/jądrowej, biodrowych i pęcherzowej. Mięsień biodrowy leży bardziej bocznie.$E$,
   'moczowód — przebieg', 'ANATSTO-440'),
(9, 'ANA-NAC',
   'Ścianę tylną trójkąta tętnicy językowej (Pirogowa) stanowi',
   '[{"id": "a", "text": "nerw podjęzykowy"}, {"id": "b", "text": "mięsień rylcowo-językowy"}, {"id": "c", "text": "żyła językowa"}, {"id": "d", "text": "ścięgno pośrednie mięśnia dwubrzuścowego"}, {"id": "e", "text": "mięsień bródkowo-językowy"}]'::jsonb,
   'd',
   $E$Trójkąt Pirogowa służy do odszukania tętnicy językowej. Granice: od góry **nerw podjęzykowy (XII)**, od dołu **ścięgno pośrednie mięśnia dwubrzuścowego**, od przodu tylny brzeg mięśnia żuchwowo-gnykowego. Dnem jest **mięsień gnykowo-językowy**, pod którym biegnie tętnica językowa. Ścianę tylno-dolną tworzy ścięgno pośrednie dwubrzuścowego. Tętnica jest tu podwiązywana, leży głębiej niż nerw XII, oddzielona od niego mięśniem gnykowo-językowym stanowiącym dno trójkąta.$E$,
   'trójkąt Pirogowa', 'ANATSTO-443'),
(10, 'ANA-CZA',
   'Elementy kości klinowej wchodzą w skład',
   '[{"id": "a", "text": "dołu przedniego czaszki"}, {"id": "b", "text": "dołu środkowego czaszki"}, {"id": "c", "text": "dołu tylnego czaszki"}, {"id": "d", "text": "A i B"}, {"id": "e", "text": "A, B i C"}]'::jsonb,
   'e',
   $E$**Kość klinowa** uczestniczy we wszystkich trzech dołach czaszki. W **dole przednim** — skrzydła mniejsze i część trzonu. W **dole środkowym** — skrzydła większe, trzon z siodłem tureckim (większość dna). W **dole tylnym** — tylna powierzchnia trzonu (stok, clivus). Jest centralnym elementem podstawy czaszki, zawiera zatokę klinową i otwory: okrągły, owalny, kolcowy, szczelinę oczodołową górną. Stąd wszystkie trzy doły.$E$,
   'kość klinowa', 'ANATSTO-445'),
(11, 'ANA-MIE',
   'Przyczepy początkowe mięśnia skrzydłowego przyśrodkowego znajdują się',
   '[{"id": "a", "text": "w dole skrzydłowym"}, {"id": "b", "text": "na wyrostku piramidowym kości podniebiennej"}, {"id": "c", "text": "na wyrostku podniebiennym szczęki (guz szczęki)"}, {"id": "d", "text": "A i B"}, {"id": "e", "text": "A, B i C"}]'::jsonb,
   'e',
   $E$**Mięsień skrzydłowy przyśrodkowy** rozpoczyna się głównie w **dole skrzydłowym** (między blaszkami wyrostka skrzydłowatego), a dodatkowo od **wyrostka piramidowego kości podniebiennej** i **guza szczęki**. Przyczep końcowy to guzowatość skrzydłowa na przyśrodkowej powierzchni kąta żuchwy. Razem ze żwaczem działa jak proca (unosi żuchwę). Unerwia go nerw skrzydłowy przyśrodkowy z V3. Wszystkie trzy przyczepy są prawidłowe.$E$,
   'mięsień skrzydłowy przyśrodkowy', 'ANATSTO-450'),
(12, 'ANA-NER',
   'Jądro ślinowe górne to',
   '[{"id": "a", "text": "jądro przywspółczulne nerwu V"}, {"id": "b", "text": "jądro przywspółczulne nerwu VII"}, {"id": "c", "text": "jądro przywspółczulne nerwu IX"}, {"id": "d", "text": "jądro przywspółczulne nerwu X"}, {"id": "e", "text": "jądro przywspółczulne nerwu XII"}]'::jsonb,
   'b',
   $E$**Jądro ślinowe górne** jest jądrem przywspółczulnym **nerwu twarzowego (VII)**, leżącym w moście. Wysyła włókna przez nerw pośredni: struną bębenkową do zwoju podżuchwowego (ślinianki podżuchwowa, podjęzykowa) i nerwem skalistym większym do zwoju skrzydłowo-podniebiennego (gruczoł łzowy, gruczoły nosa). **Jądro ślinowe dolne** należy do nerwu IX. Jądro grzbietowe X unerwia trzewia. Nerwy V i XII nie mają jąder przywspółczulnych.$E$,
   'jądra przywspółczulne', 'ANATSTO-456'),
(13, 'ANA-NER',
   'W trójkącie tętnicy szyjnej znajdują się gałęzie nerwów czaszkowych:',
   '[{"id": "a", "text": "VII i IX"}, {"id": "b", "text": "IX i X"}, {"id": "c", "text": "X i XII"}, {"id": "d", "text": "X oraz pętli szyjnej"}, {"id": "e", "text": "XI oraz splotu szyjnego"}]'::jsonb,
   'c',
   $E$W **trójkącie tętnicy szyjnej** (ograniczonym brzuścem tylnym m. dwubrzuścowego, m. łopatkowo-gnykowym i m. mostkowo-obojczykowo-sutkowym) przebiegają gałęzie nerwu **X (błędnego)** — m.in. nerw krtaniowy górny — oraz nerw **XII (podjęzykowy)**, który tu oddaje korzeń górny pętli szyjnej. Trójkąt zawiera też podział tętnicy szyjnej wspólnej na zewnętrzną i wewnętrzną oraz opuszkę z kłębkiem szyjnym (baroreceptory i chemoreceptory). Stąd poprawna odpowiedź C (X i XII).$E$,
   'trójkąt tętnicy szyjnej', 'ANATSTO-507')
),
maxes AS (
  SELECT topic_id, COALESCE(MAX( (regexp_match(id, '([0-9]+)$'))[1]::int ), 0) AS mx
    FROM public.questions WHERE topic_id IN ('ANA-CZA', 'ANA-JAM', 'ANA-KON', 'ANA-MIE', 'ANA-NAC', 'ANA-NER', 'ANA-OBW', 'ANA-OUN', 'ANA-TRZ', 'ANA-TUL') GROUP BY topic_id
)
INSERT INTO public.questions
  (id, topic_id, text, options, correct_option_id, explanation,
   subtheme_label, source_code, batch_label, source_exam)
SELECT
  LOWER(n.topic_id) || '-' || LPAD((COALESCE(m.mx,0) + ROW_NUMBER() OVER (PARTITION BY n.topic_id ORDER BY n.seq))::text, 3, '0'),
  n.topic_id, n.qtext, n.opts, n.correct, n.expl,
  n.subtheme, n.srccode, 'e_anat_sto_2025/2', 'Egzamin anatomia STOMA SUM 2025 (ANATSTO e2025-2)'
FROM new_rows n LEFT JOIN maxes m ON m.topic_id = n.topic_id;

UPDATE public.topics t SET question_count = sub.cnt
  FROM (SELECT topic_id, COUNT(*) AS cnt FROM public.questions
         WHERE topic_id IN ('ANA-CZA', 'ANA-JAM', 'ANA-KON', 'ANA-MIE', 'ANA-NAC', 'ANA-NER', 'ANA-OBW', 'ANA-OUN', 'ANA-TRZ', 'ANA-TUL') AND COALESCE(is_active,true)=true GROUP BY topic_id) sub
 WHERE t.id = sub.topic_id;
